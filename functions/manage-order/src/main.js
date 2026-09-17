import { Client, Query, TablesDB, Teams } from "node-appwrite";

function getEnv(primaryName, legacyName) {
  return process.env[primaryName] || process.env[legacyName];
}

const DATABASE_ID = getEnv("APPWRITE_DATABASE_ID", "VITE_APPWRITE_DATABASE_ID");
const PRODUCTS_TABLE_ID = getEnv("APPWRITE_PRODUCTS_TABLE_ID", "VITE_APPWRITE_PRODUCTS_TABLE_ID");
const ORDERS_TABLE_ID = getEnv("APPWRITE_ORDERS_TABLE_ID", "VITE_APPWRITE_ORDERS_TABLE_ID");
const ORDER_ITEMS_TABLE_ID = getEnv("APPWRITE_ORDER_ITEMS_TABLE_ID", "VITE_APPWRITE_ORDER_ITEMS_TABLE_ID");
const MANAGEMENT_TEAM_ID = getEnv("APPWRITE_MANAGEMENT_TEAM_ID", "VITE_APPWRITE_MANAGEMENT_TEAM_ID");

const PATHAO_API_BASE_URL = getEnv("PATHAO_API_BASE_URL", "VITE_PATHAO_API_BASE_URL");
const PATHAO_ACCESS_TOKEN = getEnv("PATHAO_ACCESS_TOKEN", "VITE_PATHAO_ACCESS_TOKEN");
const PATHAO_STORE_ID = getEnv("PATHAO_STORE_ID", "VITE_PATHAO_STORE_ID");
const PATHAO_DELIVERY_TYPE = Number(getEnv("PATHAO_DELIVERY_TYPE", "VITE_PATHAO_DELIVERY_TYPE") || 48);
const PATHAO_ITEM_TYPE = Number(getEnv("PATHAO_ITEM_TYPE", "VITE_PATHAO_ITEM_TYPE") || 2);
const PATHAO_DEFAULT_ITEM_WEIGHT = getEnv("PATHAO_DEFAULT_ITEM_WEIGHT", "VITE_PATHAO_DEFAULT_ITEM_WEIGHT") || "0.5";

const ORDER_STATUSES = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

const PAYMENT_STATUSES = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
};

const CUSTOMER_CANCELLABLE_STATUSES = new Set([
  ORDER_STATUSES.PENDING,
  ORDER_STATUSES.CONFIRMED,
]);

const ORDER_STATUS_TRANSITIONS = {
  [ORDER_STATUSES.PENDING]: [ORDER_STATUSES.PENDING, ORDER_STATUSES.CONFIRMED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.CONFIRMED]: [ORDER_STATUSES.CONFIRMED, ORDER_STATUSES.PROCESSING, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.PROCESSING]: [ORDER_STATUSES.PROCESSING, ORDER_STATUSES.SHIPPED],
  [ORDER_STATUSES.SHIPPED]: [ORDER_STATUSES.SHIPPED, ORDER_STATUSES.DELIVERED],
  [ORDER_STATUSES.DELIVERED]: [ORDER_STATUSES.DELIVERED],
  [ORDER_STATUSES.CANCELLED]: [ORDER_STATUSES.CANCELLED],
};

const PAYMENT_STATUS_TRANSITIONS = {
  [PAYMENT_STATUSES.PENDING]: [PAYMENT_STATUSES.PENDING, PAYMENT_STATUSES.PAID, PAYMENT_STATUSES.FAILED],
  [PAYMENT_STATUSES.PAID]: [PAYMENT_STATUSES.PAID, PAYMENT_STATUSES.REFUNDED],
  [PAYMENT_STATUSES.FAILED]: [PAYMENT_STATUSES.FAILED, PAYMENT_STATUSES.PENDING],
  [PAYMENT_STATUSES.REFUNDED]: [PAYMENT_STATUSES.REFUNDED],
};

const MANAGEMENT_ROLES = new Set(["owner", "manager", "staff"]);

function getServerClient(req) {
  return new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers["x-appwrite-key"]);
}

