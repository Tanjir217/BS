import { Client, ID, Permission, Query, Role, TablesDB, Teams } from "node-appwrite";

function getEnv(primaryName, legacyName) {
  return process.env[primaryName] || process.env[legacyName];
}

const DATABASE_ID = getEnv("APPWRITE_DATABASE_ID", "VITE_APPWRITE_DATABASE_ID");
const PRODUCTS_TABLE_ID = getEnv("APPWRITE_PRODUCTS_TABLE_ID", "VITE_APPWRITE_PRODUCTS_TABLE_ID");
const ORDERS_TABLE_ID = getEnv("APPWRITE_ORDERS_TABLE_ID", "VITE_APPWRITE_ORDERS_TABLE_ID");
const ORDER_ITEMS_TABLE_ID = getEnv("APPWRITE_ORDER_ITEMS_TABLE_ID", "VITE_APPWRITE_ORDER_ITEMS_TABLE_ID");
const RETURN_REQUESTS_TABLE_ID = getEnv("APPWRITE_RETURN_REQUESTS_TABLE_ID", "VITE_APPWRITE_RETURN_REQUESTS_TABLE_ID");
const DELIVERY_SHIPMENTS_TABLE_ID = getEnv("APPWRITE_DELIVERY_SHIPMENTS_TABLE_ID", "VITE_APPWRITE_DELIVERY_SHIPMENTS_TABLE_ID");
const CUSTOMER_ADDRESSES_TABLE_ID = getEnv("APPWRITE_CUSTOMER_ADDRESSES_TABLE_ID", "VITE_APPWRITE_CUSTOMER_ADDRESSES_TABLE_ID");
const CUSTOMERS_TABLE_ID = getEnv("APPWRITE_CUSTOMERS_TABLE_ID", "VITE_APPWRITE_CUSTOMERS_TABLE_ID");
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

function assertCustomerProfilesConfigured() {
  if (!CUSTOMERS_TABLE_ID) {
    const error = new Error("Customer profiles are not configured.");
    error.status = 503;
    throw error;
  }
}

async function ensureCustomerProfile(tablesDB, userId, payload) {
  if (!userId) {
    throw Object.assign(new Error("Customer authentication is required."), { status: 401 });
  }

  assertCustomerProfilesConfigured();

  try {
    return await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: CUSTOMERS_TABLE_ID,
      rowId: userId,
    });
  } catch (error) {
    if (error?.code !== 404) {
      throw error;
    }
  }

  const nameParts = String(payload.name || "Customer")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const firstName = nameParts.shift() || "Customer";
  const lastName = nameParts.join(" ");
  const email = String(payload.email || "").trim();

  if (!email) {
    throw Object.assign(new Error("Customer email is required."), { status: 400 });
  }

  const data = {
    first_Name: firstName,
    last_Name: lastName,
    email,
    phone: "",
    account_ID: userId,
    profile_Image_File_ID: "",
    address: "",
    city: "",
    postal_Code: "",
    whatsapp_Number: "",
    customer_Tire: "regular",
    is_Active: true,
    total_Orders: 0,
    total_Spent: 0,
    last_Order_At: "",
  };

  try {
    return await tablesDB.createRow({
      databaseId: DATABASE_ID,
      tableId: CUSTOMERS_TABLE_ID,
      rowId: userId,
      data,
      permissions: [Permission.read(Role.user(userId))],
    });
  } catch (error) {
    if (error?.code === 409) {
      return tablesDB.getRow({
        databaseId: DATABASE_ID,
        tableId: CUSTOMERS_TABLE_ID,
        rowId: userId,
      });
    }

    throw error;
  }
}

function assertCustomerAddressesConfigured() {
  if (!CUSTOMER_ADDRESSES_TABLE_ID) {
    const error = new Error("Customer addresses are not configured.");
    error.status = 503;
    throw error;
  }
}

function assertReturnRequestsConfigured() {
  if (!RETURN_REQUESTS_TABLE_ID) {
    const error = new Error("Return requests are not configured.");
    error.status = 503;
    throw error;
  }
}

