import { ID, Query } from "appwrite";
import { tablesDB } from "../utils/appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const CATEGORIES_TABLE_ID =
  "categories";

function normalizeSlug(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeParentCategoryId(value) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function normalizeCategoryData(categoryData = {}) {
  const slug = normalizeSlug(categoryData.slug);

  if (!slug) {
    throw new Error("Category slug is required.");
  }

  if (slug === "all-products") {
    throw new Error("The slug \"all-products\" is reserved for the catalog route.");
  }

  return {
    name: String(categoryData.name ?? "").trim(),
    slug,
    description: String(categoryData.description ?? "").trim(),
    imageUrl: String(categoryData.imageUrl ?? "").trim(),
    parentCategoryID: normalizeParentCategoryId(
      categoryData.parentCategoryID,
    ),
    isActive: categoryData.isActive ?? true,
  };
}

/*
|--------------------------------------------------------------------------
| Get all active categories
|--------------------------------------------------------------------------
*/

export async function getCategories() {
  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: CATEGORIES_TABLE_ID,
    queries: [
      Query.equal("isActive", true),
      Query.orderAsc("name"),
    ],
  });

  return response.rows;
}

/*
|--------------------------------------------------------------------------
| Get all categories for admin
|--------------------------------------------------------------------------
*/

export async function getCategoriesForAdmin() {
  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: CATEGORIES_TABLE_ID,
    queries: [
      Query.orderAsc("name"),
    ],
  });

  return response.rows;
}

/*
|--------------------------------------------------------------------------
| Get category by ID
|--------------------------------------------------------------------------
*/

export async function getCategoryById(categoryId) {
  if (!categoryId) {
    return null;
  }

  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: CATEGORIES_TABLE_ID,
    queries: [
      Query.equal("$id", categoryId),
      Query.limit(1),
    ],
  });

  return response.rows[0] ?? null;
}

/*
|--------------------------------------------------------------------------
| Get category by slug
|--------------------------------------------------------------------------
*/

export async function getCategoryBySlug(slug) {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    return null;
  }

  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: CATEGORIES_TABLE_ID,
    queries: [
      Query.equal("slug", normalizedSlug),
      Query.equal("isActive", true),
      Query.limit(1),
    ],
  });

  return response.rows[0] ?? null;
}

/*
|--------------------------------------------------------------------------
| Create category
|--------------------------------------------------------------------------
*/

export async function createCategory(categoryData) {
  try {
    const response = await tablesDB.createRow({
      databaseId: DATABASE_ID,
      tableId: CATEGORIES_TABLE_ID,
      rowId: ID.unique(),
      data: normalizeCategoryData(categoryData),
    });

    return response;
  } catch (error) {
    if (
      error?.code === "23505" &&
      (
        error?.message?.includes("categories_parent_slug_unique_idx") ||
        error?.message?.includes("categories_slug_key")
      )
    ) {
      throw new Error(
        "A category with this slug already exists under the selected parent. Apply the latest Supabase migration if you still see a global slug error.",
        { cause: error },
      );
    }
    throw error;
  }
}

/*
|--------------------------------------------------------------------------
| Update category
|--------------------------------------------------------------------------
*/

export async function updateCategory(categoryId, categoryData) {
  if (!categoryId) {
    throw new Error("Category ID is required.");
  }

  if (
    categoryData.parentCategoryID &&
    categoryData.parentCategoryID === categoryId
  ) {
    throw new Error("A category cannot be its own parent.");
  }

  try {
    const response = await tablesDB.updateRow({
      databaseId: DATABASE_ID,
      tableId: CATEGORIES_TABLE_ID,
      rowId: categoryId,
      data: normalizeCategoryData(categoryData),
    });

    return response;
  } catch (error) {
    if (
      error?.code === "23505" &&
      (
        error?.message?.includes("categories_parent_slug_unique_idx") ||
        error?.message?.includes("categories_slug_key")
      )
    ) {
      throw new Error(
        "A category with this slug already exists under the selected parent. Apply the latest Supabase migration if you still see a global slug error.",
      );
    }
    throw error;
  }
}

/*
|--------------------------------------------------------------------------
| Delete category
|--------------------------------------------------------------------------
*/

export async function deleteCategory(categoryId) {
  if (!categoryId) {
    throw new Error("Category ID is required.");
  }

  await tablesDB.deleteRow({
    databaseId: DATABASE_ID,
    tableId: CATEGORIES_TABLE_ID,
    rowId: categoryId,
  });

  return true;
}