function getUserId(req) {
  return req.headers["x-appwrite-user-id"];
}

function parseBody(req) {
  try {
    return JSON.parse(req.body || "{}");
  } catch {
    throw new Error("Invalid request body.");
  }
}

function assertConfigured() {
  const required = {
    APPWRITE_DATABASE_ID: DATABASE_ID,
    APPWRITE_PRODUCTS_TABLE_ID: PRODUCTS_TABLE_ID,
    APPWRITE_ORDERS_TABLE_ID: ORDERS_TABLE_ID,
    APPWRITE_ORDER_ITEMS_TABLE_ID: ORDER_ITEMS_TABLE_ID,
    APPWRITE_MANAGEMENT_TEAM_ID: MANAGEMENT_TEAM_ID,
  };

  const missing = Object.entries(required).filter(([, value]) => !value).map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing function configuration: ${missing.join(", ")}`);
  }
}

function assertPathaoConfigured() {
  const required = {
    PATHAO_API_BASE_URL,
    PATHAO_ACCESS_TOKEN,
    PATHAO_STORE_ID,
  };

  const missing = Object.entries(required).filter(([, value]) => !value).map(([key]) => key);

  if (missing.length > 0) {
    const error = new Error(`Pathao courier is not configured: ${missing.join(", ")}`);
    error.status = 503;
    throw error;
  }
}

async function assertManagementAccess(client, userId) {
  if (!userId) {
    const error = new Error("Management authentication is required.");
    error.status = 401;
    throw error;
  }

  const teams = new Teams(client);
  const memberships = await teams.listMemberships({
    teamId: MANAGEMENT_TEAM_ID,
    queries: [Query.equal("userId", userId), Query.equal("confirm", true), Query.limit(1)],
  });

  const membership = memberships.memberships?.[0];
  const hasManagementRole = membership?.roles?.some((role) => MANAGEMENT_ROLES.has(role));

  if (!membership || !hasManagementRole) {
    const error = new Error("You do not have permission to manage orders.");
    error.status = 403;
    throw error;
  }

  return membership;
}

async function getOrder(tablesDB, orderId) {
  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: ORDERS_TABLE_ID,
    queries: [Query.equal("$id", orderId), Query.limit(1)],
    total: false,
  });

  return response.rows[0] || null;
}

async function getOrderItems(tablesDB, orderId) {
  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: ORDER_ITEMS_TABLE_ID,
    queries: [Query.equal("order_ID", orderId)],
    total: false,
  });

  return response.rows;
}

function validateOrderTransition(currentStatus, nextStatus) {
  if (!Object.values(ORDER_STATUSES).includes(nextStatus)) {
    const error = new Error(`Invalid order status: ${nextStatus}`);
    error.status = 400;
    throw error;
  }

  const allowed = ORDER_STATUS_TRANSITIONS[currentStatus] || [];

  if (!allowed.includes(nextStatus)) {
    const error = new Error(`Cannot change order status from "${currentStatus}" to "${nextStatus}".`);
    error.status = 409;
    throw error;
  }
}

function validatePaymentTransition(currentStatus, nextStatus) {
  if (!Object.values(PAYMENT_STATUSES).includes(nextStatus)) {
    const error = new Error(`Invalid payment status: ${nextStatus}`);
    error.status = 400;
    throw error;
  }

  const allowed = PAYMENT_STATUS_TRANSITIONS[currentStatus] || [];

  if (!allowed.includes(nextStatus)) {
    const error = new Error(`Cannot change payment status from "${currentStatus}" to "${nextStatus}".`);
    error.status = 409;
    throw error;
  }
}

async function updateOrderStatus(tablesDB, orderId, nextStatus) {
  const order = await getOrder(tablesDB, orderId);

  if (!order) {
    const error = new Error("Order not found.");
    error.status = 404;
    throw error;
  }

  validateOrderTransition(order.order_Status, nextStatus);

  return tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: ORDERS_TABLE_ID,
    rowId: orderId,
    data: { order_Status: nextStatus },
  });
}

async function updatePaymentStatus(tablesDB, orderId, nextStatus) {
  const order = await getOrder(tablesDB, orderId);

  if (!order) {
    const error = new Error("Order not found.");
    error.status = 404;
    throw error;
  }

  validatePaymentTransition(order.payment_Status, nextStatus);

  return tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: ORDERS_TABLE_ID,
    rowId: orderId,
    data: { payment_Status: nextStatus },
  });
}

async function restoreStockAndCancel(tablesDB, order) {
  if (order.order_Status === ORDER_STATUSES.CANCELLED) {
    return order;
  }

  const items = await getOrderItems(tablesDB, order.$id);

  if (items.length === 0) {
    const error = new Error("Cannot cancel an order with no order items.");
    error.status = 409;
    throw error;
  }

  const transaction = await tablesDB.createTransaction();
  const operations = [];

  for (const item of items) {
    const quantity = Number(item.quantity);

    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      const error = new Error(`Invalid quantity on order item ${item.$id}.`);
      error.status = 409;
      throw error;
    }

    operations.push({
      action: "increment",
      databaseId: DATABASE_ID,
      tableId: PRODUCTS_TABLE_ID,
      rowId: item.product_ID,
      data: { value: quantity, column: "stockQuantity" },
    });
  }

  operations.push({
    action: "update",
    databaseId: DATABASE_ID,
    tableId: ORDERS_TABLE_ID,
    rowId: order.$id,
    data: { order_Status: ORDER_STATUSES.CANCELLED },
  });

  await tablesDB.createOperations({ transactionId: transaction.$id, operations });
  await tablesDB.updateTransaction({ transactionId: transaction.$id, commit: true });

  return getOrder(tablesDB, order.$id);
}

async function cancelOrder(tablesDB, orderId) {
  const order = await getOrder(tablesDB, orderId);

  if (!order) {
    const error = new Error("Order not found.");
    error.status = 404;
    throw error;
  }

  validateOrderTransition(order.order_Status, ORDER_STATUSES.CANCELLED);
  return restoreStockAndCancel(tablesDB, order);
}

async function cancelOrderForCustomer(tablesDB, orderId, userId) {
  if (!userId) {
    const error = new Error("Customer authentication is required.");
    error.status = 401;
    throw error;
  }

  const order = await getOrder(tablesDB, orderId);

  if (!order) {
    const error = new Error("Order not found.");
    error.status = 404;
    throw error;
  }

  if (order.customer_ID !== userId) {
    const error = new Error("You do not have access to this order.");
    error.status = 403;
    throw error;
  }

  if (!CUSTOMER_CANCELLABLE_STATUSES.has(order.order_Status)) {
    const error = new Error("This order can no longer be cancelled.");
    error.status = 409;
    throw error;
  }

  if (order.payment_Status !== PAYMENT_STATUSES.PENDING) {
    const error = new Error("A paid or refunded order must be handled by the store team.");
    error.status = 409;
    throw error;
  }

  return restoreStockAndCancel(tablesDB, order);
}

function getPathaoConsignmentId(payload) {
  return payload?.data?.consignment_id || payload?.data?.consignmentId || payload?.consignment_id || payload?.consignmentId || null;
}

async function createPathaoDelivery(tablesDB, orderId) {
  assertPathaoConfigured();

  const order = await getOrder(tablesDB, orderId);

  if (!order) {
    const error = new Error("Order not found.");
    error.status = 404;
    throw error;
  }

  if (![ORDER_STATUSES.CONFIRMED, ORDER_STATUSES.PROCESSING].includes(order.order_Status)) {
    const error = new Error("A Pathao shipment can only be created after the order is confirmed.");
    error.status = 409;
    throw error;
  }

  if (String(order.notes || "").includes("[Pathao:")) {
    const error = new Error("A Pathao shipment is already attached to this order.");
    error.status = 409;
    throw error;
  }

  const items = await getOrderItems(tablesDB, orderId);

  if (items.length === 0) {
    const error = new Error("Cannot create a courier shipment without order items.");
    error.status = 409;
    throw error;
  }

  const itemQuantity = items.reduce((total, item) => total + Number(item.quantity || 0), 0);
  const itemDescription = items
    .map((item) => `${item.product_Name || "Product"} x${item.quantity}`)
    .join(", ")
    .slice(0, 240);

  const recipientAddress = [order.shipping_Address, order.shipping_City, order.shipping_Postal_Code]
    .filter(Boolean)
    .join(", ")
    .slice(0, 250);

  const payload = {
    store_id: Number(PATHAO_STORE_ID),
    merchant_order_id: order.order_Number || order.$id,
    recipient_name: order.customer_Name,
    recipient_phone: order.customer_Phone,
    recipient_address: recipientAddress,
    delivery_type: PATHAO_DELIVERY_TYPE,
    item_type: PATHAO_ITEM_TYPE,
    special_instruction: String(order.notes || "").slice(0, 250),
    item_quantity: itemQuantity,
    item_weight: PATHAO_DEFAULT_ITEM_WEIGHT,
    item_description: itemDescription,
    amount_to_collect: order.payment_Method === "cod" ? Number(order.total || 0) : 0,
  };

  const response = await fetch(`${String(PATHAO_API_BASE_URL).replace(/\/$/, "")}/aladdin/api/v1/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${PATHAO_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  let responseBody = {};

  try {
    responseBody = JSON.parse(responseText || "{}");
  } catch {
    responseBody = { raw: responseText };
  }

  if (!response.ok) {
    const error = new Error(responseBody?.message || responseBody?.error || `Pathao returned HTTP ${response.status}.`);
    error.status = 502;
    throw error;
  }

  const consignmentId = getPathaoConsignmentId(responseBody);

  if (!consignmentId) {
    const error = new Error("Pathao accepted the request but did not return a consignment ID.");
    error.status = 502;
    throw error;
  }

  const deliveryMarker = `[Pathao:${consignmentId}]`;
  const notes = String(order.notes || "").trim();
  const nextNotes = `${notes ? `${notes} ` : ""}${deliveryMarker}`.slice(0, 255);

  return tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: ORDERS_TABLE_ID,
    rowId: orderId,
    data: { notes: nextNotes },
  });
}

