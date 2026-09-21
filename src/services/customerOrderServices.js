import { Query } from "appwrite";

import { tablesDB } from "../utils/appwrite";

import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
} from "./orderServices";

const DATABASE_ID =
  import.meta.env.VITE_APPWRITE_DATABASE_ID;

const ORDERS_TABLE_ID = import.meta.env.VITE_APPWRITE_ORDERS_TABLE_ID || "orders";

const ORDER_ITEMS_TABLE_ID = import.meta.env.VITE_APPWRITE_ORDER_ITEMS_TABLE_ID || "order_items";

const CUSTOMER_ORDER_LIMIT = 10;

function validateUserId(userId) {
  if (!userId) {
    throw new Error(
      "Customer authentication is required."
    );
  }
}

function normalizePage(page) {
  const value = Number(page);

  if (!Number.isSafeInteger(value) || value < 1) {
    return 1;
  }

  return value;
}

function normalizeLimit(limit) {
  const value = Number(limit);

  if (!Number.isSafeInteger(value)) {
    return CUSTOMER_ORDER_LIMIT;
  }

  return Math.min(
    25,
    Math.max(1, value)
  );
}

function validateStatus(status) {
  if (
    status === "all" ||
    Object.values(ORDER_STATUSES).includes(status)
  ) {
    return;
  }

  throw new Error(
    "Invalid order status filter."
  );
}

/*
|--------------------------------------------------------------------------
| Get customer's orders
|--------------------------------------------------------------------------
*/

export async function getCustomerOrders(
  userId,
  {
    page = 1,
    limit = CUSTOMER_ORDER_LIMIT,
    orderStatus = "all",
  } = {}
) {
  validateUserId(userId);
  validateStatus(orderStatus);

  const safePage =
    normalizePage(page);

  const safeLimit =
    normalizeLimit(limit);

  const offset =
    (safePage - 1) *
    safeLimit;

  const queries = [
    Query.equal(
      "customer_ID",
      userId
    ),

    Query.orderDesc(
      "$createdAt"
    ),

    Query.limit(
      safeLimit
    ),

    Query.offset(
      offset
    ),
  ];

  if (orderStatus !== "all") {
    queries.push(
      Query.equal(
        "order_Status",
        orderStatus
      )
    );
  }

  const response =
    await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: ORDERS_TABLE_ID,
      queries,
    });

  const total =
    Number(response.total || 0);

  return {
    orders: response.rows || [],
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(
      1,
      Math.ceil(
        total / safeLimit
      )
    ),
  };
}

/*
|--------------------------------------------------------------------------
| Get one customer's order
|--------------------------------------------------------------------------
|
| Important:
| We deliberately query by BOTH:
|
| customer_ID
| order ID
|
| This gives the service an additional ownership boundary.
|--------------------------------------------------------------------------
*/

export async function getCustomerOrderById(
  userId,
  orderId
) {
  validateUserId(userId);

  if (!orderId) {
    throw new Error(
      "Order ID is required."
    );
  }

  const response =
    await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: ORDERS_TABLE_ID,
      queries: [
        Query.equal(
          "customer_ID",
          userId
        ),

        Query.equal(
          "$id",
          orderId
        ),

        Query.limit(1),
      ],
      total: false,
    });

  return response.rows?.[0] || null;
}

/*
|--------------------------------------------------------------------------
| Get items belonging to an already-authorized order
|--------------------------------------------------------------------------
*/

export async function getCustomerOrderItems(
  userId,
  orderId
) {
  const order =
    await getCustomerOrderById(
      userId,
      orderId
    );

  if (!order) {
    return null;
  }

  const response =
    await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: ORDER_ITEMS_TABLE_ID,
      queries: [
        Query.equal(
          "order_ID",
          orderId
        ),

        Query.orderAsc(
          "$createdAt"
        ),

        Query.limit(100),
      ],
      total: false,
    });

  return response.rows || [];
}

/*
|--------------------------------------------------------------------------
| Get customer order + items
|--------------------------------------------------------------------------
*/

export async function getCustomerOrderWithItems(
  userId,
  orderId
) {
  const order =
    await getCustomerOrderById(
      userId,
      orderId
    );

  if (!order) {
    return null;
  }

  const items =
    await getCustomerOrderItems(
      userId,
      orderId
    );

  return {
    order,
    items: items || [],
  };
}

export {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
};

export async function getCustomerShipment(userId, orderId) {
  validateUserId(userId);
  if (!orderId) throw new Error("Order ID is required.");

  const shipmentTableId = import.meta.env.VITE_APPWRITE_DELIVERY_SHIPMENTS_TABLE_ID || "delivery_shipments";
  if (!shipmentTableId) return null;

  try {
    return await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: shipmentTableId,
      rowId: orderId,
    });
  } catch (error) {
    if (error?.code === 404 || error?.code === 401 || error?.code === 403) return null;
    throw error;
  }
}
