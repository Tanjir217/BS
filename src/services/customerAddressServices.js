import { functions } from "../utils/appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
export const ADDRESS_LABELS = {
  HOME: "home",
  OFFICE: "office",
  OTHER: "other",
};

const ADDRESS_LABEL_VALUES = Object.values(ADDRESS_LABELS);

function validateUserId(userId) {
  if (!userId) {
    throw new Error("Customer authentication is required.");
  }
}

function normalizeAddressData(addressData = {}) {
  const label = String(addressData.label || "").trim().toLowerCase();
  const recipientName = String(addressData.recipient_Name || "").trim();
  const phone = String(addressData.phone || "").trim();
  const addressLine1 = String(addressData.address_Line_1 || "").trim();
  const addressLine2 = String(addressData.address_Line_2 || "").trim();
  const city = String(addressData.city || "").trim();
  const postalCode = String(addressData.postal_Code || "").trim();
  const country = String(addressData.country || "").trim();

  if (!ADDRESS_LABEL_VALUES.includes(label)) {
    throw new Error("Please select a valid address type.");
  }
  if (!recipientName) throw new Error("Recipient name is required.");
  if (!phone) throw new Error("Phone number is required.");
  if (!addressLine1) throw new Error("Address is required.");
  if (!city) throw new Error("City is required.");
  if (!postalCode) throw new Error("Postal code is required.");
  if (!country) throw new Error("Country is required.");

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


async function executeAddressAction(payload) {
  const functionId = import.meta.env.VITE_APPWRITE_MANAGE_ORDER_FUNCTION_ID;

  if (!functionId) {
    throw new Error("Manage-order function is not configured.");
  }

  const execution = await functions.createExecution({
    functionId,
    body: JSON.stringify(payload),
    async: false,
    path: "/",
    method: "POST",
  });

  let response;

  try {
    response = JSON.parse(execution.responseBody || "{}");
  } catch {
    throw new Error("The address service returned an invalid response.");
  }

  if (!response.success) {
    throw new Error(response.error || "Unable to manage the saved address.");
  }

  return response;
}

export async function getCustomerAddresses(userId) {
  validateUserId(userId);

  const response = await executeAddressAction({
    action: "get_customer_addresses",
  });

  return response.addresses || [];
}

export async function createCustomerAddress(userId, addressData) {
  validateUserId(userId);

  const data = normalizeAddressData(addressData);

  const response = await executeAddressAction({
    action: "create_customer_address",
    ...data,
    is_Default: Boolean(addressData.is_Default),
  });

  return response.address;
}

export async function updateCustomerAddress(userId, addressId, addressData) {
  validateUserId(userId);

  if (!addressId) {
    throw new Error("Address ID is required.");
  }

  const data = normalizeAddressData(addressData);

  const response = await executeAddressAction({
    action: "update_customer_address",
    addressId,
    ...data,
    is_Default: Boolean(addressData.is_Default),
  });

  return response.address;
}

export async function setDefaultCustomerAddress(userId, addressId) {
  validateUserId(userId);

  if (!addressId) {
    throw new Error("Address ID is required.");
  }

  const response = await executeAddressAction({
    action: "set_default_customer_address",
    addressId,
  });

  return response.address;
}

export async function deleteCustomerAddress(userId, addressId) {
  validateUserId(userId);

  if (!addressId) {
    throw new Error("Address ID is required.");
  }

  await executeAddressAction({
    action: "delete_customer_address",
    addressId,
  });

  return true;
}
