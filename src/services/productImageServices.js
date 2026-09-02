import { Query } from "appwrite";

import { tablesDB, storage } from "../utils/appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

const PRODUCT_IMAGES_TABLE_ID =
  import.meta.env.VITE_APPWRITE_PRODUCT_IMAGES_TABLE_ID;

const STORAGE_BUCKET_ID =
  import.meta.env.VITE_APPWRITE_BUCKET_ID;


export async function getProductImages(productId) {
    const response = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: PRODUCT_IMAGES_TABLE_ID,
        queries: [
            Query.equal("product_ID", productId),
            Query.orderAsc("sortOrder"),
        ],
    });

    return response.rows.map((image) => ({
        id: image.$id,
        fileID: image.fileID,
        alt: image.alt,
        sortOrder: image.sortOrder,
        isPrimary: image.isPrimary,
        url: storage.getFileView({
            bucketId: STORAGE_BUCKET_ID,
            fileId: image.fileID,
        }),
    }));
}