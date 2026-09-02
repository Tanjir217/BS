import { Query } from "appwrite";
import { tablesDB } from "../utils/appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const PRODUCTS_TABLE_ID = import.meta.env.VITE_APPWRITE_PRODUCTS_TABLE_ID;

export async function getProducts() {
  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: PRODUCTS_TABLE_ID,
    queries: [
      Query.equal("isActive", true),
    ],
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

  return response.rows[0] ?? null;
}