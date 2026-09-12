import { ID, Query } from "appwrite";
import { tablesDB } from "../utils/appwrite";
import {
  deleteProductImages,
  getPrimaryProductImage,
  getProductImages,
  getPrimaryProductImages,
} from "./productImageServices";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const PRODUCTS_TABLE_ID = import.meta.env.VITE_APPWRITE_PRODUCTS_TABLE_ID;

export async function getProducts() {
  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: PRODUCTS_TABLE_ID,
    queries: [Query.equal("isActive", true)],
  });

  return response.rows;
}

export async function getProductBySlug(slug) {
  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: PRODUCTS_TABLE_ID,
    queries: [
      Query.equal("slug", slug),
      Query.equal("isActive", true),
      Query.limit(1),
    ],
  });

  const product = response.rows[0] ?? null;

  if (!product) {
    return null;
  }

  const images = await getProductImages(product.$id);

  return {
    ...product,
    images,
  };
}
export async function getProductById(productId) {
  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: PRODUCTS_TABLE_ID,
    queries: [
      Query.equal("$id", productId),
      Query.equal("isActive", true),
      Query.limit(1),
    ],
  });

  return response.rows[0] ?? null;
}
// Get all products for admin
export async function getProductsForAdmin({ page = 1, limit = 10 } = {}) {
  const offset = (page - 1) * limit;

  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: PRODUCTS_TABLE_ID,
    queries: [
      Query.orderDesc("$createdAt"),
      Query.limit(limit),
      Query.offset(offset),
    ],
  });

  const productsWithImages = await Promise.all(
    response.rows.map(async (product) => {
      const primaryImage = await getPrimaryProductImage(product.$id);

      return {
        ...product,
        primaryImage,
      };
    }),
  );

  return {
    products: productsWithImages,
    total: response.total,
    page,
    limit,
    totalPages: Math.ceil(response.total / limit),
  };
}

// Get a product by ID for admin
// Unlike the storefront version, this can return inactive products.
export async function getProductByIdAdmin(productId) {
  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: PRODUCTS_TABLE_ID,
    queries: [Query.equal("$id", productId), Query.limit(1)],
  });

  return response.rows[0] ?? null;
}

// Create a new product
export async function createProduct(productData) {
  const data = {
    name: productData.name,
    slug: productData.slug,
    sku: productData.sku,
    description: productData.description || "",
    price: Number(productData.price),
    categoryID: productData.categoryID || "",
    color: productData.color || "",
    colorHEX: productData.colorHEX || "",
    stockQuantity: Number(productData.stockQuantity),
    isFeatured: Boolean(productData.isFeatured),
    isActive: Boolean(productData.isActive),
  };

  // Only send compareAtPrice when a value exists.
  if (
    productData.compareAtPrice !== "" &&
    productData.compareAtPrice !== null &&
    productData.compareAtPrice !== undefined
  ) {
    data.compareAtPrice = Number(productData.compareAtPrice);
  }

  const response = await tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: PRODUCTS_TABLE_ID,
    rowId: ID.unique(),
    data,
  });

  return response;
}

// Update an existing product
export async function updateProduct(productId, productData) {
  const data = {
    name: productData.name,
    slug: productData.slug,
    sku: productData.sku,
    description: productData.description || "",
    price: Number(productData.price),
    categoryID: productData.categoryID || "",
    color: productData.color || "",
    colorHEX: productData.colorHEX || "",
    stockQuantity: Number(productData.stockQuantity),
    isFeatured: Boolean(productData.isFeatured),
    isActive: Boolean(productData.isActive),
  };

  data.compareAtPrice =
    productData.compareAtPrice === "" ||
    productData.compareAtPrice === null ||
    productData.compareAtPrice === undefined
      ? null
      : Number(productData.compareAtPrice);

  const response = await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: PRODUCTS_TABLE_ID,
    rowId: productId,
    data,
  });

  return response;
}

// Update only the active/inactive status
export async function updateProductStatus(productId, isActive) {
  const response = await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: PRODUCTS_TABLE_ID,
    rowId: productId,
    data: {
      isActive: Boolean(isActive),
    },
  });

  return response;
}
// Delete a product
export async function deleteProduct(productId) {
  await deleteProductImages(productId);

  await tablesDB.deleteRow({
    databaseId: DATABASE_ID,
    tableId: PRODUCTS_TABLE_ID,
    rowId: productId,
  });

  return true;
}
/*
|--------------------------------------------------------------------------
| Get active products for a category and all descendants
|--------------------------------------------------------------------------
*/

export async function getProductsByCategoryIds(
  categoryIds,
  { page = 1, limit = 24, sort = "newest", filters = {} } = {},
) {
  if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
    return {
      products: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }

  const offset = (page - 1) * limit;

  const { minPrice, maxPrice, color, availability } = filters;

  let sortQuery;

  switch (sort) {
    case "price-asc":
      sortQuery = Query.orderAsc("price");
      break;

    case "price-desc":
      sortQuery = Query.orderDesc("price");
      break;

    case "featured":
      sortQuery = Query.orderDesc("isFeatured");
      break;

    case "newest":
    default:
      sortQuery = Query.orderDesc("$createdAt");
      break;
  }

  const queries = [
    Query.equal("categoryID", categoryIds),

    Query.equal("isActive", true),
  ];

  /*
   * Price filtering
   */
  if (minPrice !== undefined && minPrice !== null && minPrice !== "") {
    queries.push(Query.greaterThanEqual("price", Number(minPrice)));
  }

  if (maxPrice !== undefined && maxPrice !== null && maxPrice !== "") {
    queries.push(Query.lessThanEqual("price", Number(maxPrice)));
  }

  /*
   * Color filtering
   */
  if (typeof color === "string" && color.trim() !== "") {
    queries.push(Query.equal("color", color.trim()));
  }

  /*
   * Availability filtering
   */
  if (availability === "in-stock") {
    queries.push(Query.greaterThan("stockQuantity", 0));
  }

  /*
   * Sorting + pagination
   */
  queries.push(sortQuery);

  queries.push(Query.limit(limit));

  queries.push(Query.offset(offset));

  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: PRODUCTS_TABLE_ID,
    queries,
  });

  const productIds = response.rows.map((product) => product.$id);

  const primaryImages = await getPrimaryProductImages(productIds);

  const productsWithImages = response.rows.map((product) => ({
    ...product,
    primaryImage: primaryImages[product.$id] ?? null,
  }));

  return {
    products: productsWithImages,
    total: response.total,
    page,
    limit,
    totalPages: Math.ceil(response.total / limit),
  };
}
