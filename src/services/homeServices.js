import { Query } from "appwrite";
import { tablesDB } from "../utils/appwrite";
import { getProductById } from "./productServices";
import { getProductImages } from "./productImageServices";

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

  // 3. Get product data + images
  const products = await Promise.all(
    productsResponse.rows.map(async (sectionProduct) => {
      const product = await getProductById(sectionProduct.product_ID);

      if (!product) {
        console.log(
            "PRODUCT NOT FOUND OR INACTIVE:",
            sectionProduct.product_ID
          );
        return null;
      }

      const images = await getProductImages(product.$id);

      const primaryImage =
        images.find((image) => image.isPrimary) ?? images[0];

      if (!primaryImage) {
        return null;
      }

      return {
        id: product.$id,
        name: product.name,
        price: product.price,
        currency: product.currency,
        href: `/products/${product.slug}`,
        image: primaryImage.url,
        scene: sectionProduct.scene,
      };
    })
  );

  return {
    ...section,
    products: products.filter(Boolean),
  };
}