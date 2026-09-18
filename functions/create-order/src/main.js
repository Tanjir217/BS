import { Client, ID, Query, TablesDB } from "node-appwrite";

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const PRODUCTS_TABLE_ID = process.env.APPWRITE_PRODUCTS_TABLE_ID;
const ORDERS_TABLE_ID = process.env.APPWRITE_ORDERS_TABLE_ID;
const ORDER_ITEMS_TABLE_ID = process.env.APPWRITE_ORDER_ITEMS_TABLE_ID;

const PAYMENT_METHODS = { COD: "cod" };
const PAYMENT_STATUSES = { PENDING: "pending" };
const ORDER_STATUSES = { PENDING: "pending" };

function getServerTablesDB(req) {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers["x-appwrite-key"]);
  return new TablesDB(client);
}

function generateOrderNumber(orderId) {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `BS-${date}-${orderId.slice(-6).toUpperCase()}`;
}

function assertPositiveInteger(value, fieldName) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }
  return number;
}

function assertNonNegativeInteger(value, fieldName) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) {
    throw new Error(`${fieldName} must be a valid non-negative integer.`);
  }
  return number;
}

function assertValidIdempotencyKey(value) {
  const key = String(value || "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,35}$/.test(key)) {
    const error = new Error("A valid idempotency key is required.");
    error.status = 400;
    throw error;
  }
  return key;
}

function getOrderResponse(order, idempotentReplay = false) {
  return {
    $id: order.$id,
    order_Number: order.order_Number,
    customer_ID: order.customer_ID,
    subtotal: order.subtotal,
    shipping_Cost: order.shipping_Cost,
    discount: order.discount,
    total: order.total,
    payment_Method: order.payment_Method,
    payment_Status: order.payment_Status,
    order_Status: order.order_Status,
    idempotency_Key: order.idempotency_Key,
    idempotentReplay,
  };
}

async function getOrderById(tablesDB, orderId) {
  try {
    return await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: ORDERS_TABLE_ID,
      rowId: orderId,
    });
  } catch (error) {
    if (error?.code === 404) return null;
    throw error;
  }
}

