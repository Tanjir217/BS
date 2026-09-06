import { ID, Query } from "appwrite";
import { tablesDB } from "../utils/appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const CATEGORIES_TABLE_ID =
  import.meta.env.VITE_APPWRITE_CATEGORIES_TABLE_ID;

// Get all active categories
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

// Get all categories for admin
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

// Get one category by ID
export async function getCategoryById(categoryId) {
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

// Create category
export async function createCategory(categoryData) {
  const response = await tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: CATEGORIES_TABLE_ID,
    rowId: ID.unique(),
    data: {
      name: categoryData.name,
      slug: categoryData.slug,
      description: categoryData.description || "",
      imageUrl: categoryData.imageUrl || "",
      isActive: categoryData.isActive ?? true,
    },
  });

  return response;
}

// Update category
export async function updateCategory(categoryId, categoryData) {
  const response = await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: CATEGORIES_TABLE_ID,
    rowId: categoryId,
    data: {
      name: categoryData.name,
      slug: categoryData.slug,
      description: categoryData.description || "",
      imageUrl: categoryData.imageUrl || "",
      isActive: categoryData.isActive ?? true,
    },
  });

  return response;
}

// Delete category
export async function deleteCategory(categoryId) {
  await tablesDB.deleteRow({
    databaseId: DATABASE_ID,
    tableId: CATEGORIES_TABLE_ID,
    rowId: categoryId,
  });

  return true;
}