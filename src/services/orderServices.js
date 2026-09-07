import { ID, Query } from "appwrite";
import { tablesDB } from "../utils/appwrite";
import { getProductByIdAdmin } from "./productServices";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

const ORDERS_TABLE_ID =
  import.meta.env.VITE_APPWRITE_ORDERS_TABLE_ID;

const ORDER_ITEMS_TABLE_ID =
  import.meta.env.VITE_APPWRITE_ORDER_ITEMS_TABLE_ID;

/*
|--------------------------------------------------------------------------
| Order statuses
|--------------------------------------------------------------------------
*/

export const ORDER_STATUSES = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

/*
|--------------------------------------------------------------------------
| Payment statuses
|--------------------------------------------------------------------------
*/

export const PAYMENT_STATUSES = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
};

/*
|--------------------------------------------------------------------------
| Payment methods
|--------------------------------------------------------------------------
*/

export const PAYMENT_METHODS = {
  COD: "cod",
  ONLINE: "online",
};

/*
|--------------------------------------------------------------------------
| Human-readable labels
|--------------------------------------------------------------------------
*/

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUSES.PENDING]: "Pending",
  [ORDER_STATUSES.CONFIRMED]: "Confirmed",
  [ORDER_STATUSES.PROCESSING]: "Processing",
  [ORDER_STATUSES.SHIPPED]: "Shipped",
  [ORDER_STATUSES.DELIVERED]: "Delivered",
  [ORDER_STATUSES.CANCELLED]: "Cancelled",
};

export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUSES.PENDING]: "Pending",
  [PAYMENT_STATUSES.PAID]: "Paid",
  [PAYMENT_STATUSES.FAILED]: "Failed",
  [PAYMENT_STATUSES.REFUNDED]: "Refunded",
};

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.COD]: "Cash on Delivery",
  [PAYMENT_METHODS.ONLINE]: "Online Payment",
};

/*
|--------------------------------------------------------------------------
| Allowed order status transitions
|--------------------------------------------------------------------------
*/

const ORDER_STATUS_TRANSITIONS = {
  [ORDER_STATUSES.PENDING]: [
    ORDER_STATUSES.PENDING,
    ORDER_STATUSES.CONFIRMED,
    ORDER_STATUSES.CANCELLED,
  ],

  [ORDER_STATUSES.CONFIRMED]: [
    ORDER_STATUSES.CONFIRMED,
    ORDER_STATUSES.PROCESSING,
    ORDER_STATUSES.CANCELLED,
  ],

  [ORDER_STATUSES.PROCESSING]: [
    ORDER_STATUSES.PROCESSING,
    ORDER_STATUSES.SHIPPED,
  ],

  [ORDER_STATUSES.SHIPPED]: [
    ORDER_STATUSES.SHIPPED,
    ORDER_STATUSES.DELIVERED,
  ],

  [ORDER_STATUSES.DELIVERED]: [
    ORDER_STATUSES.DELIVERED,
  ],

  [ORDER_STATUSES.CANCELLED]: [
    ORDER_STATUSES.CANCELLED,
  ],
};

/*
|--------------------------------------------------------------------------
| Generate order number
|--------------------------------------------------------------------------
*/

function generateOrderNumber(orderId) {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const uniquePart = orderId.slice(-6).toUpperCase();

  return `BS-${year}${month}${day}-${uniquePart}`;
}

/*
|--------------------------------------------------------------------------
| Validation helpers
|--------------------------------------------------------------------------
*/

function assertNonNegativeInteger(value, fieldName) {
  const number = Number(value);

  if (
    !Number.isSafeInteger(number) ||
    number < 0
  ) {
    throw new Error(`${fieldName} must be a valid non-negative integer.`);
  }

  return number;
}

function assertPositiveInteger(value, fieldName) {
  const number = Number(value);

  if (
    !Number.isSafeInteger(number) ||
    number <= 0
  ) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }

  return number;
}

/*
|--------------------------------------------------------------------------
| Create order
|--------------------------------------------------------------------------
*/

