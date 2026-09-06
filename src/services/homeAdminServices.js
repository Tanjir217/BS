import { ID, Query } from "appwrite";

import { tablesDB } from "../utils/appwrite";
import { getProductsForAdmin } from "./productServices";
import { getProductByIdAdmin } from "./productServices";
import { getPrimaryProductImage } from "./productImageServices";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

const HOME_SECTIONS_TABLE_ID =
  import.meta.env.VITE_APPWRITE_HOME_SECTIONS_TABLE_ID;

const HOME_SECTIONS_PRODUCTS_TABLE_ID =
  import.meta.env.VITE_APPWRITE_HOME_SECTIONS_PRODUCTS_TABLE_ID;

/**
 * Get all homepage sections for the admin.
 */
export async function getHomeSectionsForAdmin() {
  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: HOME_SECTIONS_TABLE_ID,
    queries: [Query.orderAsc("sort_Order")],
  });

  return response.rows;
}

/**
 * Get one homepage section by its section key.
 *
 * Example:
 * "new_collection"
 * "inspired"
 */
export async function getHomeSectionByKey(sectionKey) {
  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: HOME_SECTIONS_TABLE_ID,
    queries: [
      Query.equal("section_key", sectionKey),
      Query.limit(1),
    ],
  });

  return response.rows[0] ?? null;
}

/**
 * Get all products assigned to a homepage section.
 */
export async function getSectionProducts(sectionId) {
  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: HOME_SECTIONS_PRODUCTS_TABLE_ID,
    queries: [
      Query.equal("section_ID", sectionId),
      Query.orderAsc("sort_Order"),
    ],
  });

  return response.rows;
}
export async function getSectionProductsWithDetails(sectionId) {
    const sectionProducts = await getSectionProducts(sectionId);
  
    const products = await Promise.all(
      sectionProducts.map(async (sectionProduct) => {
        const product = await getProductByIdAdmin(
          sectionProduct.product_ID
        );
  
        if (!product) {
          return {
            ...sectionProduct,
            product: null,
            primaryImage: null,
          };
        }
  
        const primaryImage = await getPrimaryProductImage(
          product.$id
        );
  
        return {
          ...sectionProduct,
          product,
          primaryImage,
        };
      })
    );
  
    return products;
  }
/**
 * Add a product to a homepage section.
 */
export async function addProductToSection({
    sectionId,
    productId,
    scene = null,
  }) {
    const existingProducts =
      await getSectionProducts(sectionId);
  
    const alreadyExists = existingProducts.some(
      (item) => item.product_ID === productId
    );
  
    if (alreadyExists) {
      throw new Error(
        "This product is already in the section."
      );
    }
  
    const nextSortOrder =
      existingProducts.length === 0
        ? 0
        : Math.max(
            ...existingProducts.map(
              (item) => Number(item.sort_Order)
            )
          ) + 1;
  
    const data = {
      section_ID: sectionId,
      product_ID: productId,
      sort_Order: nextSortOrder,
      is_Active: true,
    };
  
    if (
      scene !== null &&
      scene !== undefined &&
      scene !== ""
    ) {
      data.scene = Number(scene);
    }
  
    const response = await tablesDB.createRow({
      databaseId: DATABASE_ID,
      tableId: HOME_SECTIONS_PRODUCTS_TABLE_ID,
      rowId: ID.unique(),
      data,
    });
  
    return response;
  }

/**
 * Remove a product from a homepage section.
 */
export async function removeProductFromSection(
  sectionProductId
) {
  await tablesDB.deleteRow({
    databaseId: DATABASE_ID,
    tableId: HOME_SECTIONS_PRODUCTS_TABLE_ID,
    rowId: sectionProductId,
  });

  return true;
}

/**
 * Update a product's position inside a homepage section.
 */
export async function updateSectionProduct(
  sectionProductId,
  data
) {
  const updateData = {};

  if (data.sortOrder !== undefined) {
    updateData.sort_Order = Number(data.sortOrder);
  }

  if (data.scene !== undefined) {
    updateData.scene =
      data.scene === "" || data.scene === null
        ? null
        : Number(data.scene);
  }

  if (data.isActive !== undefined) {
    updateData.is_Active = Boolean(data.isActive);
  }

  const response = await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: HOME_SECTIONS_PRODUCTS_TABLE_ID,
    rowId: sectionProductId,
    data: updateData,
  });

  return response;
}

/**
 * Update homepage section status.
 */
export async function updateHomeSectionStatus(
  sectionId,
  isActive
) {
  const response = await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: HOME_SECTIONS_TABLE_ID,
    rowId: sectionId,
    data: {
      is_Active: Boolean(isActive),
    },
  });

  return response;
}
export async function moveSectionProduct(
  sectionId,
  sectionProductId,
  direction
) {
  const products = await getSectionProducts(sectionId);

  const currentIndex = products.findIndex(
    (product) => product.$id === sectionProductId
  );

  if (currentIndex === -1) {
    throw new Error("Section product not found.");
  }

  const targetIndex =
    direction === "up"
      ? currentIndex - 1
      : currentIndex + 1;

  if (
    targetIndex < 0 ||
    targetIndex >= products.length
  ) {
    return products;
  }

  // Move the item in the local array.
  const reorderedProducts = [...products];

  const [currentProduct] =
    reorderedProducts.splice(currentIndex, 1);

  reorderedProducts.splice(
    targetIndex,
    0,
    currentProduct
  );

  /*
   * First give every row a unique temporary position.
   * This prevents collisions while updating.
   */
  const temporaryBase = Date.now();

  await Promise.all(
    reorderedProducts.map((product, index) =>
      updateSectionProduct(product.$id, {
        sortOrder: temporaryBase + index,
      })
    )
  );

  /*
   * Now normalize the final order:
   *
   * 0
   * 1
   * 2
   * 3
   * ...
   */
  await Promise.all(
    reorderedProducts.map((product, index) =>
      updateSectionProduct(product.$id, {
        sortOrder: index,
      })
    )
  );

  return getSectionProducts(sectionId);
}

  export async function getAvailableProductsForSection(
    sectionId
  ) {
    const sectionProducts = await getSectionProducts(
      sectionId
    );
  
    const assignedProductIds = new Set(
      sectionProducts.map(
        (item) => item.product_ID
      )
    );
  
    const { products } = await getProductsForAdmin({
      page: 1,
      limit: 100,
    });
  
    return products.filter(
      (product) =>
        !assignedProductIds.has(product.$id)
    );
  }
  export async function updateHomeSection(
    sectionId,
    data
  ) {
    const response = await tablesDB.updateRow({
      databaseId: DATABASE_ID,
      tableId: HOME_SECTIONS_TABLE_ID,
      rowId: sectionId,
      data: {
        title: data.title || "",
        sub_title: data.sub_title || "",
        editorial_Alt: data.editorial_Alt || "",
        cta_Label: data.cta_Label || "",
        cta_Href: data.cta_Href || "",
        is_Active: Boolean(data.is_Active),
      },
    });
  
    return response;
  }