import { Query } from "appwrite";
import { tablesDB } from "../utils/appwrite";
import { CUSTOMER_TIERS } from "./customerServices";
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const ORDER_ITEMS_TABLE_ID = import.meta.env.VITE_APPWRITE_ORDER_ITEMS_TABLE_ID;
const ORDERS_TABLE_ID = import.meta.env.VITE_APPWRITE_ORDERS_TABLE_ID;
const PRODUCTS_TABLE_ID = import.meta.env.VITE_APPWRITE_PRODUCTS_TABLE_ID;
const CATEGORIES_TABLE_ID = import.meta.env.VITE_APPWRITE_CATEGORIES_TABLE_ID;
const CUSTOMERS_TABLE_ID = import.meta.env.VITE_APPWRITE_CUSTOMERS_TABLE_ID;
const REVENUE_ORDER_STATUS = "delivered";
const REVENUE_PAYMENT_STATUS = "paid";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function startOfDay(date) {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  return result;
}

function formatDateKey(date) {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDayLabel(date, range) {
  if (range <= 7) {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

async function getAllRows({ tableId, queries = [], pageSize = 100 }) {
  const rows = [];

  let offset = 0;

  while (true) {
    const response = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId,
      queries: [...queries, Query.limit(pageSize), Query.offset(offset)],
    });

    rows.push(...response.rows);

    if (rows.length >= response.total) {
      break;
    }

    if (response.rows.length === 0) {
      break;
    }

    offset += response.rows.length;
  }

  return rows;
}

function isRevenueOrder(order) {
  return (
    order?.order_Status === REVENUE_ORDER_STATUS &&
    order?.payment_Status === REVENUE_PAYMENT_STATUS
  );
}

function calculateRevenue(orders) {
  return orders
    .filter(isRevenueOrder)
    .reduce((total, order) => total + Number(order.total || 0), 0);
}

function calculatePercentageChange(current, previous) {
  if (previous === 0) {
    if (current === 0) {
      return 0;
    }

    return 100;
  }

  return ((current - previous) / previous) * 100;
}

/*
|--------------------------------------------------------------------------
| Analytics Overview
|--------------------------------------------------------------------------
*/

export async function getAnalyticsOverview(range = 30) {
  const safeRange = [7, 30, 90].includes(Number(range)) ? Number(range) : 30;

  const now = new Date();

  const currentStart = startOfDay(
    new Date(now.getTime() - (safeRange - 1) * 24 * 60 * 60 * 1000),
  );

  const previousStart = startOfDay(
    new Date(currentStart.getTime() - safeRange * 24 * 60 * 60 * 1000),
  );

  const previousEnd = new Date(currentStart.getTime() - 1);

  const [currentOrders, previousOrders] = await Promise.all([
    getAllRows({
      tableId: ORDERS_TABLE_ID,
      queries: [
        Query.greaterThanEqual("$createdAt", currentStart.toISOString()),
        Query.lessThanEqual("$createdAt", now.toISOString()),
      ],
    }),

    getAllRows({
      tableId: ORDERS_TABLE_ID,
      queries: [
        Query.greaterThanEqual("$createdAt", previousStart.toISOString()),
        Query.lessThanEqual("$createdAt", previousEnd.toISOString()),
      ],
    }),
  ]);

  const revenueOrders = currentOrders.filter(isRevenueOrder);

  const previousRevenueOrders = previousOrders.filter(isRevenueOrder);

  const revenue = calculateRevenue(currentOrders);

  const previousRevenue = calculateRevenue(previousOrders);

  const orders = currentOrders.length;

  const previousOrderCount = previousOrders.length;

  const averageOrderValue =
    revenueOrders.length > 0 ? revenue / revenueOrders.length : 0;

  const previousAverageOrderValue =
    previousRevenueOrders.length > 0
      ? previousRevenue / previousRevenueOrders.length
      : 0;

  /*
  |--------------------------------------------------------------------------
  | Revenue trend
  |--------------------------------------------------------------------------
  */

  const revenueByDate = new Map();

  for (let index = 0; index < safeRange; index += 1) {
    const date = new Date(currentStart.getTime() + index * 24 * 60 * 60 * 1000);

    revenueByDate.set(formatDateKey(date), {
      date: formatDateKey(date),

      label: formatDayLabel(date, safeRange),

      value: 0,
    });
  }

  for (const order of revenueOrders) {
    const createdAt = new Date(order.$createdAt);

    const key = formatDateKey(createdAt);

    const entry = revenueByDate.get(key);

    if (entry) {
      entry.value += Number(order.total || 0);
    }
  }

  return {
    range: safeRange,

    metrics: {
      revenue,

      revenueChange: calculatePercentageChange(revenue, previousRevenue),

      orders,

      ordersChange: calculatePercentageChange(orders, previousOrderCount),

      averageOrderValue,

      averageOrderValueChange: calculatePercentageChange(
        averageOrderValue,
        previousAverageOrderValue,
      ),
    },

    revenueTrend: Array.from(revenueByDate.values()),
  };
}
/*
|--------------------------------------------------------------------------
| Sales Analytics
|--------------------------------------------------------------------------
*/

export async function getSalesAnalytics(range = 30) {
  const safeRange = [7, 30, 90].includes(Number(range)) ? Number(range) : 30;

  const now = new Date();

  const startDate = startOfDay(
    new Date(now.getTime() - (safeRange - 1) * 24 * 60 * 60 * 1000),
  );

  const orders = await getAllRows({
    tableId: ORDERS_TABLE_ID,
    queries: [
      Query.greaterThanEqual("$createdAt", startDate.toISOString()),
      Query.lessThanEqual("$createdAt", now.toISOString()),
    ],
  });

  const revenueOrders = orders.filter(isRevenueOrder);

  const revenue = calculateRevenue(orders);

  const orderCount = orders.length;

  const averageOrderValue =
    revenueOrders.length > 0 ? revenue / revenueOrders.length : 0;

  /*
  |--------------------------------------------------------------------------
  | Revenue and order trends
  |--------------------------------------------------------------------------
  */

  const trendMap = new Map();

  for (let index = 0; index < safeRange; index += 1) {
    const date = new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000);

    const key = formatDateKey(date);

    trendMap.set(key, {
      date: key,

      label: formatDayLabel(date, safeRange),

      revenue: 0,

      orders: 0,
    });
  }

  for (const order of orders) {
    const createdAt = new Date(order.$createdAt);

    const key = formatDateKey(createdAt);

    const entry = trendMap.get(key);

    if (!entry) {
      continue;
    }

    entry.orders += 1;

    if (isRevenueOrder(order)) {
      entry.revenue += Number(order.total || 0);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Order status breakdown
  |--------------------------------------------------------------------------
  */

  const statusCounts = {
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };

  for (const order of orders) {
    const status = order?.order_Status;

    if (Object.prototype.hasOwnProperty.call(statusCounts, status)) {
      statusCounts[status] += 1;
    }
  }

  return {
    range: safeRange,

    metrics: {
      revenue,

      orders: orderCount,

      averageOrderValue,
    },

    trend: Array.from(trendMap.values()),

    statusBreakdown: [
      {
        key: "pending",
        label: "Pending",
        count: statusCounts.pending,
      },
      {
        key: "confirmed",
        label: "Confirmed",
        count: statusCounts.confirmed,
      },
      {
        key: "processing",
        label: "Processing",
        count: statusCounts.processing,
      },
      {
        key: "shipped",
        label: "Shipped",
        count: statusCounts.shipped,
      },
      {
        key: "delivered",
        label: "Delivered",
        count: statusCounts.delivered,
      },
      {
        key: "cancelled",
        label: "Cancelled",
        count: statusCounts.cancelled,
      },
    ],
  };
}
/*
|--------------------------------------------------------------------------
| Product Analytics
|--------------------------------------------------------------------------
*/

export async function getProductAnalytics(range = 30) {
  const safeRange = [7, 30, 90].includes(Number(range)) ? Number(range) : 30;

  const now = new Date();

  const startDate = startOfDay(
    new Date(now.getTime() - (safeRange - 1) * 24 * 60 * 60 * 1000),
  );

  const orders = await getAllRows({
    tableId: ORDERS_TABLE_ID,
    queries: [
      Query.greaterThanEqual("$createdAt", startDate.toISOString()),
      Query.lessThanEqual("$createdAt", now.toISOString()),
    ],
  });

  const revenueOrders = orders.filter(isRevenueOrder);

  const revenueOrderIds = new Set(revenueOrders.map((order) => order.$id));

  if (revenueOrders.length === 0) {
    return {
      range: safeRange,

      metrics: {
        revenue: 0,
        unitsSold: 0,
        productsSold: 0,
      },

      products: [],
      categories: [],
    };
  }

  const [orderItems, products, categories] = await Promise.all([
    getAllRows({
      tableId: ORDER_ITEMS_TABLE_ID,
    }),

    getAllRows({
      tableId: PRODUCTS_TABLE_ID,
    }),

    getAllRows({
      tableId: CATEGORIES_TABLE_ID,
    }),
  ]);

  const productMap = new Map(products.map((product) => [product.$id, product]));

  const categoryMap = new Map(
    categories.map((category) => [category.$id, category]),
  );

  const productStats = new Map();

  let totalRevenue = 0;
  let totalUnitsSold = 0;

  for (const item of orderItems) {
    if (!revenueOrderIds.has(item.order_ID)) {
      continue;
    }

    const productId = item.product_ID;

    const quantity = Number(item.quantity || 0);

    const lineTotal = Number(item.line_Total || 0);

    if (!productStats.has(productId)) {
      const product = productMap.get(productId);

      const categoryId = product?.categoryID || null;

      const category = categoryId ? categoryMap.get(categoryId) : null;

      productStats.set(productId, {
        productId,

        name: item.product_Name || product?.name || "Unknown Product",

        sku: item.product_SKU || product?.sku || "",

        categoryId,

        categoryName: category?.name || "Uncategorized",

        unitsSold: 0,

        revenue: 0,

        orderIds: new Set(),
      });
    }

    const stats = productStats.get(productId);

    stats.unitsSold += quantity;

    stats.revenue += lineTotal;

    stats.orderIds.add(item.order_ID);

    totalUnitsSold += quantity;

    totalRevenue += lineTotal;
  }

  const productResults = Array.from(productStats.values())
    .map((product) => ({
      productId: product.productId,

      name: product.name,

      sku: product.sku,

      categoryId: product.categoryId,

      categoryName: product.categoryName,

      unitsSold: product.unitsSold,

      revenue: product.revenue,

      orderCount: product.orderIds.size,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const categoryStats = new Map();

  for (const product of productResults) {
    const categoryId = product.categoryId || "uncategorized";

    const categoryName = product.categoryName || "Uncategorized";

    if (!categoryStats.has(categoryId)) {
      categoryStats.set(categoryId, {
        categoryId,

        name: categoryName,

        revenue: 0,

        unitsSold: 0,

        productCount: 0,
      });
    }

    const category = categoryStats.get(categoryId);

    category.revenue += product.revenue;

    category.unitsSold += product.unitsSold;

    category.productCount += 1;
  }

  return {
    range: safeRange,

    metrics: {
      revenue: totalRevenue,

      unitsSold: totalUnitsSold,

      productsSold: productResults.length,
    },

    products: productResults,

    categories: Array.from(categoryStats.values()).sort(
      (a, b) => b.revenue - a.revenue,
    ),
  };
}
/*
|--------------------------------------------------------------------------
| Customer Analytics
|--------------------------------------------------------------------------
*/

export async function getCustomerAnalytics(range = 30) {
  const safeRange = [7, 30, 90].includes(Number(range)) ? Number(range) : 30;

  const now = new Date();

  const startDate = startOfDay(
    new Date(now.getTime() - (safeRange - 1) * 24 * 60 * 60 * 1000),
  );

  const [currentOrders, historicalOrders, customers] = await Promise.all([
    getAllRows({
      tableId: ORDERS_TABLE_ID,
      queries: [
        Query.greaterThanEqual("$createdAt", startDate.toISOString()),
        Query.lessThanEqual("$createdAt", now.toISOString()),
      ],
    }),

    getAllRows({
      tableId: ORDERS_TABLE_ID,
      queries: [Query.lessThan("$createdAt", startDate.toISOString())],
    }),

    getAllRows({
      tableId: CUSTOMERS_TABLE_ID,
    }),
  ]);

  const customerMap = new Map(
    customers.map((customer) => [customer.$id, customer]),
  );

  const revenueOrders = currentOrders.filter(isRevenueOrder);

  /*
  |--------------------------------------------------------------------------
  | Historical purchasing customers
  |--------------------------------------------------------------------------
  */

  const historicalCustomerIds = new Set();

  for (const order of historicalOrders) {
    if (!isRevenueOrder(order) || !order.customer_ID) {
      continue;
    }

    historicalCustomerIds.add(order.customer_ID);
  }

  /*
  |--------------------------------------------------------------------------
  | Current customer aggregation
  |--------------------------------------------------------------------------
  */

  const customerStats = new Map();

  let customerRevenue = 0;

  const currentCustomerIds = new Set();

  for (const order of revenueOrders) {
    const customerId = order.customer_ID;

    /*
     * Guest orders do not belong to a
     * customer analytics profile.
     */
    if (!customerId) {
      continue;
    }

    const customer = customerMap.get(customerId);

    /*
     * Ignore orphaned customer IDs
     * instead of showing incomplete
     * customer records.
     */
    if (!customer) {
      continue;
    }

    currentCustomerIds.add(customerId);

    const revenue = Number(order.total || 0);

    customerRevenue += revenue;

    if (!customerStats.has(customerId)) {
      customerStats.set(customerId, {
        customerId,

        name:
          [customer.first_Name, customer.last_Name]
            .filter(Boolean)
            .join(" ")
            .trim() || "Unnamed Customer",

        email: customer.email || "",

        tier: customer.customer_Tire || CUSTOMER_TIERS.REGULAR,

        revenue: 0,

        orderCount: 0,
      });
    }

    const stats = customerStats.get(customerId);

    stats.revenue += revenue;

    stats.orderCount += 1;
  }

  /*
  |--------------------------------------------------------------------------
  | New and returning customers
  |--------------------------------------------------------------------------
  */

  let newCustomers = 0;
  let returningCustomers = 0;

  for (const customerId of currentCustomerIds) {
    const customer = customerMap.get(customerId);

    if (!customer) {
      continue;
    }

    const createdAt = new Date(customer.$createdAt);

    if (
      !Number.isNaN(createdAt.getTime()) &&
      createdAt >= startDate &&
      createdAt <= now
    ) {
      newCustomers += 1;
      continue;
    }

    if (historicalCustomerIds.has(customerId)) {
      returningCustomers += 1;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Top customers
  |--------------------------------------------------------------------------
  */

  const topCustomers = Array.from(customerStats.values()).sort(
    (a, b) => b.revenue - a.revenue,
  );

  /*
  |--------------------------------------------------------------------------
  | Tier performance
  |--------------------------------------------------------------------------
  */

  const tierStats = new Map();

  for (const customer of topCustomers) {
    const tier = customer.tier || CUSTOMER_TIERS.REGULAR;

    if (!tierStats.has(tier)) {
      tierStats.set(tier, {
        tier,
        customerCount: 0,
        revenue: 0,
        orderCount: 0,
      });
    }

    const stats = tierStats.get(tier);

    stats.customerCount += 1;

    stats.revenue += customer.revenue;

    stats.orderCount += customer.orderCount;
  }

  const tierOrder = [
    CUSTOMER_TIERS.VIP,
    CUSTOMER_TIERS.PREMIUM,
    CUSTOMER_TIERS.REGULAR,
  ];

  const tierPerformance = tierOrder
    .map((tier) => tierStats.get(tier))
    .filter(Boolean);

  /*
  |--------------------------------------------------------------------------
  | Metrics
  |--------------------------------------------------------------------------
  */

  const purchasingCustomers = currentCustomerIds.size;

  const averageCustomerSpend =
    purchasingCustomers > 0 ? customerRevenue / purchasingCustomers : 0;

  return {
    range: safeRange,

    metrics: {
      revenue: customerRevenue,

      purchasingCustomers,

      newCustomers,

      returningCustomers,

      averageCustomerSpend,
    },

    topCustomers: topCustomers.slice(0, 8),

    tierPerformance,
  };
}
