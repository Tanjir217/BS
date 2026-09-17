import {
  Client,
  Query,
  TablesDB,
  Teams,
} from "node-appwrite";

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const PRODUCTS_TABLE_ID = process.env.APPWRITE_PRODUCTS_TABLE_ID;
const ORDERS_TABLE_ID = process.env.APPWRITE_ORDERS_TABLE_ID;
const ORDER_ITEMS_TABLE_ID = process.env.APPWRITE_ORDER_ITEMS_TABLE_ID;
const MANAGEMENT_TEAM_ID = process.env.APPWRITE_MANAGEMENT_TEAM_ID;

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

const PAYMENT_STATUS_TRANSITIONS = {
  [PAYMENT_STATUSES.PENDING]: [
    PAYMENT_STATUSES.PENDING,
    PAYMENT_STATUSES.PAID,
    PAYMENT_STATUSES.FAILED,
  ],
  [PAYMENT_STATUSES.PAID]: [
    PAYMENT_STATUSES.PAID,
    PAYMENT_STATUSES.REFUNDED,
  ],
  [PAYMENT_STATUSES.FAILED]: [
    PAYMENT_STATUSES.FAILED,
    PAYMENT_STATUSES.PENDING,
  ],
  [PAYMENT_STATUSES.REFUNDED]: [
    PAYMENT_STATUSES.REFUNDED,
  ],
};

const MANAGEMENT_ROLES = new Set([
  "owner",
  "manager",
  "staff",
]);

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

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing function configuration: ${missing.join(", ")}`);
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
    queries: [
      Query.equal("userId", userId),
      Query.equal("confirm", true),
      Query.limit(1),
    ],
  });

  const membership = memberships.memberships?.[0];
  const hasManagementRole = membership?.roles?.some((role) =>
    MANAGEMENT_ROLES.has(role)
  );

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
    const error = new Error(
      `Cannot change order status from "${currentStatus}" to "${nextStatus}".`
    );
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
    const error = new Error(
      `Cannot change payment status from "${currentStatus}" to "${nextStatus}".`
    );
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

async function cancelOrder(tablesDB, orderId) {
  const order = await getOrder(tablesDB, orderId);

  if (!order) {
    const error = new Error("Order not found.");
    error.status = 404;
    throw error;
  }

  validateOrderTransition(order.order_Status, ORDER_STATUSES.CANCELLED);

  if (order.order_Status === ORDER_STATUSES.CANCELLED) {
    return order;
  }

  const items = await getOrderItems(tablesDB, orderId);

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
      throw new Error(`Invalid quantity on order item ${item.$id}.`);
    }

    operations.push({
      action: "increment",
      databaseId: DATABASE_ID,
      tableId: PRODUCTS_TABLE_ID,
      rowId: item.product_ID,
      data: {
        value: quantity,
        column: "stockQuantity",
      },
    });
  }

  operations.push({
    action: "update",
    databaseId: DATABASE_ID,
    tableId: ORDERS_TABLE_ID,
    rowId: orderId,
    data: {
      order_Status: ORDER_STATUSES.CANCELLED,
    },
  });

  await tablesDB.createOperations({
    transactionId: transaction.$id,
    operations,
  });

  await tablesDB.updateTransaction({
    transactionId: transaction.$id,
    commit: true,
  });

  return getOrder(tablesDB, orderId);
}

export default async ({ req, res, log, error: logError }) => {
  if (req.method !== "POST") {
    return res.json(
      { success: false, error: "Only POST requests are allowed." },
      405
    );
  }

  try {
    assertConfigured();

    const userId = getUserId(req);
    const client = getServerClient(req);
    await assertManagementAccess(client, userId);

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
      case "update_order_status":
        if (!payload.status) {
          throw Object.assign(new Error("Order status is required."), {
            status: 400,
          });
        }
        order = await updateOrderStatus(tablesDB, orderId, payload.status);
        break;

      case "cancel_order":
        order = await cancelOrder(tablesDB, orderId);
        break;

      case "update_payment_status":
        if (!payload.paymentStatus) {
          throw Object.assign(new Error("Payment status is required."), {
            status: 400,
          });
        }
        order = await updatePaymentStatus(
          tablesDB,
          orderId,
          payload.paymentStatus
        );
        break;

      default: {
        const error = new Error(`Invalid action: ${action || ""}`);
        error.status = 400;
        throw error;
      }
    }

    log(`Order ${orderId} managed by ${userId}: ${action}`);

    return res.json({
      success: true,
      order,
    });
  } catch (error) {
    logError(
      `Order management failed: ${error?.stack || error?.message || "Unknown error"}`
    );

    return res.json(
      {
        success: false,
        error: error?.message || "Unable to manage order.",
      },
      error?.status || 500
    );
  }
};
