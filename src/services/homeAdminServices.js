import { ID, Query } from "appwrite";

import { tablesDB } from "../utils/appwrite";

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

/**
 * Add a product to a homepage section.
 */
export async function addProductToSection({
  sectionId,
  productId,
  sortOrder = 0,
  scene = null,
}) {
  const data = {
    section_ID: sectionId,
    product_ID: productId,
    sort_Order: Number(sortOrder),
    is_Active: true,
  };

  if (scene !== null && scene !== undefined && scene !== "") {
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