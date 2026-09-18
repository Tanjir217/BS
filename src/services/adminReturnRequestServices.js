import { Query } from "appwrite";

import { functions, tablesDB } from "../utils/appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const RETURN_REQUESTS_TABLE_ID = import.meta.env.VITE_APPWRITE_RETURN_REQUESTS_TABLE_ID;
const MANAGE_ORDER_FUNCTION_ID = import.meta.env.VITE_APPWRITE_MANAGE_ORDER_FUNCTION_ID;

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
  if (!RETURN_REQUESTS_TABLE_ID) throw new Error("Return requests are not configured yet.");
  if (!MANAGE_ORDER_FUNCTION_ID) throw new Error("Manage-order function is not configured.");
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

async function executeManagementReturn(payload) {
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
    throw new Error(responseBody.error || "Unable to update return request.");
  }

  if (!responseBody.returnRequest?.$id) {
    throw new Error("The updated return request was not returned.");
  }

  return responseBody.returnRequest;
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

  return executeManagementReturn({
    action: "update_return_request",
    orderId: requestId,
    status: nextStatus,
    resolution,
    refundAmount,
    managementNote,
  });
}
