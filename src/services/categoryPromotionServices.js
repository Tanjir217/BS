import { ID, Query } from "appwrite";

import { storage, tablesDB } from "../utils/appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const CATEGORIES_TABLE_ID = import.meta.env.VITE_APPWRITE_CATEGORIES_TABLE_ID;
const CATEGORY_PROMOTIONS_TABLE_ID =
  import.meta.env.VITE_APPWRITE_CATEGORY_PROMOTIONS_TABLE_ID;
const STORAGE_BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID;

export const ALL_PRODUCTS_PROMOTION_KEY = "all-products";

function requireCategoryPromotionConfig() {
  if (!DATABASE_ID) {
    throw new Error(
      "Appwrite database is not configured. Set VITE_APPWRITE_DATABASE_ID.",
    );
  }

  if (!CATEGORY_PROMOTIONS_TABLE_ID) {
    throw new Error(
      "Category promotions table is not configured. Set VITE_APPWRITE_CATEGORY_PROMOTIONS_TABLE_ID to the Appwrite table ID for category_promotions.",
    );
  }

  if (!STORAGE_BUCKET_ID) {
    throw new Error(
      "Appwrite storage is not configured. Set VITE_APPWRITE_BUCKET_ID.",
    );
  }

  return {
    databaseId: DATABASE_ID,
    tableId: CATEGORY_PROMOTIONS_TABLE_ID,
  };
}

function toPromotion(row) {
  if (!row) return null;

  return {
    ...row,
    imageUrl: row.image_File_ID
      ? storage.getFileView({
          bucketId: STORAGE_BUCKET_ID,
          fileId: row.image_File_ID,
        })
      : null,
  };
}

export async function getCategoryPromotion(categoryId) {
  const { databaseId, tableId } = requireCategoryPromotionConfig();
  const key = categoryId || ALL_PRODUCTS_PROMOTION_KEY;

  const response = await tablesDB.listRows({
    databaseId,
    tableId,
    queries: [Query.equal("category_ID", key), Query.limit(1)],
    total: false,
  });

  const row = response.rows?.[0] || null;
  return row?.is_Active ? toPromotion(row) : null;
}

export async function getCategoryPromotionsForAdmin() {
  const { databaseId, tableId } = requireCategoryPromotionConfig();

  const response = await tablesDB.listRows({
    databaseId,
    tableId,
    queries: [Query.orderAsc("sort_Order")],
    total: false,
  });

  return response.rows.map(toPromotion);
}

export async function getPromotionForAdmin(categoryId) {
  const { databaseId, tableId } = requireCategoryPromotionConfig();

  const response = await tablesDB.listRows({
    databaseId,
    tableId,
    queries: [Query.equal("category_ID", categoryId), Query.limit(1)],
    total: false,
  });

  return toPromotion(response.rows?.[0] || null);
}

export async function createCategoryPromotion(categoryId) {
  const { databaseId, tableId } = requireCategoryPromotionConfig();
  const existing = await getPromotionForAdmin(categoryId);

  if (existing) {
    return existing;
  }

  const response = await tablesDB.createRow({
    databaseId,
    tableId,
    rowId: ID.unique(),
    data: {
      category_ID: categoryId,
      title: "Step into something new.",
      sub_title: "Discover the latest Bayzid Shoes collection.",
      image_File_ID: "",
      image_Alt: "",
      cta_Label: "Shop the collection",
      cta_Href: "/all-products",
      is_Active: true,
      sort_Order: 0,
    },
  });

  return toPromotion(response);
}

export async function updateCategoryPromotion(promotionId, data) {
  const { databaseId, tableId } = requireCategoryPromotionConfig();

  const response = await tablesDB.updateRow({
    databaseId,
    tableId,
    rowId: promotionId,
    data: {
      title: String(data.title || "").trim(),
      sub_title: String(data.sub_title || "").trim(),
      image_Alt: String(data.image_Alt || "").trim(),
      cta_Label: String(data.cta_Label || "").trim(),
      cta_Href: String(data.cta_Href || "").trim(),
      is_Active: Boolean(data.is_Active),
    },
  });

  return toPromotion(response);
}

export async function uploadCategoryPromotionImage(promotionId, file) {
  const { databaseId, tableId } = requireCategoryPromotionConfig();

  if (!file) throw new Error("No image selected.");

  const uploadedFile = await storage.createFile({
    bucketId: STORAGE_BUCKET_ID,
    fileId: ID.unique(),
    file,
  });

  try {
    const updated = await tablesDB.updateRow({
      databaseId,
      tableId,
      rowId: promotionId,
      data: { image_File_ID: uploadedFile.$id },
    });

    return toPromotion(updated);
  } catch (error) {
    try {
      await storage.deleteFile({
        bucketId: STORAGE_BUCKET_ID,
        fileId: uploadedFile.$id,
      });
    } catch {
      // Preserve the original database error.
    }
    throw error;
  }
}

export async function replaceCategoryPromotionImage(
  promotionId,
  oldFileId,
  file,
) {
  const { databaseId, tableId } = requireCategoryPromotionConfig();

  if (!file) throw new Error("No image selected.");

  const uploadedFile = await storage.createFile({
    bucketId: STORAGE_BUCKET_ID,
    fileId: ID.unique(),
    file,
  });

  try {
    const updated = await tablesDB.updateRow({
      databaseId,
      tableId,
      rowId: promotionId,
      data: { image_File_ID: uploadedFile.$id },
    });

    if (oldFileId) {
      try {
        await storage.deleteFile({
          bucketId: STORAGE_BUCKET_ID,
          fileId: oldFileId,
        });
      } catch (error) {
        console.error("Failed to delete previous promotion image:", error);
      }
    }

    return toPromotion(updated);
  } catch (error) {
    try {
      await storage.deleteFile({
        bucketId: STORAGE_BUCKET_ID,
        fileId: uploadedFile.$id,
      });
    } catch {
      // Preserve the original database error.
    }
    throw error;
  }
}

export async function removeCategoryPromotionImage(promotionId, fileId) {
  const { databaseId, tableId } = requireCategoryPromotionConfig();

  const updated = await tablesDB.updateRow({
    databaseId,
    tableId,
    rowId: promotionId,
    data: { image_File_ID: "" },
  });

  if (fileId) {
    await storage.deleteFile({
      bucketId: STORAGE_BUCKET_ID,
      fileId,
    });
  }

  return toPromotion(updated);
}

export async function getPromotionCategories() {
  if (!DATABASE_ID) {
    throw new Error(
      "Appwrite database is not configured. Set VITE_APPWRITE_DATABASE_ID.",
    );
  }

  if (!CATEGORIES_TABLE_ID) {
    throw new Error(
      "Categories table is not configured. Set VITE_APPWRITE_CATEGORIES_TABLE_ID.",
    );
  }

  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: CATEGORIES_TABLE_ID,
    queries: [
      Query.equal("isActive", true),
      Query.orderAsc("name"),
    ],
    total: false,
  });

  return [
    {
      $id: ALL_PRODUCTS_PROMOTION_KEY,
      name: "All Products",
      slug: "all-products",
      description: "The promotional banner for the all-products page.",
    },
    ...response.rows,
  ];
}
