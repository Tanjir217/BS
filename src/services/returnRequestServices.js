import { ID, Permission, Query, Role } from "appwrite";

import { tablesDB } from "../utils/appwrite";
import { getCustomerOrderWithItems } from "./customerOrderServices";
import { createCourierOrder } from "./orderServices";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const RETURN_REQUESTS_TABLE_ID = import.meta.env.VITE_APPWRITE_RETURN_REQUESTS_TABLE_ID;

export const RETURN_REQUEST_TYPES = {
  RETURN: "return",
  EXCHANGE: "exchange",
};

export const RETURN_REQUEST_STATUSES = {
  REQUESTED: "requested",
  APPROVED: "approved",
  REJECTED: "rejected",
  PICKUP: "pickup",
  RECEIVED: "received",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const RETURN_RESOLUTIONS = {
  PENDING: "pending",
  REFUND: "refund",
  EXCHANGE: "exchange",
  REPLACEMENT: "replacement",
};

const OPEN_STATUSES = new Set([
  RETURN_REQUEST_STATUSES.REQUESTED,
  RETURN_REQUEST_STATUSES.APPROVED,
  RETURN_REQUEST_STATUSES.PICKUP,
  RETURN_REQUEST_STATUSES.RECEIVED,
]);

function assertConfigured() {
  if (!RETURN_REQUESTS_TABLE_ID) {
    throw new Error("Return requests are not configured yet.");
  }
}

function validateUserId(userId) {
  if (!userId) throw new Error("Customer authentication is required.");
}

function normalizeType(type) {
  if (!Object.values(RETURN_REQUEST_TYPES).includes(type)) {
    throw new Error("Please select a valid request type.");
  }
  return type;
}

function getOwnerPermissions(userId) {
  return [Permission.read(Role.user(userId))];
}

function makeReturnNumber() {
  const suffix = ID.unique().slice(-6).toUpperCase();
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `RET-${date}-${suffix}`;
}

export async function getCustomerReturnRequests(userId, orderId) {
  assertConfigured();
  validateUserId(userId);

  const queries = [
    Query.equal("customer_ID", userId),
    Query.orderDesc("$createdAt"),
    Query.limit(25),
  ];

  if (orderId) queries.unshift(Query.equal("order_ID", orderId));

  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: RETURN_REQUESTS_TABLE_ID,
    queries,
    total: false,
  });

  return response.rows || [];
}

export async function createCustomerReturnRequest(
  userId,
  orderId,
  {
    requestType,
    reason,
    details = "",
    itemIds = [],
    exchangeNote = "",
  } = {},
) {
  assertConfigured();
  validateUserId(userId);

  const type = normalizeType(requestType);
  const cleanReason = String(reason || "").trim();
  const cleanDetails = String(details || "").trim();
  const cleanExchangeNote = String(exchangeNote || "").trim();

  if (!orderId) throw new Error("Order ID is required.");
  if (!cleanReason) throw new Error("Please select a return reason.");
  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    throw new Error("Select at least one item.");
  }

  const orderData = await getCustomerOrderWithItems(userId, orderId);

  if (!orderData) throw new Error("Order not found.");
  if (orderData.order.order_Status !== "delivered") {
    throw new Error("A return or exchange can only be requested after delivery.");
  }

  const validItemIds = new Set(orderData.items.map((item) => item.$id));
  const requestedItemIds = [...new Set(itemIds)].filter((id) => validItemIds.has(id));

  if (requestedItemIds.length !== itemIds.length || requestedItemIds.length === 0) {
    throw new Error("One or more selected items are invalid.");
  }

  const existing = await getCustomerReturnRequests(userId, orderId);
  if (existing.some((request) => OPEN_STATUSES.has(request.status))) {
    throw new Error("This order already has an active return or exchange request.");
  }

  return tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: RETURN_REQUESTS_TABLE_ID,
    rowId: ID.unique(),
    data: {
      return_Number: makeReturnNumber(),
      order_ID: orderId,
      customer_ID: userId,
      request_Type: type,
      reason: cleanReason,
      details: cleanDetails,
      requested_Item_IDs: requestedItemIds.join(","),
      exchange_Note: type === RETURN_REQUEST_TYPES.EXCHANGE ? cleanExchangeNote : "",
      status: RETURN_REQUEST_STATUSES.REQUESTED,
      resolution: RETURN_RESOLUTIONS.PENDING,
      refund_Amount: 0,
      management_Note: "",
    },
    permissions: getOwnerPermissions(userId),
  });
}

export async function prepareApprovedReturnPickup(orderId) {
  if (!orderId) throw new Error("Order ID is required.");
  return createCourierOrder(orderId);
}