function assertDeliveryShipmentsConfigured() {
  if (!DELIVERY_SHIPMENTS_TABLE_ID) {
    const error = new Error("Delivery shipments are not configured.");
    error.status = 503;
    throw error;
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

async 
async function getCustomerAddresses(tablesDB, userId) {
  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: CUSTOMER_ADDRESSES_TABLE_ID,
    queries: [
      Query.equal("customer_ID", userId),
      Query.limit(50),
    ],
    total: false,
  });

  return [...response.rows].sort((a, b) => {
    if (Boolean(a.is_Default) !== Boolean(b.is_Default)) {
      return a.is_Default ? -1 : 1;
    }

    return new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime();
  });
}

function normalizeCustomerAddress(payload) {
  const label = String(payload.label || "").trim().toLowerCase();
  const recipientName = String(payload.recipient_Name || "").trim();
  const phone = String(payload.phone || "").trim();
  const addressLine1 = String(payload.address_Line_1 || "").trim();
  const addressLine2 = String(payload.address_Line_2 || "").trim();
  const city = String(payload.city || "").trim();
  const postalCode = String(payload.postal_Code || "").trim();
  const country = String(payload.country || "").trim();

  if (!["home", "office", "other"].includes(label)) {
    throw Object.assign(new Error("Please select a valid address type."), { status: 400 });
  }

  if (!recipientName || !phone || !addressLine1 || !city || !postalCode || !country) {
    throw Object.assign(new Error("Please complete all required address fields."), { status: 400 });
  }

  return {
    label,
    recipient_Name: recipientName,
    phone,
    address_Line_1: addressLine1,
    address_Line_2: addressLine2,
    city,
    postal_Code: postalCode,
    country,
  };
}

async function createCustomerAddress(tablesDB, userId, payload) {
  const existing = await getCustomerAddresses(tablesDB, userId);
  const data = normalizeCustomerAddress(payload);
  const shouldBeDefault = existing.length === 0 || Boolean(payload.is_Default);
  const rowId = ID.unique();

  const permissions = [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];

  if (shouldBeDefault) {
    const operations = existing
      .filter((address) => address.is_Default)
      .map((address) => ({
        action: "update",
        databaseId: DATABASE_ID,
        tableId: CUSTOMER_ADDRESSES_TABLE_ID,
        rowId: address.$id,
        data: { is_Default: false },
      }));

    operations.push({
      action: "update",
      databaseId: DATABASE_ID,
      tableId: CUSTOMER_ADDRESSES_TABLE_ID,
      rowId,
      data: { is_Default: true },
    });

    const transaction = await tablesDB.createTransaction();

    await tablesDB.createRow({
      databaseId: DATABASE_ID,
      tableId: CUSTOMER_ADDRESSES_TABLE_ID,
      rowId,
      data: {
        customer_ID: userId,
        ...data,
        is_Default: false,
      },
      permissions,
      transactionId: transaction.$id,
    });

    await tablesDB.createOperations({
      transactionId: transaction.$id,
      operations,
    });

    await tablesDB.updateTransaction({
      transactionId: transaction.$id,
      commit: true,
    });
  } else {
    await tablesDB.createRow({
      databaseId: DATABASE_ID,
      tableId: CUSTOMER_ADDRESSES_TABLE_ID,
      rowId,
      data: {
        customer_ID: userId,
        ...data,
        is_Default: false,
      },
      permissions,
    });
  }

  return tablesDB.getRow({
    databaseId: DATABASE_ID,
    tableId: CUSTOMER_ADDRESSES_TABLE_ID,
    rowId,
  });
}

async function getOwnedCustomerAddress(tablesDB, userId, addressId) {
  const address = await tablesDB.getRow({
    databaseId: DATABASE_ID,
    tableId: CUSTOMER_ADDRESSES_TABLE_ID,
    rowId: addressId,
  });

  if (address.customer_ID !== userId) {
    throw Object.assign(new Error("You do not have access to this address."), { status: 403 });
  }

  return address;
}

