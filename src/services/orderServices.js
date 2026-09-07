import { ID, Query } from "appwrite";
import { tablesDB } from "../utils/appwrite";
import { getProductByIdAdmin } from "./productServices";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

const ORDERS_TABLE_ID = import.meta.env.VITE_APPWRITE_ORDERS_TABLE_ID;

const ORDER_ITEMS_TABLE_ID = import.meta.env.VITE_APPWRITE_ORDER_ITEMS_TABLE_ID;

/*
|--------------------------------------------------------------------------
| Order status values
|--------------------------------------------------------------------------
*/

export const ORDER_STATUSES = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

/*
|--------------------------------------------------------------------------
| Payment status values
|--------------------------------------------------------------------------
*/

export const PAYMENT_STATUSES = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
};

/*
|--------------------------------------------------------------------------
| Payment methods
|--------------------------------------------------------------------------
*/

export const PAYMENT_METHODS = {
  COD: "cod",
  ONLINE: "online",
};

/*
|--------------------------------------------------------------------------
| Create order number
|--------------------------------------------------------------------------
*/

function generateOrderNumber() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const random = Math.floor(1000 + Math.random() * 9000);

  return `BS-${year}${month}${day}-${random}`;
}

/*
|--------------------------------------------------------------------------
| Create order
|--------------------------------------------------------------------------
*/

export async function createOrder({
  customer_ID = "",
  customer_Name,
  customer_Email = "",
  customer_Phone,
  shipping_Address,
  shipping_City,
  shipping_Postal_Code = "",
  shipping_Cost = 0,
  discount = 0,
  payment_Method = PAYMENT_METHODS.COD,
  notes = "",
  items = [],
}) {
  if (!customer_Name) {
    throw new Error("Customer name is required.");
  }

  if (!customer_Phone) {
    throw new Error("Customer phone is required.");
  }

  if (!shipping_Address) {
    throw new Error("Shipping address is required.");
  }

  if (!shipping_City) {
    throw new Error("Shipping city is required.");
  }

  if (!items.length) {
    throw new Error("At least one order item is required.");
  }

  /*
  |--------------------------------------------------------------------------
  | Get product information
  |--------------------------------------------------------------------------
  */

  const orderItems = await Promise.all(
    items.map(async (item) => {
      if (!item.productId) {
        throw new Error("Product ID is required.");
      }

      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error(`Invalid quantity for product ${item.productId}.`);
      }

      const product = await getProductByIdAdmin(item.productId);

      if (!product) {
        throw new Error(`Product ${item.productId} could not be found.`);
      }

      const unitPrice = Number(product.price);

      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new Error(`Invalid price for product ${item.productId}.`);
      }

      const lineTotal = unitPrice * quantity;

      return {
        product_ID: product.$id,
        product_Name: product.name,
        product_SKU: product.sku || "",
        product_Color: product.color || "",
        unit_Price: unitPrice,
        quantity,
        line_Total: lineTotal,
      };
    }),
  );

  /*
  |--------------------------------------------------------------------------
  | Calculate totals
  |--------------------------------------------------------------------------
  */

  const subtotal = orderItems.reduce((sum, item) => sum + item.line_Total, 0);

  const shippingCostNumber = Number(shipping_Cost);
  const discountNumber = Number(discount);

  if (!Number.isFinite(shippingCostNumber) || shippingCostNumber < 0) {
    throw new Error("Invalid shipping cost.");
  }

  if (!Number.isFinite(discountNumber) || discountNumber < 0) {
    throw new Error("Invalid discount.");
  }

  if (discountNumber > subtotal + shippingCostNumber) {
    throw new Error("Discount cannot be greater than the order amount.");
  }

  const total = subtotal + shippingCostNumber - discountNumber;

  /*
  |--------------------------------------------------------------------------
  | Create order
  |--------------------------------------------------------------------------
  */

  const order = await tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: ORDERS_TABLE_ID,
    rowId: ID.unique(),
    data: {
      order_Number: generateOrderNumber(),

      customer_ID,
      customer_Name,
      customer_Email,
      customer_Phone,

      shipping_Address,
      shipping_City,
      shipping_Postal_Code,

      subtotal,
      shipping_Cost: shippingCostNumber,
      discount: discountNumber,
      total,

      payment_Method,
      payment_Status: PAYMENT_STATUSES.PENDING,
      order_Status: ORDER_STATUSES.PENDING,

      notes,
    },
  });

  /*
  |--------------------------------------------------------------------------
  | Create order items
  |--------------------------------------------------------------------------
  */

  try {
    const createdItems = [];

    try {
      for (const item of orderItems) {
        const createdItem = await tablesDB.createRow({
          databaseId: DATABASE_ID,
          tableId: ORDER_ITEMS_TABLE_ID,
          rowId: ID.unique(),
          data: {
            order_ID: order.$id,
            product_ID: item.product_ID,
            product_Name: item.product_Name,
            product_SKU: item.product_SKU,
            product_Color: item.product_Color,
            unit_Price: item.unit_Price,
            quantity: item.quantity,
            line_Total: item.line_Total,
          },
        });

        createdItems.push(createdItem);
      }

      return {
        order,
        items: createdItems,
      };
    } catch (error) {
      // Delete any order items that were successfully created
      await Promise.all(
        createdItems.map((item) =>
          tablesDB.deleteRow({
            databaseId: DATABASE_ID,
            tableId: ORDER_ITEMS_TABLE_ID,
            rowId: item.$id,
          }),
        ),
      );

      // Then delete the order
      try {
        await tablesDB.deleteRow({
          databaseId: DATABASE_ID,
          tableId: ORDERS_TABLE_ID,
          rowId: order.$id,
        });
      } catch (rollbackError) {
        console.error("Failed to roll back order:", rollbackError);
      }

      throw error;
    }
  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | Roll back order if item creation fails
    |--------------------------------------------------------------------------
    */

    try {
      await tablesDB.deleteRow({
        databaseId: DATABASE_ID,
        tableId: ORDERS_TABLE_ID,
        rowId: order.$id,
      });
    } catch (rollbackError) {
      console.error("Failed to roll back order:", rollbackError);
    }

    throw error;
  }
}

