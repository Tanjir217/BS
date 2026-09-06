import { ID, Query } from "appwrite";

import { tablesDB, storage } from "../utils/appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

const PRODUCT_IMAGES_TABLE_ID = import.meta.env
  .VITE_APPWRITE_PRODUCT_IMAGES_TABLE_ID;

const STORAGE_BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID;

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
// Upload an image to Appwrite Storage
export async function uploadProductImage({
  productId,
  file,
  alt = "",
  sortOrder = 0,
  isPrimary = false,
}) {
  const uploadedFile = await storage.createFile({
    bucketId: STORAGE_BUCKET_ID,
    fileId: ID.unique(),
    file,
  });

  const imageRow = await tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: PRODUCT_IMAGES_TABLE_ID,
    rowId: ID.unique(),
    data: {
      product_ID: productId,
      fileID: uploadedFile.$id,
      alt,
      sortOrder,
      isPrimary,
    },
  });

  return {
    id: imageRow.$id,
    fileID: uploadedFile.$id,
    alt,
    sortOrder,
    isPrimary,
    url: storage.getFileView({
      bucketId: STORAGE_BUCKET_ID,
      fileId: uploadedFile.$id,
    }),
  };
}
// Delete a product image
export async function deleteProductImage(imageId, fileId) {
  await tablesDB.deleteRow({
    databaseId: DATABASE_ID,
    tableId: PRODUCT_IMAGES_TABLE_ID,
    rowId: imageId,
  });

  await storage.deleteFile({
    bucketId: STORAGE_BUCKET_ID,
    fileId,
  });

  return true;
}
export async function deleteProductImages(productId) {
    const images = await getProductImages(productId);
  
    await Promise.all(
      images.map((image) =>
        deleteProductImage(image.id, image.fileID)
      )
    );
  
    return true;
  }
// Update product image information
export async function updateProductImage(imageId, data) {
  const response = await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: PRODUCT_IMAGES_TABLE_ID,
    rowId: imageId,
    data: {
      alt: data.alt,
      sortOrder: Number(data.sortOrder),
      isPrimary: Boolean(data.isPrimary),
    },
  });

  return response;
}
// Set one image as the primary image
export async function setPrimaryProductImage(productId, imageId) {
  const images = await getProductImages(productId);

  await Promise.all(
    images.map((image) =>
      tablesDB.updateRow({
        databaseId: DATABASE_ID,
        tableId: PRODUCT_IMAGES_TABLE_ID,
        rowId: image.id,
        data: {
          isPrimary: image.id === imageId,
        },
      }),
    ),
  );

  return getProductImages(productId);
}
export async function getPrimaryProductImage(productId) {
  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: PRODUCT_IMAGES_TABLE_ID,
    queries: [
      Query.equal("product_ID", productId),
      Query.equal("isPrimary", true),
      Query.limit(1),
    ],
  });

  const image = response.rows[0];

  if (!image) {
    return null;
  }

  return {
    id: image.$id,
    fileID: image.fileID,
    alt: image.alt,
    sortOrder: image.sortOrder,
    isPrimary: image.isPrimary,
    url: storage.getFileView({
      bucketId: STORAGE_BUCKET_ID,
      fileId: image.fileID,
    }),
  };
}

export async function reorderProductImage(productId, imageId, direction) {
  const images = await getProductImages(productId);

  const currentIndex = images.findIndex((image) => image.id === imageId);

  if (currentIndex === -1) {
    return images;
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (targetIndex < 0 || targetIndex >= images.length) {
    return images;
  }

  const currentImage = images[currentIndex];
  const targetImage = images[targetIndex];

  await Promise.all([
    tablesDB.updateRow({
      databaseId: DATABASE_ID,
      tableId: PRODUCT_IMAGES_TABLE_ID,
      rowId: currentImage.id,
      data: {
        sortOrder: targetImage.sortOrder,
      },
    }),

    tablesDB.updateRow({
      databaseId: DATABASE_ID,
      tableId: PRODUCT_IMAGES_TABLE_ID,
      rowId: targetImage.id,
      data: {
        sortOrder: currentImage.sortOrder,
      },
    }),
  ]);

  return getProductImages(productId);
}
