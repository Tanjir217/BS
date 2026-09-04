import { Query } from "appwrite";
import { tablesDB } from "../utils/appwrite";
import { getProductBySlug } from "./productServices";
import { getProductById } from "./productServices";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

const HOME_SECTIONS_TABLE_ID =
  import.meta.env.VITE_APPWRITE_HOME_SECTIONS_TABLE_ID;

const HOME_SECTIONS_PRODUCTS_TABLE_ID =
  import.meta.env.VITE_APPWRITE_HOME_SECTIONS_PRODUCTS_TABLE_ID;


export async function getNewCollection() {
  // 1. Get the new_collection section
  const sectionResponse = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: HOME_SECTIONS_TABLE_ID,
    queries: [
      Query.equal("section_key", "new_collection"),
      Query.equal("is_Active", true),
      Query.limit(1),
    ],
  });

  const section = sectionResponse.rows[0];

  if (!section) {
    return null;
  }


  // 2. Get products belonging to this section
  const productsResponse = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: HOME_SECTIONS_PRODUCTS_TABLE_ID,
    queries: [
      Query.equal("section_ID", section.$id),
      Query.equal("is_Active", true),
      Query.orderAsc("sort_Order"),
    ],
  });


  // 3. Get the actual product data
  const products = await Promise.all(
    productsResponse.rows.map(async (sectionProduct) => {
        const product = await getProductById(sectionProduct.product_ID);

      if (!product) {
        return null;
      }

      return {
        ...product,
        scene: sectionProduct.scene,
      };
    })
  );


  return {
    ...section,
    products: products.filter(Boolean),
  };
}