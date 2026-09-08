import { Query } from "appwrite";
import { tablesDB } from "../utils/appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

const ORDERS_TABLE_ID =
  import.meta.env.VITE_APPWRITE_ORDERS_TABLE_ID;

const ORDER_ITEMS_TABLE_ID =
  import.meta.env.VITE_APPWRITE_ORDER_ITEMS_TABLE_ID;

const PRODUCTS_TABLE_ID =
  import.meta.env.VITE_APPWRITE_PRODUCTS_TABLE_ID;

/*
|--------------------------------------------------------------------------
| Dashboard rules
|--------------------------------------------------------------------------
|
| Revenue is counted only when:
| - order_Status === "delivered"
| - payment_Status === "paid"
|
*/

const REVENUE_ORDER_STATUS = "delivered";
const REVENUE_PAYMENT_STATUS = "paid";

const LOW_STOCK_THRESHOLD = 5;

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

function endOfDay(date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDayLabel(date, range) {
  if (range === 7) {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

async function getAllRows({
  tableId,
  queries = [],
  pageSize = 100,
}) {
  const rows = [];
  let offset = 0;

  while (true) {
    const response = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId,
      queries: [
        ...queries,
        Query.limit(pageSize),
        Query.offset(offset),
      ],
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

/*
|--------------------------------------------------------------------------
| Revenue
|--------------------------------------------------------------------------
*/

function isRevenueOrder(order) {
  return (
    order?.order_Status === REVENUE_ORDER_STATUS &&
    order?.payment_Status === REVENUE_PAYMENT_STATUS
  );
}

function calculateRevenue(orders) {
  return orders
    .filter(isRevenueOrder)
    .reduce((total, order) => {
      return total + Number(order.total || 0);
    }, 0);
}

/*
|--------------------------------------------------------------------------
| Dashboard stats
|--------------------------------------------------------------------------
*/

export async function getDashboardStats() {
  const now = new Date();

  const todayStart = startOfDay(now);
  const yesterdayStart = startOfDay(
    new Date(now.getTime() - 24 * 60 * 60 * 1000)
  );

  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const previousMonthStart = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  );

  const previousMonthEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
    999
  );

  const [
    revenueOrders,
    todayOrders,
    yesterdayOrders,
    monthOrders,
    previousMonthOrders,
    activeProductsResponse,
  ] = await Promise.all([
    getAllRows({
      tableId: ORDERS_TABLE_ID,
      queries: [
        Query.equal(
          "order_Status",
          REVENUE_ORDER_STATUS
        ),
        Query.equal(
          "payment_Status",
          REVENUE_PAYMENT_STATUS
        ),
      ],
    }),

    getAllRows({
      tableId: ORDERS_TABLE_ID,
      queries: [
        Query.greaterThanEqual(
          "$createdAt",
          todayStart.toISOString()
        ),
        Query.lessThanEqual(
          "$createdAt",
          endOfDay(now).toISOString()
        ),
      ],
    }),

    getAllRows({
      tableId: ORDERS_TABLE_ID,
      queries: [
        Query.greaterThanEqual(
          "$createdAt",
          yesterdayStart.toISOString()
        ),
        Query.lessThanEqual(
          "$createdAt",
          new Date(
            todayStart.getTime() - 1
          ).toISOString()
        ),
      ],
    }),

    getAllRows({
      tableId: ORDERS_TABLE_ID,
      queries: [
        Query.greaterThanEqual(
          "$createdAt",
          monthStart.toISOString()
        ),
        Query.lessThanEqual(
          "$createdAt",
          now.toISOString()
        ),
      ],
    }),

    getAllRows({
      tableId: ORDERS_TABLE_ID,
      queries: [
        Query.greaterThanEqual(
          "$createdAt",
          previousMonthStart.toISOString()
        ),
        Query.lessThanEqual(
          "$createdAt",
          previousMonthEnd.toISOString()
        ),
      ],
    }),

    tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: PRODUCTS_TABLE_ID,
      queries: [
        Query.equal("isActive", true),
        Query.limit(1),
      ],
    }),
  ]);

  const totalSales = calculateRevenue(revenueOrders);

  const todayRevenue = calculateRevenue(
    todayOrders
  );

  const yesterdayRevenue = calculateRevenue(
    yesterdayOrders
  );

  const monthRevenue = calculateRevenue(
    monthOrders
  );

  const previousMonthRevenue = calculateRevenue(
    previousMonthOrders
  );

  return {
    totalSales,
    todaySales: todayRevenue,
    orders: monthOrders.length,
    activeProducts: activeProductsResponse.total,

    monthRevenue,
    previousMonthRevenue,

    todayRevenueChange:
      calculatePercentageChange(
        todayRevenue,
        yesterdayRevenue
      ),

    monthRevenueChange:
      calculatePercentageChange(
        monthRevenue,
        previousMonthRevenue
      ),
  };
}

/*
|--------------------------------------------------------------------------
| Percentage change
|--------------------------------------------------------------------------
*/

function calculatePercentageChange(
  current,
  previous
) {
  if (previous === 0) {
    if (current === 0) {
      return 0;
    }

    return 100;
  }

  return (
    ((current - previous) / previous) *
    100
  );
}

/*
|--------------------------------------------------------------------------
| Sales overview
|--------------------------------------------------------------------------
*/

export async function getSalesOverview(
  range = 7
) {
  const safeRange = [7, 30, 90].includes(
    Number(range)
  )
    ? Number(range)
    : 7;

  const now = new Date();

  const startDate = startOfDay(
    new Date(
      now.getTime() -
        (safeRange - 1) *
          24 *
          60 *
          60 *
          1000
    )
  );

  const orders = await getAllRows({
    tableId: ORDERS_TABLE_ID,
    queries: [
      Query.equal(
        "order_Status",
        REVENUE_ORDER_STATUS
      ),
      Query.equal(
        "payment_Status",
        REVENUE_PAYMENT_STATUS
      ),
      Query.greaterThanEqual(
        "$createdAt",
        startDate.toISOString()
      ),
      Query.lessThanEqual(
        "$createdAt",
        now.toISOString()
      ),
    ],
  });

  const salesByDate = new Map();

  for (let index = 0; index < safeRange; index += 1) {
    const date = new Date(
      startDate.getTime() +
        index *
          24 *
          60 *
          60 *
          1000
    );

    salesByDate.set(
      formatDateKey(date),
      {
        date: formatDateKey(date),
        label: formatDayLabel(
          date,
          safeRange
        ),
        value: 0,
      }
    );
  }

  for (const order of orders) {
    const createdAt = new Date(
      order.$createdAt
    );

    const key = formatDateKey(
      createdAt
    );

    const entry =
      salesByDate.get(key);

    if (entry) {
      entry.value += Number(
        order.total || 0
      );
    }
  }

  const sales = Array.from(
    salesByDate.values()
  );

  const revenue = sales.reduce(
    (total, item) =>
      total + item.value,
    0
  );

  return {
    range: safeRange,
    revenue,
    sales,
  };
}

/*
|--------------------------------------------------------------------------
| Best selling products
|--------------------------------------------------------------------------
*/

export async function getBestSellingProducts(
  limit = 5
) {
  const revenueOrders = await getAllRows({
    tableId: ORDERS_TABLE_ID,
    queries: [
      Query.equal(
        "order_Status",
        REVENUE_ORDER_STATUS
      ),
      Query.equal(
        "payment_Status",
        REVENUE_PAYMENT_STATUS
      ),
    ],
  });

  if (revenueOrders.length === 0) {
    return [];
  }

  const revenueOrderIds = new Set(
    revenueOrders.map(
      (order) => order.$id
    )
  );

  const orderItems = await getAllRows({
    tableId: ORDER_ITEMS_TABLE_ID,
  });

  const productMap = new Map();

  for (const item of orderItems) {
    if (
      !revenueOrderIds.has(
        item.order_ID
      )
    ) {
      continue;
    }

    const productId =
      item.product_ID;

    if (!productId) {
      continue;
    }

    const existing =
      productMap.get(productId) || {
        productId,
        name:
          item.product_Name ||
          "Unknown product",
        sku:
          item.product_SKU ||
          "",
        sold: 0,
        revenue: 0,
      };

    existing.sold += Number(
      item.quantity || 0
    );

    existing.revenue += Number(
      item.line_Total || 0
    );

    productMap.set(
      productId,
      existing
    );
  }

  return Array.from(
    productMap.values()
  )
    .sort(
      (a, b) =>
        b.sold - a.sold
    )
    .slice(0, limit)
    .map((product, index) => ({
      ...product,
      rank: index + 1,
    }));
}

/*
|--------------------------------------------------------------------------
| Recent orders
|--------------------------------------------------------------------------
*/

export async function getRecentOrders(
  limit = 5
) {
  const response =
    await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: ORDERS_TABLE_ID,
      queries: [
        Query.orderDesc(
          "$createdAt"
        ),
        Query.limit(limit),
      ],
    });

  return response.rows;
}

/*
|--------------------------------------------------------------------------
| Low stock products
|--------------------------------------------------------------------------
*/

export async function getLowStockProducts(
  limit = 5
) {
  const response =
    await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: PRODUCTS_TABLE_ID,
      queries: [
        Query.equal(
          "isActive",
          true
        ),
        Query.lessThanEqual(
          "stockQuantity",
          LOW_STOCK_THRESHOLD
        ),
        Query.orderAsc(
          "stockQuantity"
        ),
        Query.limit(limit),
      ],
    });

  return response.rows;
}
/*
|--------------------------------------------------------------------------
| Order status overview
|--------------------------------------------------------------------------
*/

export async function getOrderStatusOverview() {
  const orders = await getAllRows({
    tableId: ORDERS_TABLE_ID,
  });

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

    if (
      Object.prototype.hasOwnProperty.call(
        statusCounts,
        status
      )
    ) {
      statusCounts[status] += 1;
    }
  }

  return [
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
  ];
}