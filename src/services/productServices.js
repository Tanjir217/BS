import { Query } from "appwrite";
import { tablesDB } from "../utils/appwrite";
import {getProductImages} from "./productImageServices";

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