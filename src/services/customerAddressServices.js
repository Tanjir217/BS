import { supabase } from "../utils/supabase";

export const ADDRESS_LABELS = {
  HOME: "home",
  OFFICE: "office",
  OTHER: "other",
};

const ADDRESS_LABEL_VALUES = Object.values(ADDRESS_LABELS);

function validateUserId(userId) {
  if (!userId) throw new Error("Customer authentication is required.");
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

  if (!ADDRESS_LABEL_VALUES.includes(label)) throw new Error("Please select a valid address type.");
  if (!recipientName) throw new Error("Recipient name is required.");
  if (!phone) throw new Error("Phone number is required.");
  if (!addressLine1) throw new Error("Address is required.");
  if (!city) throw new Error("City is required.");
  if (!postalCode) throw new Error("Postal code is required.");
  if (!country) throw new Error("Country is required.");

  return {
    label,
    recipient_name: recipientName,
    phone,
    address_line_1: addressLine1,
    address_line_2: addressLine2,
    city,
    postal_code: postalCode,
    country,
  };
}

function mapAddress(row) {
  if (!row) return null;
  return {
    $id: row.id,
    $createdAt: row.created_at,
    $updatedAt: row.updated_at,
    customer_ID: row.customer_id,
    label: row.label,
    recipient_Name: row.recipient_name,
    phone: row.phone,
    address_Line_1: row.address_line_1,
    address_Line_2: row.address_line_2,
    city: row.city,
    postal_Code: row.postal_code,
    country: row.country,
    is_Default: row.is_default,
  };
}

async function requireCurrentUser(userId) {
  validateUserId(userId);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || data.user.id !== userId) {
    throw new Error("Customer authentication is required.");
  }
  return data.user.id;
}

export async function getCustomerAddresses(userId) {
  const customerId = await requireCurrentUser(userId);
  const { data, error } = await supabase
    .from("customer_addresses")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapAddress);
}

export async function createCustomerAddress(userId, addressData) {
  const customerId = await requireCurrentUser(userId);
  const data = normalizeAddressData(addressData);
  const { data: row, error } = await supabase
    .from("customer_addresses")
    .insert({ customer_id: customerId, ...data, is_default: Boolean(addressData.is_Default) })
    .select("*")
    .single();
  if (error) throw error;
  return mapAddress(row);
}

export async function updateCustomerAddress(userId, addressId, addressData) {
  const customerId = await requireCurrentUser(userId);
  if (!addressId) throw new Error("Address ID is required.");
  const data = normalizeAddressData(addressData);
  const { data: row, error } = await supabase
    .from("customer_addresses")
    .update({ ...data, is_default: Boolean(addressData.is_Default) })
    .eq("id", addressId)
    .eq("customer_id", customerId)
    .select("*")
    .single();
  if (error) throw error;
  return mapAddress(row);
}

export async function setDefaultCustomerAddress(userId, addressId) {
  const customerId = await requireCurrentUser(userId);
  if (!addressId) throw new Error("Address ID is required.");
  const { data: row, error } = await supabase
    .from("customer_addresses")
    .update({ is_default: true })
    .eq("id", addressId)
    .eq("customer_id", customerId)
    .select("*")
    .single();
  if (error) throw error;
  return mapAddress(row);
}

export async function deleteCustomerAddress(userId, addressId) {
  const customerId = await requireCurrentUser(userId);
  if (!addressId) throw new Error("Address ID is required.");
  const { error } = await supabase
    .from("customer_addresses")
    .delete()
    .eq("id", addressId)
    .eq("customer_id", customerId);
  if (error) throw error;
  return true;
}
