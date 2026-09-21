import { functions } from "../utils/appwrite";
import { fromSupabaseRow } from "../utils/supabase";

import { getCustomerOrderWithItems } from "./customerOrderServices";

const MANAGE_ORDER_FUNCTION_ID = import.meta.env.VITE_SUPABASE_MANAGE_ORDER_FUNCTION_NAME || "manage-order";

export const RETURN_REQUEST_TYPES = { RETURN: "return", EXCHANGE: "exchange" };
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

function assertConfigured() {
  if (!MANAGE_ORDER_FUNCTION_ID) {
    throw new Error("Manage-order function is not configured.");
  }
}

function validateUserId(userId) {
  if (!userId) throw new Error("Customer authentication is required.");
}

async function executeReturnAction(payload) {
  assertConfigured();

  const execution = await functions.createExecution({
    functionId: MANAGE_ORDER_FUNCTION_ID,
    body: JSON.stringify(payload),
    async: false,
    path: "/",
    method: "POST",
  });

  let responseBody;
  try {
    responseBody = JSON.parse(execution.responseBody || "{}");
  } catch {
    throw new Error("The return service returned an invalid response.");
  }

  if (execution.responseStatusCode >= 400 || responseBody.success === false) {
    throw new Error(responseBody.error || "Unable to process the return request.");
  }

  if (!responseBody.returnRequest?.$id) {
    throw new Error("The return request was not returned.");
  }

  return fromSupabaseRow(responseBody.returnRequest);
}

export async function getCustomerReturnRequest(userId, orderId) {
  validateUserId(userId);
  if (!orderId) throw new Error("Order ID is required.");

  // The customer service verifies ownership before returning the request.
  // The Appwrite row itself is also protected by its owner read permission.
  try {
    const { tablesDB } = await import("../utils/appwrite");
    return await tablesDB.getRow({
      databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
      tableId: import.meta.env.VITE_APPWRITE_RETURN_REQUESTS_TABLE_ID || "return_requests",
      rowId: orderId,
    });
  } catch (error) {
    if (error?.code === 404) return null;
    if (error?.code === 401 || error?.code === 403) return null;
    throw error;
  }
}

export async function createCustomerReturnRequest(
  userId,
  orderId,
  { requestType, reason, details = "", itemIds = [], exchangeNote = "" } = {},
) {
  validateUserId(userId);

  // Keep a client-side preflight for UX, but the manage-order Function is
  // authoritative for authentication, ownership, delivered status and items.
  const orderData = await getCustomerOrderWithItems(userId, orderId);
  if (!orderData) throw new Error("Order not found.");

  return executeReturnAction({
    action: "create_return_request",
    orderId,
    requestType,
    reason,
    details,
    itemIds,
    exchangeNote,
  });
}
