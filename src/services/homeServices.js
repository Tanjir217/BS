import { Query } from "appwrite";

import { tablesDB, storage } from "../utils/appwrite";

import { getProductById } from "./productServices";

import { getProductImages } from "./productImageServices";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

const HOME_SECTIONS_TABLE_ID = import.meta.env
  .VITE_APPWRITE_HOME_SECTIONS_TABLE_ID;

const HOME_SECTIONS_PRODUCTS_TABLE_ID = import.meta.env
  .VITE_APPWRITE_HOME_SECTIONS_PRODUCTS_TABLE_ID;

const STORAGE_BUCKET_ID =
  import.meta.env.VITE_APPWRITE_BUCKET_ID;



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
          sectionProduct.product_ID,
        );
        return null;
      }

      const images = await getProductImages(product.$id);
      console.log("HOME PRODUCT:", product.name);
      console.log("HOME PRODUCT ID:", product.$id);
      console.log("HOME PRODUCT IMAGES:", images);

      const primaryImage = images.find((image) => image.isPrimary) ?? images[0];

      if (!primaryImage) {
        console.log(
          "NO IMAGE FOUND FOR HOME PRODUCT:",
          product.name,
          product.$id,
        );
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
    }),
  );

  return {
    ...section,
    products: products.filter(Boolean),
  };
}



export async function getEditorialSections() {
  // 1. Get all active editorial sections
  const sectionsResponse = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: HOME_SECTIONS_TABLE_ID,
    queries: [
      Query.equal("type", "editorial-section"),
      Query.equal("is_Active", true),
      Query.orderAsc("sort_Order"),
    ],
  });

  // 2. Build each editorial section
  const sections = await Promise.all(
    sectionsResponse.rows.map(async (section) => {
      // Get the products belonging to this section
      const productsResponse = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: HOME_SECTIONS_PRODUCTS_TABLE_ID,
        queries: [
          Query.equal("section_ID", section.$id),
          Query.equal("is_Active", true),
          Query.orderAsc("sort_Order"),
        ],
      });

      // Get product information + product images
      const products = await Promise.all(
        productsResponse.rows.map(async (sectionProduct) => {
          const product = await getProductById(
            sectionProduct.product_ID
          );

          if (!product) {
            return null;
          }

          const images = await getProductImages(product.$id);

          const primaryImage =
            images.find((image) => image.isPrimary) ?? images[0];

          return {
            id: product.$id,
            name: product.name,
            price: product.price,
            currency: product.currency,
            href: `/products/${product.slug}`,
            image: primaryImage?.url ?? null,
            alt: primaryImage?.alt || product.name,
          };
        })
      );

      // Get the editorial image from Appwrite Storage
      let editorialImage = null;

      if (section.editorial_file_ID) {
        editorialImage = storage.getFileView({
          bucketId: STORAGE_BUCKET_ID,
          fileId: section.editorial_file_ID,
        });
      }

      return {
        id: section.$id,
        section_key: section.section_key,
        title: section.title,
        subtitle: section.sub_title,

        editorial: {
          image: editorialImage,
          alt: section.editorial_alt || "",
          cta: {
            label: section.cta_label || "",
            href: section.cta_href || "#",
          },
        },

        products: products.filter(Boolean),
      };
    })
  );

  return sections;
}