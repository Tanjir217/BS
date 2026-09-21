import { Query } from "appwrite";

import { tablesDB, storage } from "../utils/appwrite";
import { getProductById } from "./productServices";
import { getProductImages } from "./productImageServices";
import { getCategories } from "./categoryServices";
import { getProductUrl } from "../utils/categoryTree";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const HOME_SECTIONS_TABLE_ID =
  import.meta.env.VITE_APPWRITE_HOME_SECTIONS_TABLE_ID || "home_sections";
const HOME_SECTIONS_PRODUCTS_TABLE_ID =
  import.meta.env.VITE_APPWRITE_HOME_SECTIONS_PRODUCTS_TABLE_ID ||
  "home_sections_products";
const STORAGE_BUCKET_ID =
  import.meta.env.VITE_SUPABASE_STOREFRONT_BUCKET || "storefront-media";

async function getSectionProducts(sectionId) {
  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: HOME_SECTIONS_PRODUCTS_TABLE_ID,
    queries: [
      Query.equal("section_ID", sectionId),
      Query.equal("isActive", true),
      Query.orderAsc("sortOrder"),
    ],
    total: false,
  });

  return response.rows;
}

export async function getNewCollection() {
  const sectionResponse = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: HOME_SECTIONS_TABLE_ID,
    queries: [
      Query.equal("section_key", "new_collection"),
      Query.equal("isActive", true),
      Query.limit(1),
    ],
  });

  const section = sectionResponse.rows[0];

  if (!section) {
    return null;
  }

  const [sectionProducts, categories] = await Promise.all([
    getSectionProducts(section.$id),
    getCategories(),
  ]);

  const products = await Promise.all(
    sectionProducts.map(async (sectionProduct) => {
      const product = await getProductById(sectionProduct.product_ID);

      if (!product) {
        return null;
      }

      const images = await getProductImages(product.$id);
      const primaryImage = images.find((image) => image.isPrimary) ?? images[0];

      if (!primaryImage) {
        return null;
      }

      return {
        id: product.$id,
        name: product.name,
        price: product.price,
        currency: "৳",
        href: getProductUrl(product, categories),
        image: primaryImage.url,
        scene: sectionProduct.scene,
      };
    }),
  );

  return {
    ...section,
    products: products.filter(Boolean),
  };
}

export async function getEditorialSections() {
  const sectionsResponse = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: HOME_SECTIONS_TABLE_ID,
    queries: [
      Query.equal("type", "editorial-section"),
      Query.equal("isActive", true),
      Query.orderAsc("sortOrder"),
    ],
  });

  const [categories] = await Promise.all([getCategories()]);

  return Promise.all(
    sectionsResponse.rows.map(async (section) => {
      const productsResponse = await getSectionProducts(section.$id);

      const products = await Promise.all(
        productsResponse.map(async (sectionProduct) => {
          const product = await getProductById(sectionProduct.product_ID);

          if (!product) {
            return null;
          }

          const images = await getProductImages(product.$id);
          const selectedImage = sectionProduct.image_ID
            ? images.find((image) => image.id === sectionProduct.image_ID)
            : null;
          const primaryImage =
            selectedImage ||
            images.find((image) => image.isPrimary) ||
            images[0];

          if (!primaryImage) {
            return null;
          }

          return {
            id: product.$id,
            name: product.name,
            price: product.price,
            currency: "৳",
            href: getProductUrl(product, categories),
            image: primaryImage.url,
            alt: primaryImage.alt || product.name,
          };
        }),
      );

      const editorialImage = section.editorial_File_ID
        ? storage.getFileView({
            bucketId: STORAGE_BUCKET_ID,
            fileId: section.editorialFileID,
          })
        : null;

      return {
        id: section.$id,
        section_key: section.section_key,
        title: section.title,
        subtitle: section.sub_title,
        editorial: {
          image: editorialImage,
          alt: section.editorial_Alt || "",
          cta: {
            Label: section.cta_Label || "",
            Href: section.cta_Href || "#",
          },
        },
        products: products.filter(Boolean),
      };
    }),
  );
}

export async function getInspiredProducts() {
  const sectionResponse = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: HOME_SECTIONS_TABLE_ID,
    queries: [
      Query.equal("section_key", "inspired"),
      Query.equal("isActive", true),
      Query.limit(1),
    ],
  });

  const section = sectionResponse.rows[0];

  if (!section) {
    return [];
  }

  const [sectionProducts, categories] = await Promise.all([
    getSectionProducts(section.$id),
    getCategories(),
  ]);

  const products = await Promise.all(
    sectionProducts.map(async (sectionProduct) => {
      const product = await getProductById(sectionProduct.product_ID);

      if (!product) {
        return null;
      }

      const images = await getProductImages(product.$id);
      const primaryImage = images.find((image) => image.isPrimary) ?? images[0];

      if (!primaryImage) {
        return null;
      }

      return {
        id: product.$id,
        name: product.name,
        price: product.price,
        currency: "৳",
        href: getProductUrl(product, categories),
        image: primaryImage.url,
        alt: primaryImage.alt || product.name,
      };
    }),
  );

  return products.filter(Boolean);
}
