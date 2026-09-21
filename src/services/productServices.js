import { ID, Query } from "appwrite";
import { tablesDB } from "../utils/appwrite";
import { getCategories } from "./categoryServices";
import { getProductUrl } from "../utils/categoryTree";
import {
  deleteProductImages,
  getPrimaryProductImage,
  getProductImages,
  getPrimaryProductImages,
} from "./productImageServices";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const PRODUCTS_TABLE_ID = import.meta.env.VITE_APPWRITE_PRODUCTS_TABLE_ID || "products";

export async function getProducts() {
  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: PRODUCTS_TABLE_ID,
    queries: [Query.equal("isActive", true)],
  });

  const categories = await getCategories();
  return response.rows.map((product) => ({
    ...product,
    href: getProductUrl(product, categories),
  }));
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

  const [images, categories] = await Promise.all([
    getProductImages(product.$id),
    getCategories(),
  ]);

  return {
    ...product,
    images,
    href: getProductUrl(product, categories),
  };
}

export async function getProductByPath(pathSegments = []) {
  const segments = pathSegments.filter(Boolean).map((segment) => segment.trim().toLowerCase());

  if (segments.length === 0) {
    return null;
  }

  const slug = segments[segments.length - 1];
  const product = await getProductBySlug(slug);

  if (!product) {
    return null;
  }

  const expectedPath = product.href
    .replace(/^\/products\//, "")
    .split("/")
    .filter(Boolean);

  // Legacy /products/:slug URLs are accepted and can be redirected
  // to the canonical category-aware URL by the page.
  if (
    segments.length > 1 &&
    (segments.length !== expectedPath.length ||
      segments.some((segment, index) => segment !== expectedPath[index]))
  ) {
    return null;
  }

  return product;
}

export async function getProductById(productId) {
  if (!productId) {
    return null;
  }

  try {
    const product = await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: PRODUCTS_TABLE_ID,
      rowId: productId,
    });

    if (!product?.isActive) {
      return null;
    }

    return product;
  } catch (error) {
    console.error(`Failed to fetch product ${productId}:`, error);
    return null;
  }
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
    categoryID: productData.categoryID || null,
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
    categoryID: productData.categoryID || null,
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
/*
|-------------------------------------------------------------------------- 
| Get the active product price range for a category and all descendants
|-------------------------------------------------------------------------- 
*/

export async function getProductPriceRange(categoryIds) {
  const baseQueries = [Query.equal("isActive", true)];

  if (Array.isArray(categoryIds) && categoryIds.length > 0) {
    baseQueries.unshift(Query.equal("categoryID", categoryIds));
  }

  const [
    minimumResponse,
    maximumResponse,
  ] = await Promise.all([
    tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: PRODUCTS_TABLE_ID,
      queries: [
        ...baseQueries,
        Query.select(["price"]),
        Query.orderAsc("price"),
        Query.limit(1),
      ],
      total: false,
    }),
    tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: PRODUCTS_TABLE_ID,
      queries: [
        ...baseQueries,
        Query.select(["price"]),
        Query.orderDesc("price"),
        Query.limit(1),
      ],
      total: false,
    }),
  ]);

  const minimumPrice = Number(minimumResponse.rows[0]?.price);
  const maximumPrice = Number(maximumResponse.rows[0]?.price);

  if (!Number.isFinite(minimumPrice) || !Number.isFinite(maximumPrice)) {
    return null;
  }

  return {
    min: minimumPrice,
    max: maximumPrice,
  };
}

export async function getProductFilterOptions(categoryIds) {
  const queries = [
    Query.equal("isActive", true),
    Query.select(["color", "colorHEX"]),
    Query.limit(100),
  ];

  if (Array.isArray(categoryIds) && categoryIds.length > 0) {
    queries.unshift(Query.equal("categoryID", categoryIds));
  }

  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: PRODUCTS_TABLE_ID,
    queries,
    total: false,
  });

  const colorMap = new Map();

  for (const product of response.rows) {
    const color =
      typeof product.color === "string" ? product.color.trim() : "";

    if (!color) {
      continue;
    }

    const normalizedColor = color.toLowerCase();

    if (!colorMap.has(normalizedColor)) {
      colorMap.set(normalizedColor, {
        name: color,
        hex:
          typeof product.colorHEX === "string"
            ? product.colorHEX.trim()
            : "",
      });
    }
  }

  return {
    colors: Array.from(colorMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
  };
}

export async function getProductsByCategoryIds(
  categoryIds,
  { page = 1, limit = 24, sort = "newest", filters = {} } = {},
) {
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
    Query.equal("isActive", true),
  ];

  if (Array.isArray(categoryIds) && categoryIds.length > 0) {
    queries.unshift(Query.equal("categoryID", categoryIds));
  }

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

  const categories = await getCategories();

  const productsWithImages = response.rows.map((product) => ({
    ...product,
    href: getProductUrl(product, categories),
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


export async function getProductsByIds(productIds = []) {
  const ids = [...new Set(productIds.filter(Boolean))];

  if (ids.length === 0) {
    return [];
  }

  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: PRODUCTS_TABLE_ID,
    queries: [
      Query.equal("$id", ids),
      Query.equal("isActive", true),
      Query.limit(Math.min(100, ids.length)),
    ],
    total: false,
  });

  const primaryImages = await getPrimaryProductImages(
    response.rows.map((product) => product.$id),
  );

  const categories = await getCategories();

  const products = response.rows.map((product) => ({
    ...product,
    href: getProductUrl(product, categories),
    primaryImage: primaryImages[product.$id] ?? null,
  }));

  const byId = new Map(products.map((product) => [product.$id, product]));

  return ids.map((id) => byId.get(id)).filter(Boolean);
}

export async function searchProducts(searchTerm, { limit = 48 } = {}) {
  const term = String(searchTerm || "").trim();

  if (!term) {
    return [];
  }

  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: PRODUCTS_TABLE_ID,
    queries: [
      Query.equal("isActive", true),
      Query.or([
        Query.contains("name", term),
        Query.contains("slug", term),
        Query.contains("sku", term),
        Query.contains("color", term),
        Query.contains("description", term),
      ]),
      Query.orderDesc("$createdAt"),
      Query.limit(limit),
    ],
    total: false,
  });

  const primaryImages = await getPrimaryProductImages(
    response.rows.map((product) => product.$id),
  );

  const categories = await getCategories();

  return response.rows.map((product) => ({
    ...product,
    href: getProductUrl(product, categories),
    primaryImage: primaryImages[product.$id] ?? null,
  }));
}
