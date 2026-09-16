import {
    Client,
    ID,
    Operator,
    Query,
    TablesDB,
  } from "node-appwrite";
  
  const DATABASE_ID =
    process.env.APPWRITE_DATABASE_ID;
  
  const PRODUCTS_TABLE_ID =
    process.env.APPWRITE_PRODUCTS_TABLE_ID;
  
  const ORDERS_TABLE_ID =
    process.env.APPWRITE_ORDERS_TABLE_ID;
  
  const ORDER_ITEMS_TABLE_ID =
    process.env.APPWRITE_ORDER_ITEMS_TABLE_ID;
  
  const PAYMENT_METHODS = {
    COD: "cod",
    ONLINE: "online",
  };
  
  const PAYMENT_STATUSES = {
    PENDING: "pending",
  };
  
  const ORDER_STATUSES = {
    PENDING: "pending",
  };
  
  function getServerTablesDB(req) {
    const client = new Client()
      .setEndpoint(
        process.env.APPWRITE_FUNCTION_API_ENDPOINT,
      )
      .setProject(
        process.env.APPWRITE_FUNCTION_PROJECT_ID,
      )
      .setKey(
        req.headers["x-appwrite-key"],
      );
  
    return new TablesDB(client);
  }
  
  function generateOrderNumber(orderId) {
    const now = new Date();
  
    const year =
      now.getFullYear();
  
    const month = String(
      now.getMonth() + 1,
    ).padStart(2, "0");
  
    const day = String(
      now.getDate(),
    ).padStart(2, "0");
  
    const uniquePart =
      orderId
        .slice(-6)
        .toUpperCase();
  
    return `BS-${year}${month}${day}-${uniquePart}`;
  }
  
  function assertPositiveInteger(
    value,
    fieldName,
  ) {
    const number = Number(value);
  
    if (
      !Number.isSafeInteger(number) ||
      number <= 0
    ) {
      throw new Error(
        `${fieldName} must be a positive integer.`,
      );
    }
  
    return number;
  }
  
  function assertNonNegativeInteger(
    value,
    fieldName,
  ) {
    const number = Number(value);
  
    if (
      !Number.isSafeInteger(number) ||
      number < 0
    ) {
      throw new Error(
        `${fieldName} must be a valid non-negative integer.`,
      );
    }
  
    return number;
  }
  
  export default async ({
    req,
    res,
    log,
    error: logError,
  }) => {
    const userId =
      req.headers[
        "x-appwrite-user-id"
      ];
  
    if (!userId) {
      return res.json(
        {
          error:
            "Customer authentication is required.",
        },
        401,
      );
    }
  
    if (
      req.method !== "POST"
    ) {
      return res.json(
        {
          error:
            "Only POST requests are allowed.",
        },
        405,
      );
    }
  
    let payload;
  
    try {
      payload = JSON.parse(
        req.body || "{}",
      );
    } catch {
      return res.json(
        {
          error:
            "Invalid request body.",
        },
        400,
      );
    }
  
    const {
      customer_Name,
      customer_Email = "",
      customer_Phone,
      shipping_Address,
      shipping_City,
      shipping_Postal_Code = "",
      shipping_Cost = 0,
      discount = 0,
      payment_Method =
        PAYMENT_METHODS.COD,
      notes = "",
      items = [],
    } = payload;
  
    const customerName =
      String(
        customer_Name || "",
      ).trim();
  
    const customerPhone =
      String(
        customer_Phone || "",
      ).trim();
  
    const shippingAddress =
      String(
        shipping_Address || "",
      ).trim();
  
    const shippingCity =
      String(
        shipping_City || "",
      ).trim();
  
    if (!customerName) {
      return res.json(
        {
          error:
            "Customer name is required.",
        },
        400,
      );
    }
  
    if (!customerPhone) {
      return res.json(
        {
          error:
            "Customer phone is required.",
        },
        400,
      );
    }
  
    if (!shippingAddress) {
      return res.json(
        {
          error:
            "Shipping address is required.",
        },
        400,
      );
    }
  
    if (!shippingCity) {
      return res.json(
        {
          error:
            "Shipping city is required.",
        },
        400,
      );
    }
  
    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.json(
        {
          error:
            "At least one order item is required.",
        },
        400,
      );
    }
  
    if (
      !Object.values(
        PAYMENT_METHODS,
      ).includes(payment_Method)
    ) {
      return res.json(
        {
          error:
            "Invalid payment method.",
        },
        400,
      );
    }
  
    try {
      const tablesDB =
        getServerTablesDB(req);
  
      /*
       * ----------------------------------------------------
       * Merge duplicate products
       * ----------------------------------------------------
       */
  
      const itemMap =
        new Map();
  
      for (
        const item of items
      ) {
        if (
          !item?.productId
        ) {
          throw new Error(
            "Product ID is required.",
          );
        }
  
        const quantity =
          assertPositiveInteger(
            item.quantity,
            `Quantity for ${item.productId}`,
          );
  
        const expectedPrice =
          assertNonNegativeInteger(
            item.expectedPrice,
            `Expected price for ${item.productId}`,
          );
  
        const existing =
          itemMap.get(
            item.productId,
          );
  
        if (existing) {
          existing.quantity +=
            quantity;
        } else {
          itemMap.set(
            item.productId,
            {
              quantity,
              expectedPrice,
            },
          );
        }
      }
  
      /*
       * ----------------------------------------------------
       * Read and validate products
       * ----------------------------------------------------
       */
  
      const orderItems =
        [];
  
      for (
        const [
          productId,
          requestedItem,
        ] of itemMap.entries()
      ) {
        const response =
          await tablesDB.listRows({
            databaseId:
              DATABASE_ID,
  
            tableId:
              PRODUCTS_TABLE_ID,
  
            queries: [
              Query.equal(
                "$id",
                productId,
              ),
              Query.limit(1),
            ],
  
            total: false,
          });
  
        const product =
          response.rows[0];
  
        if (!product) {
          throw new Error(
            `Product ${productId} could not be found.`,
          );
        }
  
        if (
          !product.isActive
        ) {
          throw new Error(
            `${product.name} is no longer available.`,
          );
        }
  
        const unitPrice =
          assertNonNegativeInteger(
            product.price,
            `Price for ${product.name}`,
          );
  
        /*
         * IMPORTANT:
         * Validate the price sent by the browser
         * against the current database price.
         */
  
        if (
          requestedItem.expectedPrice !==
          unitPrice
        ) {
          throw new Error(
            `${product.name} price has changed. Please review your bag before placing the order.`,
          );
        }
  
        const stockQuantity =
          assertNonNegativeInteger(
            product.stockQuantity,
            `Stock for ${product.name}`,
          );
  
        if (
          requestedItem.quantity >
          stockQuantity
        ) {
          throw new Error(
            `${product.name} does not have enough stock.`,
          );
        }
  
        const lineTotal =
          unitPrice *
          requestedItem.quantity;
  
        if (
          !Number.isSafeInteger(
            lineTotal,
          )
        ) {
          throw new Error(
            `Line total is too large for ${product.name}.`,
          );
        }
  
        orderItems.push({
          product_ID:
            product.$id,
  
          product_Name:
            product.name,
  
          product_SKU:
            product.sku || "",
  
          product_Color:
            product.color || "",
  
          unit_Price:
            unitPrice,
  
          quantity:
            requestedItem.quantity,
  
          line_Total:
            lineTotal,
        });
      }
  
      /*
       * ----------------------------------------------------
       * Calculate totals
       * ----------------------------------------------------
       */
  
      const subtotal =
        orderItems.reduce(
          (sum, item) =>
            sum +
            item.line_Total,
          0,
        );
  
      const shippingCostNumber =
        assertNonNegativeInteger(
          shipping_Cost,
          "Shipping cost",
        );
  
      const discountNumber =
        assertNonNegativeInteger(
          discount,
          "Discount",
        );
  
      if (
        discountNumber >
        subtotal +
          shippingCostNumber
      ) {
        throw new Error(
          "Discount cannot be greater than the order amount.",
        );
      }
  
      const total =
        subtotal +
        shippingCostNumber -
        discountNumber;
  
      if (
        !Number.isSafeInteger(
          total,
        )
      ) {
        throw new Error(
          "Order total is too large.",
        );
      }
  
      /*
       * ----------------------------------------------------
       * Create transaction
       * ----------------------------------------------------
       */
  
      const transaction =
        await tablesDB.createTransaction();
  
      const transactionId =
        transaction.$id;
  
      const orderId =
        ID.unique();
  
      /*
       * ----------------------------------------------------
       * Inventory + order writes
       *
       * EVERYTHING below is staged.
       * Nothing is committed until the final commit.
       * ----------------------------------------------------
       */
  
      const operations =
        [];
  
      /*
       * Atomic stock decrement
       *
       * min: 0 prevents stock from becoming negative.
       *
       * Because this happens inside the transaction,
       * a conflicting inventory change causes the
       * transaction to fail instead of overselling.
       */
  
      for (
        const item of orderItems
      ) {
        operations.push({
          action:
            "update",
  
          databaseId:
            DATABASE_ID,
  
          tableId:
            PRODUCTS_TABLE_ID,
  
          rowId:
            item.product_ID,
  
          data: {
            stockQuantity:
              Operator.decrement(
                item.quantity,
                0,
              ),
          },
        });
      }
  
      /*
       * Create order
       */
  
      operations.push({
        action:
          "create",
  
        databaseId:
          DATABASE_ID,
  
        tableId:
          ORDERS_TABLE_ID,
  
        rowId:
          orderId,
  
        data: {
          order_Number:
            generateOrderNumber(
              orderId,
            ),
  
          customer_ID:
            userId,
  
          customer_Name:
            customerName,
  
          customer_Email:
            String(
              customer_Email || "",
            ).trim(),
  
          customer_Phone:
            customerPhone,
  
          shipping_Address:
            shippingAddress,
  
          shipping_City:
            shippingCity,
  
          shipping_Postal_Code:
            String(
              shipping_Postal_Code ||
                "",
            ).trim(),
  
          subtotal,
  
          shipping_Cost:
            shippingCostNumber,
  
          discount:
            discountNumber,
  
          total,
  
          payment_Method:
            payment_Method,
  
          payment_Status:
            PAYMENT_STATUSES.PENDING,
  
          order_Status:
            ORDER_STATUSES.PENDING,
  
          notes:
            String(
              notes || "",
            ).trim(),
        },
      });
  
      /*
       * Create order item snapshots
       */
  
      for (
        const item of orderItems
      ) {
        operations.push({
          action:
            "create",
  
          databaseId:
            DATABASE_ID,
  
          tableId:
            ORDER_ITEMS_TABLE_ID,
  
          rowId:
            ID.unique(),
  
          data: {
            order_ID:
              orderId,
  
            product_ID:
              item.product_ID,
  
            product_Name:
              item.product_Name,
  
            product_SKU:
              item.product_SKU,
  
            product_Color:
              item.product_Color,
  
            unit_Price:
              item.unit_Price,
  
            quantity:
              item.quantity,
  
            line_Total:
              item.line_Total,
          },
        });
      }
  
      /*
       * Stage all operations together.
       */
  
      await tablesDB.createOperations({
        transactionId,
  
        operations,
      });
  
      /*
       * ----------------------------------------------------
       * COMMIT
       * ----------------------------------------------------
       *
       * Inventory decrement,
       * order creation,
       * and order-item creation
       * become one atomic operation.
       */
  
      await tablesDB.updateTransaction({
        transactionId,
  
        commit: true,
      });
  
      log(
        `Order ${orderId} created for customer ${userId}`,
      );
  
      return res.json({
        success: true,
  
        order: {
          $id: orderId,
  
          order_Number:
            generateOrderNumber(
              orderId,
            ),
  
          customer_ID:
            userId,
  
          subtotal,
  
          shipping_Cost:
            shippingCostNumber,
  
          discount:
            discountNumber,
  
          total,
  
          payment_Method:
            payment_Method,
  
          payment_Status:
            PAYMENT_STATUSES.PENDING,
  
          order_Status:
            ORDER_STATUSES.PENDING,
        },
      });
    } catch (error) {
      logError(
        `Order creation failed: ${
          error?.message ||
          "Unknown error"
        }`,
      );
  
      return res.json(
        {
          success: false,
  
          error:
            error?.message ||
            "Unable to create order.",
        },
        409,
      );
    }
  };