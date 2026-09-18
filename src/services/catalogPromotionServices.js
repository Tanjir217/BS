import { ID, Query } from "appwrite";

import { storage, tablesDB } from "../utils/appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const HOME_SECTIONS_TABLE_ID = import.meta.env.VITE_APPWRITE_HOME_SECTIONS_TABLE_ID;
const STORAGE_BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID;

export const CATALOG_PROMOTION_KEY = "catalog_promotion";

function toPromotion(section) {
  if (!section) return null;

  return {
    ...section,
    imageUrl: section.editorial_File_ID
      ? storage.getFileView({
          bucketId: STORAGE_BUCKET_ID,
          fileId: section.editorial_File_ID,
        })
      : null,
  };
}

export async function getCatalogPromotion() {
  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: HOME_SECTIONS_TABLE_ID,
    queries: [
      Query.equal("section_key", CATALOG_PROMOTION_KEY),
      Query.limit(1),
    ],
    total: false,
  });

  const section = response.rows?.[0] || null;
  return section?.is_Active ? toPromotion(section) : null;
}

export async function getCatalogPromotionForAdmin() {
  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: HOME_SECTIONS_TABLE_ID,
    queries: [
      Query.equal("section_key", CATALOG_PROMOTION_KEY),
      Query.limit(1),
    ],
    total: false,
  });

  return toPromotion(response.rows?.[0] || null);
}

export async function createCatalogPromotion() {
  const response = await tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: HOME_SECTIONS_TABLE_ID,
    rowId: ID.unique(),
    data: {
      section_key: CATALOG_PROMOTION_KEY,
      type: "catalog-promotion",
      title: "Step into something new.",
      sub_title: "Discover the latest Bayzid Shoes collection.",
      is_Active: true,
      sort_Order: 999,
      editorial_File_ID: "",
      editorial_Alt: "",
      cta_Label: "Shop the collection",
      cta_Href: "/all-products",
    },
  });

  return toPromotion(response);
}

export async function updateCatalogPromotion(promotionId, data) {
  const response = await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: HOME_SECTIONS_TABLE_ID,
    rowId: promotionId,
    data: {
      title: String(data.title || "").trim(),
      sub_title: String(data.sub_title || "").trim(),
      editorial_Alt: String(data.editorial_Alt || "").trim(),
      cta_Label: String(data.cta_Label || "").trim(),
      cta_Href: String(data.cta_Href || "").trim(),
      is_Active: Boolean(data.is_Active),
    },
  });

  return toPromotion(response);
}