export default async ({ req, res, log, error: logError }) => {
  if (req.method !== "POST") {
    return res.json({ success: false, error: "Only POST requests are allowed." }, 405);
  }

  try {
    assertConfigured();

    const userId = getUserId(req);
    const client = getServerClient(req);
    const payload = parseBody(req);
    const { action, orderId } = payload;

    if (!orderId || typeof orderId !== "string") {
      const error = new Error("Order ID is required.");
      error.status = 400;
      throw error;
    }

    const tablesDB = new TablesDB(client);
    let order;

    switch (action) {
      case "cancel_order_customer":
        order = await cancelOrderForCustomer(tablesDB, orderId, userId);
        break;

      case "update_order_status":
      case "cancel_order":
      case "update_payment_status":
      case "create_courier_order":
        await assertManagementAccess(client, userId);

        if (action === "update_order_status") {
          if (!payload.status) {
            throw Object.assign(new Error("Order status is required."), { status: 400 });
          }
          order = await updateOrderStatus(tablesDB, orderId, payload.status);
        } else if (action === "cancel_order") {
          order = await cancelOrder(tablesDB, orderId);
        } else if (action === "update_payment_status") {
          if (!payload.paymentStatus) {
            throw Object.assign(new Error("Payment status is required."), { status: 400 });
          }
          order = await updatePaymentStatus(tablesDB, orderId, payload.paymentStatus);
        } else {
          order = await createPathaoDelivery(tablesDB, orderId);
        }
        break;

      default: {
        const error = new Error(`Invalid action: ${action || ""}`);
        error.status = 400;
        throw error;
      }
    }

    log(`Order ${orderId} action ${action} by ${userId || "anonymous"}`);

    return res.json({ success: true, order });
  } catch (error) {
    logError(`Order management failed: ${error?.stack || error?.message || "Unknown error"}`);

    return res.json(
      { success: false, error: error?.message || "Unable to manage order." },
      error?.status || 500,
    );
  }
};
