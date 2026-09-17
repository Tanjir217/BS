import { Query } from "appwrite";

import { tablesDB } from "../utils/appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const RETURN_REQUESTS_TABLE_ID = import.meta.env.VITE_APPWRITE_RETURN_REQUESTS_TABLE_ID;

export const ADMIN_RETURN_STATUS_TRANSITIONS = {
  requested: ["requested", "approved", "rejected", "cancelled"],
  approved: ["approved", "pickup", "rejected", "cancelled"],
  pickup: ["pickup", "received", "cancelled"],
  received: ["received", "completed", "rejected"],
  completed: ["completed"],
  rejected: ["rejected"],
  cancelled: ["cancelled"],
};

function assertConfigured() {
  if (!RETURN_REQUESTS_TABLE_ID) {
    throw new Error("Return requests are not configured yet.");
  }
}

export async function getAdminReturnRequests({ status = "all" } = {}) {
  assertConfigured();

  const queries = [Query.orderDesc("$createdAt"), Query.limit(50)];

  if (status !== "all") {
    if (!Object.prototype.hasOwnProperty.call(ADMIN_RETURN_STATUS_TRANSITIONS, status)) {
      throw new Error("Invalid return status filter.");
    }
    queries.push(Query.equal("status", status));
  }

  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: RETURN_REQUESTS_TABLE_ID,
    queries,
  });

  return response.rows || [];
}

export async function updateAdminReturnRequest(
  requestId,
  currentStatus,
  nextStatus,
  { resolution, refundAmount, managementNote } = {},
) {
  assertConfigured();

  const allowed = ADMIN_RETURN_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw new Error(`Cannot change return status from "${currentStatus}" to "${nextStatus}".`);
  }

  const data = { status: nextStatus };

  if (resolution !== undefined) data.resolution = resolution;
  if (refundAmount !== undefined) {
    const amount = Number(refundAmount);
    if (!Number.isSafeInteger(amount) || amount < 0) {
      throw new Error("Refund amount must be a non-negative integer.");
    }
    data.refund_Amount = amount;
  }
  if (managementNote !== undefined) data.management_Note = String(managementNote).trim();

  return tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: RETURN_REQUESTS_TABLE_ID,
    rowId: requestId,
    data,
  });
}