async function updateCustomerAddress(tablesDB, userId, addressId, payload) {
  const existing = await getOwnedCustomerAddress(tablesDB, userId, addressId);
  const data = normalizeCustomerAddress(payload);

  if (Boolean(payload.is_Default) && !existing.is_Default) {
    const addresses = await getCustomerAddresses(tablesDB, userId);

    await Promise.all(
      addresses
        .filter((address) => address.is_Default && address.$id !== addressId)
        .map((address) =>
          tablesDB.updateRow({
            databaseId: DATABASE_ID,
            tableId: CUSTOMER_ADDRESSES_TABLE_ID,
            rowId: address.$id,
            data: { is_Default: false },
          }),
        ),
    );
  }

  return tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: CUSTOMER_ADDRESSES_TABLE_ID,
    rowId: addressId,
    data: {
      ...data,
      is_Default: Boolean(payload.is_Default),
    },
  });
}

async function setDefaultCustomerAddress(tablesDB, userId, addressId) {
  await getOwnedCustomerAddress(tablesDB, userId, addressId);
  const addresses = await getCustomerAddresses(tablesDB, userId);

  await Promise.all(
    addresses
      .filter((address) => address.$id !== addressId && address.is_Default)
      .map((address) =>
        tablesDB.updateRow({
          databaseId: DATABASE_ID,
          tableId: CUSTOMER_ADDRESSES_TABLE_ID,
          rowId: address.$id,
          data: { is_Default: false },
        }),
      ),
  );

  return tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: CUSTOMER_ADDRESSES_TABLE_ID,
    rowId: addressId,
    data: { is_Default: true },
  });
}

async function deleteCustomerAddress(tablesDB, userId, addressId) {
  const target = await getOwnedCustomerAddress(tablesDB, userId, addressId);
  const addresses = await getCustomerAddresses(tablesDB, userId);

  await tablesDB.deleteRow({
    databaseId: DATABASE_ID,
    tableId: CUSTOMER_ADDRESSES_TABLE_ID,
    rowId: addressId,
  });

  if (target.is_Default) {
    const nextAddress = addresses.find((address) => address.$id !== addressId);

    if (nextAddress) {
      await tablesDB.updateRow({
        databaseId: DATABASE_ID,
        tableId: CUSTOMER_ADDRESSES_TABLE_ID,
        rowId: nextAddress.$id,
        data: { is_Default: true },
      });
    }
  }

  return { success: true };
}

