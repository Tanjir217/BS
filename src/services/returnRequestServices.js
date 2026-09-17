import { ID, Permission, Role } from "appwrite";

import { tablesDB } from "../utils/appwrite";
import { getCustomerOrderWithItems } from "./customerOrderServices";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const RETURN_REQUESTS_TABLE_ID = import.meta.env.VITE_APPWRITE_RETURN_REQUESTS_TABLE_ID;

export const RETURN_REQUEST_TYPES = { RETURN: "return", EXCHANGE: "exchange" };
export const RETURN_REQUEST_STATUSES = { REQUESTED: "requested", APPROVED: "approved", REJECTED: "rejected", PICKUP: "pickup", RECEIVED: "received", COMPLETED: "completed", CANCELLED: "cancelled" };
export const RETURN_RESOLUTIONS = { PENDING: "pending", REFUND: "refund", EXCHANGE: "exchange", REPLACEMENT: "replacement" };

function assertConfigured() {
  if (!RETURN_REQUESTS_TABLE_ID) throw new Error("Return requests are not configured yet.");
}

function validateUserId(userId) {
  if (!userId) throw new Error("Customer authentication is required.");
}

function normalizeType(type) {
  if (!Object.values(RETURN_REQUEST_TYPES).includes(type)) throw new Error("Please select a valid request type.");
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

export async function getCustomerReturnRequest(userId, orderId) {
  assertConfigured();
  validateUserId(userId);
  if (!orderId) throw new Error("Order ID is required.");

  try {
    const request = await tablesDB.getRow({ databaseId: DATABASE_ID, tableId: RETURN_REQUESTS_TABLE_ID, rowId: orderId });
    if (request.customer_ID !== userId) throw new Error("You do not have access to this return request.");
    return request;
  } catch (error) {
    if (error?.code === 404) return null;
    throw error;
  }
}

export async function createCustomerReturnRequest(userId, orderId, { requestType, reason, details = "", itemIds = [], exchangeNote = "" } = {}) {
  assertConfigured();
  validateUserId(userId);

  const type = normalizeType(requestType);
  const cleanReason = String(reason || "").trim();
  const cleanDetails = String(details || "").trim();
  const cleanExchangeNote = String(exchangeNote || "").trim();

  if (!orderId) throw new Error("Order ID is required.");
  if (!cleanReason) throw new Error("Please select a return reason.");
  if (!Array.isArray(itemIds) || itemIds.length === 0) throw new Error("Select at least one item.");

  const orderData = await getCustomerOrderWithItems(userId, orderId);
  if (!orderData) throw new Error("Order not found.");
  if (orderData.order.order_Status !== "delivered") throw new Error("A return or exchange can only be requested after delivery.");

  const validItemIds = new Set(orderData.items.map((item) => item.$id));
  const requestedItemIds = [...new Set(itemIds)].filter((id) => validItemIds.has(id));
  if (requestedItemIds.length !== itemIds.length || requestedItemIds.length === 0) throw new Error("One or more selected items are invalid.");

  const existing = await getCustomerReturnRequest(userId, orderId);
  if (existing) throw new Error("This order already has a return or exchange request.");

  return tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: RETURN_REQUESTS_TABLE_ID,
    rowId: orderId,
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
