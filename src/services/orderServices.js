import { ID, Query } from "appwrite";
import { tablesDB } from "../utils/appwrite";
import { getProductByIdAdmin } from "./productServices";
import { getProductById } from "./productServices";
import {
  functions,
} from "../utils/appwrite";
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const CREATE_ORDER_FUNCTION_ID =
  import.meta.env
    .VITE_APPWRITE_CREATE_ORDER_FUNCTION_ID;
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
  customer_Name,
  customer_Email = "",
  customer_Phone,
  shipping_Address,
  shipping_City,
  shipping_Postal_Code = "",
  shipping_Cost = 0,
  discount = 0,
  payment_Method =
    PAYMENT_METHODS.COD,
  notes = "",
  items = [],
}) {
  if (
    !CREATE_ORDER_FUNCTION_ID
  ) {
    throw new Error(
      "Create-order function is not configured.",
    );
  }

  const execution =
    await functions.createExecution({
      functionId:
        CREATE_ORDER_FUNCTION_ID,

      body: JSON.stringify({
        customer_Name,
        customer_Email,
        customer_Phone,
        shipping_Address,
        shipping_City,
        shipping_Postal_Code,
        shipping_Cost,
        discount,
        payment_Method,
        notes,
        items,
      }),

      async: false,

      path: "/",

      method: "POST",
    });

  let responseBody;

  try {
    responseBody =
      JSON.parse(
        execution.responseBody ||
          "{}",
      );
  } catch {
    throw new Error(
      "The order service returned an invalid response.",
    );
  }

  if (
    execution.responseStatusCode >=
      400 ||
    responseBody.success === false
  ) {
    throw new Error(
      responseBody.error ||
        "Unable to create the order.",
    );
  }

  if (
    !responseBody.order?.$id
  ) {
    throw new Error(
      "Order was created but no order ID was returned.",
    );
  }

  return {
    order:
      responseBody.order,

    items:
      responseBody.items || [],
  };
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