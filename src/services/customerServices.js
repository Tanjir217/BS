import { ID, Query } from "appwrite";
import { tablesDB } from "../utils/appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

const CUSTOMERS_TABLE_ID =
  import.meta.env.VITE_APPWRITE_CUSTOMERS_TABLE_ID;

const CUSTOMER_TIER_RULES_TABLE_ID =
  import.meta.env.VITE_APPWRITE_CUSTOMER_TIER_RULES_TABLE_ID;

/*
|--------------------------------------------------------------------------
| Customer tiers
|--------------------------------------------------------------------------
*/

export const CUSTOMER_TIERS = {
  REGULAR: "regular",
  PREMIUM: "premium",
  VIP: "vip",
};

/*
|--------------------------------------------------------------------------
| Customer helpers
|--------------------------------------------------------------------------
*/

export function getCustomerName(customer) {
  return [customer?.first_Name, customer?.last_Name]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function getCustomerInitials(customer) {
  const firstName = String(customer?.first_Name || "").trim();
  const lastName = String(customer?.last_Name || "").trim();

  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  if (firstName) {
    return firstName.charAt(0).toUpperCase();
  }

  if (lastName) {
    return lastName.charAt(0).toUpperCase();
  }

  return "?";
}

/*
|--------------------------------------------------------------------------
| Get customers
|--------------------------------------------------------------------------
*/

export async function getCustomers({
  page = 1,
  limit = 10,
  tier = "all",
  active = "all",
} = {}) {
  const safePage = Math.max(1, Number(page) || 1);

  const safeLimit = Math.min(
    50,
    Math.max(1, Number(limit) || 10)
  );

  const offset = (safePage - 1) * safeLimit;

  const queries = [
    Query.orderDesc("$createdAt"),
    Query.limit(safeLimit),
    Query.offset(offset),
  ];

  if (tier !== "all") {
    if (!Object.values(CUSTOMER_TIERS).includes(tier)) {
      throw new Error("Invalid customer tier filter.");
    }

    queries.push(Query.equal("customer_Tier", tier));
  }

  if (active !== "all") {
    queries.push(
      Query.equal("is_Active", active === "active")
    );
  }

  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: CUSTOMERS_TABLE_ID,
    queries,
  });

  return {
    customers: response.rows,
    total: response.total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(
      1,
      Math.ceil(response.total / safeLimit)
    ),
  };
}

/*
|--------------------------------------------------------------------------
| Get customer by ID
|--------------------------------------------------------------------------
*/

export async function getCustomerById(customerId) {
  if (!customerId) {
    throw new Error("Customer ID is required.");
  }

  try {
    return await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: CUSTOMERS_TABLE_ID,
      rowId: customerId,
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
| Create customer
|--------------------------------------------------------------------------
*/

export async function createCustomer(customerData) {
  const firstName = String(
    customerData.first_Name || ""
  ).trim();

  const lastName = String(
    customerData.last_Name || ""
  ).trim();

  const email = String(
    customerData.email || ""
  ).trim();

  const phone = String(
    customerData.phone || ""
  ).trim();

  if (!firstName) {
    throw new Error("Customer first name is required.");
  }

  if (!email) {
    throw new Error("Customer email is required.");
  }

  if (!phone) {
    throw new Error("Customer phone is required.");
  }

  return tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: CUSTOMERS_TABLE_ID,
    rowId: ID.unique(),
    data: {
      first_Name: firstName,
      last_Name: lastName,
      email,
      phone,

      account_ID: customerData.account_ID || "",
      profile_Image_File_ID:
        customerData.profile_Image_File_ID || "",

      address: customerData.address || "",
      city: customerData.city || "",
      postal_Code: customerData.postal_Code || "",
      whatsapp_Number:
        customerData.whatsapp_Number || "",

      customer_Tier:
        customerData.customer_Tier ||
        CUSTOMER_TIERS.REGULAR,

      is_Active:
        customerData.is_Active ?? true,

      total_Orders:
        Number(customerData.total_Orders) || 0,

      total_Spent:
        Number(customerData.total_Spent) || 0,

      last_Order_At:
        customerData.last_Order_At || "",
    },
  });
}