function getOrderItems(tablesDB, orderId) {
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

const RETURN_REQUEST_STATUSES = {
  REQUESTED: "requested",
  APPROVED: "approved",
  REJECTED: "rejected",
  PICKUP: "pickup",
  RECEIVED: "received",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const RETURN_STATUS_TRANSITIONS = {
  requested: ["requested", "approved", "rejected", "cancelled"],
  approved: ["approved", "pickup", "rejected", "cancelled"],
  pickup: ["pickup", "received", "cancelled"],
  received: ["received", "completed", "rejected"],
  completed: ["completed"],
  rejected: ["rejected"],
  cancelled: ["cancelled"],
};

const RETURN_RESOLUTIONS = new Set(["pending", "refund", "exchange", "replacement"]);

function validateReturnTransition(currentStatus, nextStatus) {
  const allowed = RETURN_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    const error = new Error(`Cannot change return status from "${currentStatus}" to "${nextStatus}".`);
    error.status = 409;
    throw error;
  }
}

async function getReturnRequest(tablesDB, requestId) {
  return tablesDB.getRow({
    databaseId: DATABASE_ID,
    tableId: RETURN_REQUESTS_TABLE_ID,
    rowId: requestId,
  });
}

async function createCustomerReturnRequest(tablesDB, orderId, userId, payload) {
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

  if (order.order_Status !== ORDER_STATUSES.DELIVERED) {
    const error = new Error("A return or exchange can only be requested after delivery.");
    error.status = 409;
    throw error;
  }

  const requestType = String(payload.requestType || "").trim();
  const reason = String(payload.reason || "").trim();
  const details = String(payload.details || "").trim();
  const exchangeNote = String(payload.exchangeNote || "").trim();
  const itemIds = Array.isArray(payload.itemIds) ? [...new Set(payload.itemIds.map(String))] : [];

  if (!["return", "exchange"].includes(requestType)) {
    const error = new Error("Please select a valid request type.");
    error.status = 400;
    throw error;
  }
  if (!reason) {
    const error = new Error("Please select a return reason.");
    error.status = 400;
    throw error;
  }
  if (itemIds.length === 0) {
    const error = new Error("Select at least one item.");
    error.status = 400;
    throw error;
  }

  const items = await getOrderItems(tablesDB, orderId);
  const validIds = new Set(items.map((item) => item.$id));
  if (itemIds.some((id) => !validIds.has(id))) {
    const error = new Error("One or more selected items are invalid.");
    error.status = 400;
    throw error;
  }

  try {
    const existing = await getReturnRequest(tablesDB, orderId);
    if (existing) {
      const error = new Error("This order already has a return or exchange request.");
      error.status = 409;
      throw error;
    }
  } catch (error) {
    if (error?.code !== 404) throw error;
  }

  const suffix = ID.unique().slice(-6).toUpperCase();
  const returnNumber = `RET-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${suffix}`;

  return tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: RETURN_REQUESTS_TABLE_ID,
    rowId: orderId,
    data: {
      return_Number: returnNumber,
      order_ID: orderId,
      customer_ID: userId,
      request_Type: requestType,
      reason,
      details,
      requested_Item_IDs: itemIds.join(","),
      exchange_Note: requestType === "exchange" ? exchangeNote : "",
      status: RETURN_REQUEST_STATUSES.REQUESTED,
      resolution: "pending",
      refund_Amount: 0,
      management_Note: "",
    },
    permissions: [Permission.read(Role.user(userId))],
  });
}

async function updateReturnRequest(tablesDB, requestId, payload) {
  const request = await getReturnRequest(tablesDB, requestId);
  const nextStatus = String(payload.status || "").trim();
  validateReturnTransition(request.status, nextStatus);

  const data = { status: nextStatus };

  if (payload.resolution !== undefined) {
    const resolution = String(payload.resolution || "").trim();
    if (!RETURN_RESOLUTIONS.has(resolution)) {
      const error = new Error("Invalid return resolution.");
      error.status = 400;
      throw error;
    }
    data.resolution = resolution;
  }

  if (payload.refundAmount !== undefined) {
    const amount = Number(payload.refundAmount);
    if (!Number.isSafeInteger(amount) || amount < 0) {
      const error = new Error("Refund amount must be a non-negative integer.");
      error.status = 400;
      throw error;
    }
    const order = await getOrder(tablesDB, request.order_ID);
    if (!order || amount > Number(order.total || 0)) {
      const error = new Error("Refund amount cannot exceed the order total.");
      error.status = 400;
      throw error;
    }
    data.refund_Amount = amount;
  }

  if (payload.managementNote !== undefined) {
    data.management_Note = String(payload.managementNote || "").trim().slice(0, 255);
  }

  return tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: RETURN_REQUESTS_TABLE_ID,
    rowId: requestId,
    data,
  });
}

function getPathaoConsignmentId(payload) {
  return payload?.data?.consignment_id || payload?.data?.consignmentId || payload?.consignment_id || payload?.consignmentId || null;
}