export default async ({ req, res, log, error: logError }) => {
  const userId = req.headers["x-appwrite-user-id"];

  if (!userId) {
    return res.json({ error: "Customer authentication is required." }, 401);
  }

  if (req.method !== "POST") {
    return res.json({ error: "Only POST requests are allowed." }, 405);
  }

  let payload;
  try {
    payload = JSON.parse(req.body || "{}");
  } catch {
    return res.json({ error: "Invalid request body." }, 400);
  }

  const {
    idempotencyKey,
    customer_Name,
    customer_Email = "",
    customer_Phone,
    shipping_Address,
    shipping_City,
    shipping_Postal_Code = "",
    shipping_Cost = 0,
    discount = 0,
    payment_Method = PAYMENT_METHODS.COD,
    notes = "",
    items = [],
  } = payload;

  let normalizedIdempotencyKey;
  try {
    normalizedIdempotencyKey = assertValidIdempotencyKey(idempotencyKey);
  } catch (error) {
    return res.json({ error: error.message }, error.status || 400);
  }

  const customerName = String(customer_Name || "").trim();
  const customerPhone = String(customer_Phone || "").trim();
  const shippingAddress = String(shipping_Address || "").trim();
  const shippingCity = String(shipping_City || "").trim();

  if (!customerName) return res.json({ error: "Customer name is required." }, 400);
  if (!customerPhone) return res.json({ error: "Customer phone is required." }, 400);
  if (!shippingAddress) return res.json({ error: "Shipping address is required." }, 400);
  if (!shippingCity) return res.json({ error: "Shipping city is required." }, 400);
  if (!Array.isArray(items) || items.length === 0) {
    return res.json({ error: "At least one order item is required." }, 400);
  }
  if (payment_Method !== PAYMENT_METHODS.COD) {
    return res.json({ error: "Only Cash on Delivery is currently available." }, 400);
  }

  try {
    const tablesDB = getServerTablesDB(req);
    const existingOrder = await getOrderById(tablesDB, normalizedIdempotencyKey);

    if (existingOrder) {
      if (existingOrder.customer_ID !== userId) {
        return res.json({
          success: false,
          error: "This idempotency key is already associated with another customer.",
          code: "IDEMPOTENCY_KEY_CONFLICT",
        }, 409);
      }
      log(`Idempotent order replay ${existingOrder.$id} for customer ${userId}`);
      return res.json({ success: true, order: getOrderResponse(existingOrder, true) });
    }

    const itemMap = new Map();
    for (const item of items) {
      if (!item?.productId) throw new Error("Product ID is required.");
      const quantity = assertPositiveInteger(item.quantity, `Quantity for ${item.productId}`);
      const expectedPrice = assertNonNegativeInteger(item.expectedPrice, `Expected price for ${item.productId}`);
      const existing = itemMap.get(item.productId);
      if (existing) existing.quantity += quantity;
      else itemMap.set(item.productId, { quantity, expectedPrice });
    }

    const orderItems = [];
    for (const [productId, requestedItem] of itemMap.entries()) {
      const response = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: PRODUCTS_TABLE_ID,
        queries: [Query.equal("$id", productId), Query.limit(1)],
        total: false,
      });
      const product = response.rows[0];
      if (!product) throw new Error(`Product ${productId} could not be found.`);
      if (!product.isActive) throw new Error(`${product.name} is no longer available.`);

      const unitPrice = assertNonNegativeInteger(product.price, `Price for ${product.name}`);
      if (requestedItem.expectedPrice !== unitPrice) {
        throw new Error(`${product.name} price has changed. Please review your bag before placing the order.`);
      }

      const stockQuantity = assertNonNegativeInteger(product.stockQuantity, `Stock for ${product.name}`);
      if (requestedItem.quantity > stockQuantity) {
        throw new Error(`${product.name} does not have enough stock.`);
      }

      const lineTotal = unitPrice * requestedItem.quantity;
      if (!Number.isSafeInteger(lineTotal)) throw new Error(`Line total is too large for ${product.name}.`);

      orderItems.push({
        product_ID: product.$id,
        product_Name: product.name,
        product_SKU: product.sku || "",
        product_Color: product.color || "",
        unit_Price: unitPrice,
        quantity: requestedItem.quantity,
        line_Total: lineTotal,
      });
    }

    const subtotal = orderItems.reduce((sum, item) => sum + item.line_Total, 0);
    const shippingCostNumber = assertNonNegativeInteger(shipping_Cost, "Shipping cost");
    const discountNumber = assertNonNegativeInteger(discount, "Discount");
    if (discountNumber > subtotal + shippingCostNumber) {
      throw new Error("Discount cannot be greater than the order amount.");
    }

    const total = subtotal + shippingCostNumber - discountNumber;
    if (!Number.isSafeInteger(total)) throw new Error("Order total is too large.");

    const transaction = await tablesDB.createTransaction();
    const orderId = normalizedIdempotencyKey;
    const orderNumber = generateOrderNumber(orderId);
    const operations = [];

    for (const item of orderItems) {
      operations.push({
        action: "decrement",
        databaseId: DATABASE_ID,
        tableId: PRODUCTS_TABLE_ID,
        rowId: item.product_ID,
        data: { value: item.quantity, min: 0, column: "stockQuantity" },
      });
    }

    operations.push({
      action: "create",
      databaseId: DATABASE_ID,
      tableId: ORDERS_TABLE_ID,
      rowId: orderId,
      data: {
        order_Number: orderNumber,
        idempotency_Key: normalizedIdempotencyKey,
        customer_ID: userId,
        customer_Name: customerName,
        customer_Email: String(customer_Email || "").trim(),
        customer_Phone: customerPhone,
        shipping_Address: shippingAddress,
        shipping_City: shippingCity,
        shipping_Postal_Code: String(shipping_Postal_Code || "").trim(),
        subtotal,
        shipping_Cost: shippingCostNumber,
        discount: discountNumber,
        total,
        payment_Method,
        payment_Status: PAYMENT_STATUSES.PENDING,
        order_Status: ORDER_STATUSES.PENDING,
        notes: String(notes || "").trim(),
      },
    });

    for (const item of orderItems) {
      operations.push({
        action: "create",
        databaseId: DATABASE_ID,
        tableId: ORDER_ITEMS_TABLE_ID,
        rowId: ID.unique(),
        data: {
          order_ID: orderId,
          product_ID: item.product_ID,
          product_Name: item.product_Name,
          product_SKU: item.product_SKU,
          product_Color: item.product_Color,
          unit_Price: item.unit_Price,
          quantity: item.quantity,
          line_Total: item.line_Total,
        },
      });
    }

    await tablesDB.createOperations({ transactionId: transaction.$id, operations });
    await tablesDB.updateTransaction({ transactionId: transaction.$id, commit: true });

    const createdOrder = await getOrderById(tablesDB, orderId);
    if (!createdOrder) throw new Error("Order was created but could not be retrieved.");

    log(`Order ${orderId} created for customer ${userId}`);
    return res.json({ success: true, order: getOrderResponse(createdOrder) });
  } catch (error) {
    try {
      const tablesDB = getServerTablesDB(req);
      const existingOrder = await getOrderById(tablesDB, normalizedIdempotencyKey);
      if (existingOrder) {
        if (existingOrder.customer_ID !== userId) {
          return res.json({
            success: false,
            error: "This idempotency key is already associated with another customer.",
            code: "IDEMPOTENCY_KEY_CONFLICT",
          }, 409);
        }
        log(`Recovered idempotent order ${existingOrder.$id} after create conflict`);
        return res.json({ success: true, order: getOrderResponse(existingOrder, true) });
      }
    } catch (recoveryError) {
      logError(`Idempotency recovery failed: ${recoveryError?.stack || recoveryError?.message || "Unknown error"}`);
    }

    logError(`Order creation failed: ${error?.stack || error?.message || "Unknown error"}`);
    return res.json({
      success: false,
      error: error?.message || "Unable to create order.",
    }, error?.status || 500);
  }
};