import { ID } from "appwrite";

import {
  storage,
  tablesDB,
} from "../utils/appwrite";

const DATABASE_ID =
  import.meta.env.VITE_APPWRITE_DATABASE_ID;

const HOME_SECTIONS_TABLE_ID =
  import.meta.env.VITE_APPWRITE_HOME_SECTIONS_TABLE_ID;

const STORAGE_BUCKET_ID =
  import.meta.env.VITE_APPWRITE_BUCKET_ID;

/**
 * Get the display URL for an editorial image.
 */
export function getEditorialImageUrl(fileId) {
  if (!fileId) {
    return null;
  }

  return storage.getFileView({
    bucketId: STORAGE_BUCKET_ID,
    fileId,
  });
}

/**
 * Upload a new editorial image and connect it
 * to the homepage section.
 */
export async function uploadEditorialImage(
  sectionId,
  file
) {
  if (!file) {
    throw new Error("No image selected.");
  }

  const uploadedFile = await storage.createFile({
    bucketId: STORAGE_BUCKET_ID,
    fileId: ID.unique(),
    file,
  });

  try {
    await tablesDB.updateRow({
      databaseId: DATABASE_ID,
      tableId: HOME_SECTIONS_TABLE_ID,
      rowId: sectionId,
      data: {
        editorial_File_ID: uploadedFile.$id,
      },
    });
  } catch (error) {
    // If the database update fails,
    // remove the newly uploaded file.
    try {
      await storage.deleteFile({
        bucketId: STORAGE_BUCKET_ID,
        fileId: uploadedFile.$id,
      });
    } catch (cleanupError) {
      console.error(
        "Failed to clean up uploaded editorial image:",
        cleanupError
      );
    }

    throw error;
  }

  return {
    fileID: uploadedFile.$id,
    url: getEditorialImageUrl(uploadedFile.$id),
  };
}

/**
 * Replace an existing editorial image.
 *
 * New image is uploaded first.
 * Database is updated second.
 * Old image is deleted last.
 */
export async function replaceEditorialImage(
  sectionId,
  oldFileId,
  file
) {
  if (!file) {
    throw new Error("No image selected.");
  }

  const uploadedFile = await storage.createFile({
    bucketId: STORAGE_BUCKET_ID,
    fileId: ID.unique(),
    file,
  });

  try {
    await tablesDB.updateRow({
      databaseId: DATABASE_ID,
      tableId: HOME_SECTIONS_TABLE_ID,
      rowId: sectionId,
      data: {
        editorial_File_ID: uploadedFile.$id,
      },
    });
  } catch (error) {
    // Database update failed.
    // Delete the new file so we don't leave
    // an orphaned Storage file.
    try {
      await storage.deleteFile({
        bucketId: STORAGE_BUCKET_ID,
        fileId: uploadedFile.$id,
      });
    } catch (cleanupError) {
      console.error(
        "Failed to clean up replacement image:",
        cleanupError
      );
    }

    throw error;
  }

  // The database now points to the new image.
  // The old image is no longer needed.
  if (oldFileId) {
    try {
      await storage.deleteFile({
        bucketId: STORAGE_BUCKET_ID,
        fileId: oldFileId,
      });
    } catch (error) {
      console.error(
        "New image saved, but old image could not be deleted:",
        error
      );
    }
  }

  return {
    fileID: uploadedFile.$id,
    url: getEditorialImageUrl(uploadedFile.$id),
  };
}

/**
 * Remove the editorial image from the section.
 */
export async function removeEditorialImage(
  sectionId,
  fileId
) {
  // First remove the reference from the database.
  await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: HOME_SECTIONS_TABLE_ID,
    rowId: sectionId,
    data: {
      editorial_File_ID: "",
    },
  });

  // Then remove the actual file.
  if (fileId) {
    await storage.deleteFile({
      bucketId: STORAGE_BUCKET_ID,
      fileId,
    });
  }

  return true;
}