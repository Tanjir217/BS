import { Query } from "appwrite";
import { tablesDB } from "../utils/appwrite";

const DATABASE_ID =
  import.meta.env.VITE_APPWRITE_DATABASE_ID;

const ORDERS_TABLE_ID =
  import.meta.env.VITE_APPWRITE_ORDERS_TABLE_ID;

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

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDayLabel(date, range) {
  if (range <= 7) {
    return date.toLocaleDateString(
      "en-US",
      {
        weekday: "short",
      }
    );
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
    }
  );
}

async function getAllRows({
  tableId,
  queries = [],
  pageSize = 100,
}) {
  const rows = [];

  let offset = 0;

  while (true) {
    const response =
      await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId,
        queries: [
          ...queries,
          Query.limit(pageSize),
          Query.offset(offset),
        ],
      });

    rows.push(...response.rows);

    if (
      rows.length >= response.total
    ) {
      break;
    }

    if (
      response.rows.length === 0
    ) {
      break;
    }

    offset += response.rows.length;
  }

  return rows;
}

function isRevenueOrder(order) {
  return (
    order?.order_Status ===
      REVENUE_ORDER_STATUS &&
    order?.payment_Status ===
      REVENUE_PAYMENT_STATUS
  );
}

function calculateRevenue(orders) {
  return orders
    .filter(isRevenueOrder)
    .reduce(
      (total, order) =>
        total +
        Number(order.total || 0),
      0
    );
}

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
    ((current - previous) /
      previous) *
    100
  );
}

/*
|--------------------------------------------------------------------------
| Analytics Overview
|--------------------------------------------------------------------------
*/

export async function getAnalyticsOverview(
  range = 30
) {
  const safeRange = [
    7,
    30,
    90,
  ].includes(Number(range))
    ? Number(range)
    : 30;

  const now = new Date();

  const currentStart =
    startOfDay(
      new Date(
        now.getTime() -
          (safeRange - 1) *
            24 *
            60 *
            60 *
            1000
      )
    );

  const previousStart =
    startOfDay(
      new Date(
        currentStart.getTime() -
          safeRange *
            24 *
            60 *
            60 *
            1000
      )
    );

  const previousEnd =
    new Date(
      currentStart.getTime() - 1
    );

  const [
    currentOrders,
    previousOrders,
  ] = await Promise.all([
    getAllRows({
      tableId: ORDERS_TABLE_ID,
      queries: [
        Query.greaterThanEqual(
          "$createdAt",
          currentStart.toISOString()
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
          previousStart.toISOString()
        ),
        Query.lessThanEqual(
          "$createdAt",
          previousEnd.toISOString()
        ),
      ],
    }),
  ]);

  const revenueOrders =
    currentOrders.filter(
      isRevenueOrder
    );

  const previousRevenueOrders =
    previousOrders.filter(
      isRevenueOrder
    );

  const revenue =
    calculateRevenue(
      currentOrders
    );

  const previousRevenue =
    calculateRevenue(
      previousOrders
    );

  const orders =
    currentOrders.length;

  const previousOrderCount =
    previousOrders.length;

  const averageOrderValue =
    revenueOrders.length > 0
      ? revenue /
        revenueOrders.length
      : 0;

  const previousAverageOrderValue =
    previousRevenueOrders.length > 0
      ? previousRevenue /
        previousRevenueOrders.length
      : 0;

  /*
  |--------------------------------------------------------------------------
  | Revenue trend
  |--------------------------------------------------------------------------
  */

  const revenueByDate =
    new Map();

  for (
    let index = 0;
    index < safeRange;
    index += 1
  ) {
    const date = new Date(
      currentStart.getTime() +
        index *
          24 *
          60 *
          60 *
          1000
    );

    revenueByDate.set(
      formatDateKey(date),
      {
        date:
          formatDateKey(date),

        label:
          formatDayLabel(
            date,
            safeRange
          ),

        value: 0,
      }
    );
  }

  for (
    const order of revenueOrders
  ) {
    const createdAt =
      new Date(
        order.$createdAt
      );

    const key =
      formatDateKey(
        createdAt
      );

    const entry =
      revenueByDate.get(
        key
      );

    if (entry) {
      entry.value += Number(
        order.total || 0
      );
    }
  }

  return {
    range: safeRange,

    metrics: {
      revenue,

      revenueChange:
        calculatePercentageChange(
          revenue,
          previousRevenue
        ),

      orders,

      ordersChange:
        calculatePercentageChange(
          orders,
          previousOrderCount
        ),

      averageOrderValue,

      averageOrderValueChange:
        calculatePercentageChange(
          averageOrderValue,
          previousAverageOrderValue
        ),
    },

    revenueTrend:
      Array.from(
        revenueByDate.values()
      ),
  };
}