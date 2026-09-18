import { ID, Query } from "appwrite";

import { tablesDB } from "../utils/appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const CUSTOMER_ADDRESSES_TABLE_ID =
  import.meta.env.VITE_APPWRITE_CUSTOMER_ADDRESSES_TABLE_ID;

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


export async function getCustomerAddresses(userId) {
  validateUserId(userId);

  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: CUSTOMER_ADDRESSES_TABLE_ID,
    queries: [Query.equal("customer_ID", userId), Query.limit(50)],
    total: false,
  });

  return [...response.rows].sort((a, b) => {
    if (Boolean(a.is_Default) !== Boolean(b.is_Default)) {
      return a.is_Default ? -1 : 1;
    }

    return new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime();
  });
}

export async function createCustomerAddress(userId, addressData) {
  validateUserId(userId);

  const data = normalizeAddressData(addressData);
  const existingAddresses = await getCustomerAddresses(userId);
  const shouldBeDefault =
    existingAddresses.length === 0 || Boolean(addressData.is_Default);
  const rowId = ID.unique();

  const transaction = await tablesDB.createTransaction();

  try {
    await tablesDB.createRow({
      databaseId: DATABASE_ID,
      tableId: CUSTOMER_ADDRESSES_TABLE_ID,
      rowId,
      data: {
        customer_ID: userId,
        ...data,
        is_Default: false,
      },
      transactionId: transaction.$id,
    });

    if (shouldBeDefault) {
      const operations = existingAddresses
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

      if (operations.length > 0) {
        await tablesDB.createOperations({
          transactionId: transaction.$id,
          operations,
        });
      }
    }

    await tablesDB.updateTransaction({
      transactionId: transaction.$id,
      commit: true,
    });

    return tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: CUSTOMER_ADDRESSES_TABLE_ID,
      rowId,
    });
  } catch (error) {
    try {
      await tablesDB.updateTransaction({
        transactionId: transaction.$id,
        rollback: true,
      });
    } catch {
      // Preserve the original error when rollback is unavailable/already failed.
    }

    throw error;
  }
}

export async function updateCustomerAddress(userId, addressId, addressData) {
  validateUserId(userId);

  if (!addressId) {
    throw new Error("Address ID is required.");
  }

  const data = normalizeAddressData(addressData);

  const existing = await tablesDB.getRow({
    databaseId: DATABASE_ID,
    tableId: CUSTOMER_ADDRESSES_TABLE_ID,
    rowId: addressId,
  });

  if (existing.customer_ID !== userId) {
    throw new Error("You do not have permission to update this address.");
  }

  if (Boolean(addressData.is_Default) && !existing.is_Default) {
    await setDefaultCustomerAddress(userId, addressId);
  }

  return tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: CUSTOMER_ADDRESSES_TABLE_ID,
    rowId: addressId,
    data,
  });
}

export async function setDefaultCustomerAddress(userId, addressId) {
  validateUserId(userId);

  if (!addressId) {
    throw new Error("Address ID is required.");
  }

  const addresses = await getCustomerAddresses(userId);
  const target = addresses.find((address) => address.$id === addressId);

  if (!target) {
    throw new Error("Address not found.");
  }

  const currentDefaults = addresses.filter(
    (address) => address.is_Default && address.$id !== addressId,
  );

  await Promise.all(
    currentDefaults.map((address) =>
      tablesDB.updateRow({
        databaseId: DATABASE_ID,
        tableId: CUSTOMER_ADDRESSES_TABLE_ID,
        rowId: address.$id,
        data: { is_Default: false },
      }),
    ),
  );

  if (target.is_Default) {
    return target;
  }

  return tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: CUSTOMER_ADDRESSES_TABLE_ID,
    rowId: addressId,
    data: { is_Default: true },
  });
}

export async function deleteCustomerAddress(userId, addressId) {
  validateUserId(userId);

  if (!addressId) {
    throw new Error("Address ID is required.");
  }

  const addresses = await getCustomerAddresses(userId);
  const target = addresses.find((address) => address.$id === addressId);

  if (!target) {
    throw new Error("Address not found.");
  }

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

  return true;
}