async function createPathaoDelivery(tablesDB, orderId) {
  assertPathaoConfigured();
  assertDeliveryShipmentsConfigured();

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

  try {
    const existingShipment = await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: DELIVERY_SHIPMENTS_TABLE_ID,
      rowId: orderId,
    });

    if (existingShipment?.consignment_ID) {
      const error = new Error("A courier shipment is already attached to this order.");
      error.status = 409;
      throw error;
    }
  } catch (error) {
    if (error?.code !== 404) throw error;
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

  const trackingUrl = `https://merchant.pathao.com/tracking?consignment_id=${encodeURIComponent(consignmentId)}&phone=${encodeURIComponent(order.customer_Phone || "")}`;
  const deliveryMarker = `[Pathao:${consignmentId}]`;
  const notes = String(order.notes || "").trim();
  const nextNotes = `${notes ? `${notes} ` : ""}${deliveryMarker}`.slice(0, 255);

  const shipment = await tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: DELIVERY_SHIPMENTS_TABLE_ID,
    rowId: orderId,
    data: {
      order_ID: orderId,
      provider: "pathao",
      consignment_ID: consignmentId,
      tracking_URL: trackingUrl,
      status: "created",
      payload: JSON.stringify({
        merchant_order_id: order.order_Number || order.$id,
        item_quantity: itemQuantity,
      }),
    },
    permissions: [Permission.read(Role.user(order.customer_ID))],
  });

  const updatedOrder = await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: ORDERS_TABLE_ID,
    rowId: orderId,
    data: { notes: nextNotes },
  });

  return { ...updatedOrder, deliveryShipment: shipment };
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

    const tablesDB = new TablesDB(client);

    const addressActions = new Set([
      "ensure_customer_profile",
      "get_customer_addresses",
      "create_customer_address",
      "update_customer_address",
      "set_default_customer_address",
      "delete_customer_address",
    ]);

    if (!addressActions.has(action) && (!orderId || typeof orderId !== "string")) {
      const error = new Error("Order ID is required.");
      error.status = 400;
      throw error;
    }
    let order;
    let returnRequest;

    switch (action) {
      case "ensure_customer_profile":
        return res.json({
          success: true,
          customer: await ensureCustomerProfile(tablesDB, userId, payload),
        });

      case "cancel_order_customer":
        order = await cancelOrderForCustomer(tablesDB, orderId, userId);
        break;

      case "get_customer_addresses":
        assertCustomerAddressesConfigured();
        if (!userId) throw Object.assign(new Error("Customer authentication is required."), { status: 401 });
        return res.json({
          success: true,
          addresses: await getCustomerAddresses(tablesDB, userId),
        });

      case "create_customer_address":
        assertCustomerAddressesConfigured();
        if (!userId) throw Object.assign(new Error("Customer authentication is required."), { status: 401 });
        return res.json({
          success: true,
          address: await createCustomerAddress(tablesDB, userId, payload),
        });

      case "update_customer_address":
        assertCustomerAddressesConfigured();
        if (!userId) throw Object.assign(new Error("Customer authentication is required."), { status: 401 });
        return res.json({
          success: true,
          address: await updateCustomerAddress(
            tablesDB,
            userId,
            String(payload.addressId || ""),
            payload,
          ),
        });

      case "set_default_customer_address":
        assertCustomerAddressesConfigured();
        if (!userId) throw Object.assign(new Error("Customer authentication is required."), { status: 401 });
        return res.json({
          success: true,
          address: await setDefaultCustomerAddress(
            tablesDB,
            userId,
            String(payload.addressId || ""),
          ),
        });

      case "delete_customer_address":
        assertCustomerAddressesConfigured();
        if (!userId) throw Object.assign(new Error("Customer authentication is required."), { status: 401 });
        return res.json({
          success: true,
          ...(await deleteCustomerAddress(
            tablesDB,
            userId,
            String(payload.addressId || ""),
          )),
        });

      case "create_return_customer":
        assertReturnRequestsConfigured();
        returnRequest = await createCustomerReturnRequest(tablesDB, orderId, userId, payload);
        break;

      case "update_return_request":
        assertReturnRequestsConfigured();
        await assertManagementAccess(client, userId);
        returnRequest = await updateReturnRequest(tablesDB, orderId, payload);
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

    return res.json({
      success: true,
      ...(returnRequest ? { returnRequest } : { order }),
    });
  } catch (error) {
    logError(`Order management failed: ${error?.stack || error?.message || "Unknown error"}`);

    return res.json(
      { success: false, error: error?.message || "Unable to manage order." },
      error?.status || 500,
    );
  }
};