/*
|--------------------------------------------------------------------------
| Get all orders
|--------------------------------------------------------------------------
*/

export async function getOrders({ page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;

  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: ORDERS_TABLE_ID,
    queries: [
      Query.orderDesc("$createdAt"),
      Query.limit(limit),
      Query.offset(offset),
    ],
  });

  return {
    orders: response.rows,
    total: response.total,
    page,
    limit,
    totalPages: Math.ceil(response.total / limit),
  };
}

/*
|--------------------------------------------------------------------------
| Get order by ID
|--------------------------------------------------------------------------
*/

export async function getOrderById(orderId) {
  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: ORDERS_TABLE_ID,
    queries: [Query.equal("$id", orderId), Query.limit(1)],
  });

  return response.rows[0] ?? null;
}

/*
|--------------------------------------------------------------------------
| Get order items
|--------------------------------------------------------------------------
*/

export async function getOrderItems(orderId) {
  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: ORDER_ITEMS_TABLE_ID,
    queries: [Query.equal("order_ID", orderId), Query.orderAsc("$createdAt")],
  });

  return response.rows;
}

/*
|--------------------------------------------------------------------------
| Get order with items
|--------------------------------------------------------------------------
*/

export async function getOrderWithItems(orderId) {
  const order = await getOrderById(orderId);

  if (!order) {
    return null;
  }

  const items = await getOrderItems(orderId);

  return {
    order,
    items,
  };
}

/*
|--------------------------------------------------------------------------
| Update order status
|--------------------------------------------------------------------------
*/

export async function updateOrderStatus(orderId, orderStatus) {
  const validStatuses = Object.values(ORDER_STATUSES);

  if (!validStatuses.includes(orderStatus)) {
    throw new Error(`Invalid order status: ${orderStatus}`);
  }

  const response = await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: ORDERS_TABLE_ID,
    rowId: orderId,
    data: {
      order_Status: orderStatus,
    },
  });

  return response;
}

/*
|--------------------------------------------------------------------------
| Update payment status
|--------------------------------------------------------------------------
*/

export async function updatePaymentStatus(orderId, paymentStatus) {
  const validStatuses = Object.values(PAYMENT_STATUSES);

  if (!validStatuses.includes(paymentStatus)) {
    throw new Error(`Invalid payment status: ${paymentStatus}`);
  }

  const response = await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: ORDERS_TABLE_ID,
    rowId: orderId,
    data: {
      payment_Status: paymentStatus,
    },
  });

  return response;
}

/*
|--------------------------------------------------------------------------
| Update order
|--------------------------------------------------------------------------
*/

// export async function updateOrder(orderId, data) {
//   const response = await tablesDB.updateRow({
//     databaseId: DATABASE_ID,
//     tableId: ORDERS_TABLE_ID,
//     rowId: orderId,
//     data,
//   });

//   return response;
// }

/*
|--------------------------------------------------------------------------
| Delete order
|--------------------------------------------------------------------------
*/

export async function deleteOrder(orderId) {
  const items = await getOrderItems(orderId);

  /*
  |--------------------------------------------------------------------------
  | Delete all order items first
  |--------------------------------------------------------------------------
  */

  await Promise.all(
    items.map((item) =>
      tablesDB.deleteRow({
        databaseId: DATABASE_ID,
        tableId: ORDER_ITEMS_TABLE_ID,
        rowId: item.$id,
      }),
    ),
  );

  /*
  |--------------------------------------------------------------------------
  | Delete the order
  |--------------------------------------------------------------------------
  */

  await tablesDB.deleteRow({
    databaseId: DATABASE_ID,
    tableId: ORDERS_TABLE_ID,
    rowId: orderId,
  });

  return true;
}
