import { ID, Query } from "appwrite";
import { tablesDB } from "../utils/appwrite";
import { getProductsForAdmin } from "./productServices";
import {
  getPrimaryProductImage,
  getProductImages,
} from "./productImageServices";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const HOME_SECTIONS_TABLE_ID =
  import.meta.env.VITE_APPWRITE_HOME_SECTIONS_TABLE_ID || "home_sections";
const HOME_SECTIONS_PRODUCTS_TABLE_ID =
  import.meta.env.VITE_APPWRITE_HOME_SECTIONS_PRODUCTS_TABLE_ID ||
  "home_sections_products";

export async function getHomeSectionsForAdmin() {
  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: HOME_SECTIONS_TABLE_ID,
    queries: [Query.orderAsc("sortOrder")],
  });

  return response.rows;
}

export async function getSectionProducts(sectionId) {
  const response = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: HOME_SECTIONS_PRODUCTS_TABLE_ID,
    queries: [
      Query.equal("section_ID", sectionId),
      Query.orderAsc("sortOrder"),
    ],
    total: false,
  });

  return response.rows;
}

export async function getSectionProductsWithDetails(sectionId) {
  const sectionProducts = await getSectionProducts(sectionId);

  return Promise.all(
    sectionProducts.map(async (sectionProduct) => {
      const product = await getProductByIdAdmin(sectionProduct.product_ID);

      if (!product) {
        return {
          ...sectionProduct,
          product: null,
          primaryImage: null,
          productImages: [],
          selectedImage: null,
        };
      }

      const [primaryImage, productImages] = await Promise.all([
        getPrimaryProductImage(product.$id),
        getProductImages(product.$id),
      ]);

      const selectedImage = sectionProduct.image_ID
        ? productImages.find((image) => image.id === sectionProduct.image_ID)
        : null;

      return {
        ...sectionProduct,
        product,
        primaryImage,
        productImages,
        selectedImage: selectedImage || primaryImage,
      };
    }),
  );
}

async function getProductByIdAdmin(productId) {
  if (!productId) {
    return null;
  }

  try {
    return await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: "products",
      rowId: productId,
    });
  } catch {
    return null;
  }
}

export async function addProductToSection({
  sectionId,
  productId,
  scene = null,
}) {
  if (!sectionId || !productId) {
    throw new Error("Section and product are required.");
  }

  const existingProducts = await getSectionProducts(sectionId);

  if (existingProducts.some((item) => item.product_ID === productId)) {
    throw new Error("This product is already in the section.");
  }

  const nextSortOrder =
    existingProducts.length === 0
      ? 0
      : Math.max(
          ...existingProducts.map((item) => Number(item.sortOrder) || 0),
        ) + 1;

  const data = {
    section_ID: sectionId,
    product_ID: productId,
    sortOrder: nextSortOrder,
    isActive: true,
  };

  if (scene !== null && scene !== undefined && scene !== "") {
    data.scene = Number(scene);
  }

  return tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: HOME_SECTIONS_PRODUCTS_TABLE_ID,
    rowId: ID.unique(),
    data,
  });
}

export async function removeProductFromSection(sectionProductId) {
  if (!sectionProductId) {
    throw new Error("Section product ID is required.");
  }

  await tablesDB.deleteRow({
    databaseId: DATABASE_ID,
    tableId: HOME_SECTIONS_PRODUCTS_TABLE_ID,
    rowId: sectionProductId,
  });

  return true;
}

export async function updateSectionProduct(sectionProductId, data = {}) {
  if (!sectionProductId) {
    throw new Error("Section product ID is required.");
  }

  const updateData = {};

  if (data.sortOrder !== undefined) {
    updateData.sortOrder = Number(data.sortOrder);
  }

  if (data.scene !== undefined) {
    updateData.scene =
      data.scene === "" || data.scene === null ? null : Number(data.scene);
  }

  if (data.isActive !== undefined) {
    updateData.isActive = Boolean(data.isActive);
  }

  if (data.imageId !== undefined) {
    updateData.imageId = data.imageId || null;
  }

  return tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: HOME_SECTIONS_PRODUCTS_TABLE_ID,
    rowId: sectionProductId,
    data: updateData,
  });
}

export async function updateHomeSectionStatus(sectionId, isActive) {
  return tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: HOME_SECTIONS_TABLE_ID,
    rowId: sectionId,
    data: { isActive: Boolean(isActive) },
  });
}

export async function updateHomeSection(sectionId, data = {}) {
  return tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: HOME_SECTIONS_TABLE_ID,
    rowId: sectionId,
    data: {
      title: String(data.title || "").trim(),
      sub_title: String(data.sub_title || "").trim(),
      editorial_Alt: String(data.editorial_Alt || "").trim(),
      cta_Label: String(data.cta_Label || "").trim(),
      cta_Href: String(data.cta_Href || "").trim(),
      isActive: Boolean(data.isActive),
    },
  });
}

export async function moveSectionProduct(
  sectionId,
  sectionProductId,
  direction,
) {
  const products = await getSectionProducts(sectionId);
  const currentIndex = products.findIndex(
    (product) => product.$id === sectionProductId,
  );

  if (currentIndex === -1) {
    throw new Error("Section product not found.");
  }

  const targetIndex =
    direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (targetIndex < 0 || targetIndex >= products.length) {
    return products;
  }

  const reorderedProducts = [...products];
  const [currentProduct] = reorderedProducts.splice(currentIndex, 1);
  reorderedProducts.splice(targetIndex, 0, currentProduct);

  const temporaryBase = Date.now();

  await Promise.all(
    reorderedProducts.map((product, index) =>
      updateSectionProduct(product.$id, {
        sortOrder: temporaryBase + index,
      }),
    ),
  );

  await Promise.all(
    reorderedProducts.map((product, index) =>
      updateSectionProduct(product.$id, {
        sortOrder: index,
      }),
    ),
  );

  return getSectionProducts(sectionId);
}

export async function getAvailableProductsForSection(sectionId) {
  const sectionProducts = await getSectionProducts(sectionId);
  const assignedProductIds = new Set(
    sectionProducts.map((item) => item.product_ID),
  );

  const { products } = await getProductsForAdmin({
    page: 1,
    limit: 100,
  });

  return products.filter((product) => !assignedProductIds.has(product.$id));
}