/*
|--------------------------------------------------------------------------
| Update customer
|--------------------------------------------------------------------------
*/

export async function updateCustomer(
  customerId,
  customerData
) {
  if (!customerId) {
    throw new Error("Customer ID is required.");
  }

  return tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: CUSTOMERS_TABLE_ID,
    rowId: customerId,
    data: {
      first_Name: String(
        customerData.first_Name || ""
      ).trim(),

      last_Name: String(
        customerData.last_Name || ""
      ).trim(),

      email: String(
        customerData.email || ""
      ).trim(),

      phone: String(
        customerData.phone || ""
      ).trim(),

      account_ID:
        customerData.account_ID || "",

      profile_Image_File_ID:
        customerData.profile_Image_File_ID || "",

      address:
        customerData.address || "",

      city:
        customerData.city || "",

      postal_Code:
        customerData.postal_Code || "",

      whatsapp_Number:
        customerData.whatsapp_Number || "",

      customer_Tier:
        customerData.customer_Tier ||
        CUSTOMER_TIERS.REGULAR,

      is_Active:
        customerData.is_Active ?? true,

      total_Orders:
        Number(customerData.total_Orders) || 0,

      total_Spent:
        Number(customerData.total_Spent) || 0,

      last_Order_At:
        customerData.last_Order_At || "",
    },
  });
}

/*
|--------------------------------------------------------------------------
| Customer statistics
|--------------------------------------------------------------------------
*/

export async function getCustomerStats() {
  const [
    allCustomers,
    activeCustomers,
    premiumCustomers,
    vipCustomers,
    noPurchaseCustomers,
  ] = await Promise.all([
    tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: CUSTOMERS_TABLE_ID,
      queries: [Query.limit(1)],
    }),

    tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: CUSTOMERS_TABLE_ID,
      queries: [
        Query.equal("is_Active", true),
        Query.limit(1),
      ],
    }),

    tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: CUSTOMERS_TABLE_ID,
      queries: [
        Query.equal(
          "customer_Tier",
          CUSTOMER_TIERS.PREMIUM
        ),
        Query.limit(1),
      ],
    }),

    tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: CUSTOMERS_TABLE_ID,
      queries: [
        Query.equal(
          "customer_Tier",
          CUSTOMER_TIERS.VIP
        ),
        Query.limit(1),
      ],
    }),

    tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: CUSTOMERS_TABLE_ID,
      queries: [
        Query.equal("total_Orders", 0),
        Query.limit(1),
      ],
    }),
  ]);

  return {
    total: allCustomers.total,
    active: activeCustomers.total,
    premium: premiumCustomers.total,
    vip: vipCustomers.total,
    noPurchase: noPurchaseCustomers.total,
  };
}

/*
|--------------------------------------------------------------------------
| Get customer tier rules
|--------------------------------------------------------------------------
*/

export async function getCustomerTierRules() {
  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: CUSTOMER_TIER_RULES_TABLE_ID,
    queries: [
      Query.equal("is_Active", true),
      Query.orderAsc("sort_Order"),
    ],
  });

  return response.rows;
}

/*
|--------------------------------------------------------------------------
| Get customer orders
|--------------------------------------------------------------------------
*/

export async function getCustomerOrders({
  customerId,
  page = 1,
  limit = 10,
} = {}) {
  if (!customerId) {
    throw new Error("Customer ID is required.");
  }

  const safePage = Math.max(1, Number(page) || 1);

  const safeLimit = Math.min(
    50,
    Math.max(1, Number(limit) || 10)
  );

  const offset = (safePage - 1) * safeLimit;

  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId:
      import.meta.env.VITE_APPWRITE_ORDERS_TABLE_ID,
    queries: [
      Query.equal("customer_ID", customerId),
      Query.orderDesc("$createdAt"),
      Query.limit(safeLimit),
      Query.offset(offset),
    ],
  });

  return {
    orders: response.rows,
    total: response.total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(
      1,
      Math.ceil(response.total / safeLimit)
    ),
  };
}