export async function createOrder({
  customer_ID = "",
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
}) {
  const customerName = String(customer_Name || "").trim();
  const customerPhone = String(customer_Phone || "").trim();
  const shippingAddress = String(shipping_Address || "").trim();
  const shippingCity = String(shipping_City || "").trim();

  if (!customerName) {
    throw new Error("Customer name is required.");
  }

  if (!customerPhone) {
    throw new Error("Customer phone is required.");
  }

  if (!shippingAddress) {
    throw new Error("Shipping address is required.");
  }

  if (!shippingCity) {
    throw new Error("Shipping city is required.");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("At least one order item is required.");
  }

  if (!Object.values(PAYMENT_METHODS).includes(payment_Method)) {
    throw new Error("Invalid payment method.");
  }

  /*
  |--------------------------------------------------------------------------
  | Merge duplicate products
  |--------------------------------------------------------------------------
  */

  const itemMap = new Map();

  for (const item of items) {
    if (!item?.productId) {
      throw new Error("Product ID is required.");
    }

    const quantity = assertPositiveInteger(
      item.quantity,
      `Quantity for ${item.productId}`
    );

    const currentQuantity =
      itemMap.get(item.productId) || 0;

    itemMap.set(
      item.productId,
      currentQuantity + quantity
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Build order item snapshots
  |--------------------------------------------------------------------------
  */

  const orderItems = await Promise.all(
    [...itemMap.entries()].map(
      async ([productId, quantity]) => {
        const product =
          await getProductByIdAdmin(productId);

        if (!product) {
          throw new Error(
            `Product ${productId} could not be found.`
          );
        }

        const unitPrice = assertNonNegativeInteger(
          product.price,
          `Price for ${product.name}`
        );

        const stockQuantity = assertNonNegativeInteger(
          product.stockQuantity,
          `Stock for ${product.name}`
        );

        if (quantity > stockQuantity) {
          throw new Error(
            `${product.name} does not have enough stock.`
          );
        }

        const lineTotal = unitPrice * quantity;

        if (!Number.isSafeInteger(lineTotal)) {
          throw new Error(
            `Line total is too large for ${product.name}.`
          );
        }

        return {
          product_ID: product.$id,
          product_Name: product.name,
          product_SKU: product.sku || "",
          product_Color: product.color || "",
          unit_Price: unitPrice,
          quantity,
          line_Total: lineTotal,
        };
      }
    )
  );

  /*
  |--------------------------------------------------------------------------
  | Calculate totals
  |--------------------------------------------------------------------------
  */

  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.line_Total,
    0
  );

  if (!Number.isSafeInteger(subtotal)) {
    throw new Error("Order subtotal is too large.");
  }

  const shippingCostNumber =
    assertNonNegativeInteger(
      shipping_Cost,
      "Shipping cost"
    );

  const discountNumber =
    assertNonNegativeInteger(
      discount,
      "Discount"
    );

  if (
    discountNumber >
    subtotal + shippingCostNumber
  ) {
    throw new Error(
      "Discount cannot be greater than the order amount."
    );
  }

  const total =
    subtotal +
    shippingCostNumber -
    discountNumber;

  /*
  |--------------------------------------------------------------------------
  | Create order
  |--------------------------------------------------------------------------
  */

  const orderId = ID.unique();

  const order = await tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: ORDERS_TABLE_ID,
    rowId: orderId,
    data: {
      order_Number: generateOrderNumber(orderId),

      customer_ID,
      customer_Name: customerName,
      customer_Email,
      customer_Phone: customerPhone,

      shipping_Address: shippingAddress,
      shipping_City: shippingCity,
      shipping_Postal_Code,

      subtotal,
      shipping_Cost: shippingCostNumber,
      discount: discountNumber,
      total,

      payment_Method,
      payment_Status: PAYMENT_STATUSES.PENDING,
      order_Status: ORDER_STATUSES.PENDING,

      notes,
    },
  });

  /*
  |--------------------------------------------------------------------------
  | Create order items
  |--------------------------------------------------------------------------
  */

  const createdItems = [];

  try {
    for (const item of orderItems) {
      const createdItem = await tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: ORDER_ITEMS_TABLE_ID,
        rowId: ID.unique(),
        data: {
          order_ID: order.$id,
          product_ID: item.product_ID,
          product_Name: item.product_Name,
          product_SKU: item.product_SKU,
          product_Color: item.product_Color,
          unit_Price: item.unit_Price,
          quantity: item.quantity,
          line_Total: item.line_Total,
        },
      });

      createdItems.push(createdItem);
    }

    return {
      order,
      items: createdItems,
    };
  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | Roll back created order items
    |--------------------------------------------------------------------------
    */

    const rollbackResults =
      await Promise.allSettled(
        createdItems.map((item) =>
          tablesDB.deleteRow({
            databaseId: DATABASE_ID,
            tableId: ORDER_ITEMS_TABLE_ID,
            rowId: item.$id,
          })
        )
      );

    rollbackResults.forEach((result) => {
      if (result.status === "rejected") {
        console.error(
          "Failed to roll back order item:",
          result.reason
        );
      }
    });

    /*
    |--------------------------------------------------------------------------
    | Roll back order
    |--------------------------------------------------------------------------
    */

    try {
      await tablesDB.deleteRow({
        databaseId: DATABASE_ID,
        tableId: ORDERS_TABLE_ID,
        rowId: order.$id,
      });
    } catch (rollbackError) {
      console.error(
        "Failed to roll back order:",
        rollbackError
      );
    }

    throw error;
  }
}

/*
|--------------------------------------------------------------------------
| Get orders
|--------------------------------------------------------------------------
*/

export async function getOrders({
  page = 1,
  limit = 10,
  orderStatus = "all",
  paymentStatus = "all",
} = {}) {
  const safePage = Math.max(
    1,
    Number(page) || 1
  );

  const safeLimit = Math.min(
    50,
    Math.max(1, Number(limit) || 10)
  );

  const offset =
    (safePage - 1) * safeLimit;

  const queries = [
    Query.orderDesc("$createdAt"),
    Query.limit(safeLimit),
    Query.offset(offset),
  ];

  if (orderStatus !== "all") {
    if (
      !Object.values(ORDER_STATUSES).includes(
        orderStatus
      )
    ) {
      throw new Error("Invalid order status filter.");
    }

    queries.push(
      Query.equal("order_Status", orderStatus)
    );
  }

  if (paymentStatus !== "all") {
    if (
      !Object.values(PAYMENT_STATUSES).includes(
        paymentStatus
      )
    ) {
      throw new Error(
        "Invalid payment status filter."
      );
    }

    queries.push(
      Query.equal(
        "payment_Status",
        paymentStatus
      )
    );
  }

  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: ORDERS_TABLE_ID,
    queries,
  });

  return {
    orders: response.rows,
    total: response.total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(
      1,
      Math.ceil(
        response.total / safeLimit
      )
    ),
  };
}

/*
|--------------------------------------------------------------------------
| Get single order
|--------------------------------------------------------------------------
*/

export async function getOrderById(orderId) {
  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  try {
    return await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: ORDERS_TABLE_ID,
      rowId: orderId,
    });
  } catch (error) {
    if (error?.code === 404) {
      return null;
    }

    throw error;
  }
}

/*
|--------------------------------------------------------------------------
| Get order items
|--------------------------------------------------------------------------
*/

export async function getOrderItems(orderId) {
  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: ORDER_ITEMS_TABLE_ID,
    queries: [
      Query.equal("order_ID", orderId),
      Query.orderAsc("$createdAt"),
    ],
  });

  return response.rows;
}

/*
|--------------------------------------------------------------------------
| Get order with items
|--------------------------------------------------------------------------
*/

export async function getOrderWithItems(orderId) {
  const order = await getOrderById(orderId);

  if (!order) {
    return null;
  }

  const items = await getOrderItems(orderId);

  return {
    order,
    items,
  };
}

/*
|--------------------------------------------------------------------------
| Get allowed next statuses
|--------------------------------------------------------------------------
*/

export function getAllowedOrderStatuses(
  currentStatus
) {
  return (
    ORDER_STATUS_TRANSITIONS[currentStatus] || []
  );
}

/*
|--------------------------------------------------------------------------
| Update order status
|--------------------------------------------------------------------------
*/

export async function updateOrderStatus(
  orderId,
  nextStatus
) {
  if (
    !Object.values(ORDER_STATUSES).includes(
      nextStatus
    )
  ) {
    throw new Error(
      `Invalid order status: ${nextStatus}`
    );
  }

  const currentOrder =
    await getOrderById(orderId);

  if (!currentOrder) {
    throw new Error("Order not found.");
  }

  const allowedStatuses =
    getAllowedOrderStatuses(
      currentOrder.order_Status
    );

  if (!allowedStatuses.includes(nextStatus)) {
    throw new Error(
      `Cannot change order status from "${currentOrder.order_Status}" to "${nextStatus}".`
    );
  }

  return tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: ORDERS_TABLE_ID,
    rowId: orderId,
    data: {
      order_Status: nextStatus,
    },
  });
}

/*
|--------------------------------------------------------------------------
| Update payment status
|--------------------------------------------------------------------------
*/

export async function updatePaymentStatus(
  orderId,
  paymentStatus
) {
  if (
    !Object.values(PAYMENT_STATUSES).includes(
      paymentStatus
    )
  ) {
    throw new Error(
      `Invalid payment status: ${paymentStatus}`
    );
  }

  return tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: ORDERS_TABLE_ID,
    rowId: orderId,
    data: {
      payment_Status: paymentStatus,
    },
  });
}