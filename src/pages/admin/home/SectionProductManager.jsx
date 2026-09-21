import { useEffect, useState } from "react";

import {
  getSectionProductsWithDetails,
  removeProductFromSection,
  updateSectionProduct,
  moveSectionProduct,
} from "../../../services/homeAdminServices";
import AddProductToSection from "./AddProductToSection";
import CustomDropdown from "../../../components/ui/CustomDropdown";
import { uploadProductImage } from "../../../services/productImageServices";

function SectionProductManager({ section, onClose }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");
      setProducts(await getSectionProductsWithDetails(section.$id));
    } catch (error) {
      console.error("Failed to load section products:", error);
      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, [section.$id]);

  async function handleRemove(sectionProductId) {
    if (!window.confirm(`Remove this product from ${section.title || section.section_key}?`)) {
      return;
    }

    try {
      await removeProductFromSection(sectionProductId);
      await loadProducts();
    } catch (error) {
      console.error("Failed to remove product:", error);
      setError("Failed to remove product.");
    }
  }

  async function handleToggleActive(item) {
    try {
      setError("");
      await updateSectionProduct(item.$id, {
        isActive: !item.isActive,
      });
      await loadProducts();
    } catch (error) {
      console.error("Failed to update section product visibility:", error);
      setError("Failed to update product visibility.");
    }
  }

  async function handleImageUpload(item, event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !item.product?.$id) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Use JPG, PNG or WebP for product images.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Product image must be smaller than 5MB.");
      return;
    }

    try {
      setError("");
      const nextSortOrder =
        item.productImages?.length > 0
          ? Math.max(...item.productImages.map((image) => Number(image.sortOrder) || 0)) + 1
          : 0;

      const uploaded = await uploadProductImage({
        productId: item.product.$id,
        file,
        alt: item.product.name || "",
        sortOrder: nextSortOrder,
        isPrimary: false,
      });

      await updateSectionProduct(item.$id, { imageId: uploaded.id });
      await loadProducts();
    } catch (error) {
      console.error("Failed to upload editorial product image:", error);
      setError("Failed to upload the product image.");
    }
  }

  async function handleImageChange(item, imageId) {
    try {
      setError("");
      await updateSectionProduct(item.$id, { imageId });
      await loadProducts();
    } catch (error) {
      console.error("Failed to update editorial product image:", error);
      setError("Failed to update the product image.");
    }
  }

  async function handleMove(index, direction) {
    const current = products[index];
    if (!current) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= products.length) return;

    try {
      setError("");
      await moveSectionProduct(section.$id, current.$id, direction);
      await loadProducts();
    } catch (error) {
      console.error("Failed to reorder products:", error);
      setError("Failed to reorder products.");
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 p-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {section.title || "Homepage section"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage products, visibility, order, and editorial imagery.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddProduct(true)}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
          >
            + Add Product
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
          >
            Close
          </button>
        </div>
      </div>

      <div className="p-5">
        {loading && <p className="text-sm text-gray-500">Loading products...</p>}
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {!loading && products.length === 0 && (
          <p className="text-sm text-gray-500">No products assigned to this section.</p>
        )}

        {!loading && products.length > 0 && (
          <div className="space-y-3">
            {products.map((item, index) => (
              <div
                key={item.$id}
                className="flex items-start gap-4 rounded-lg border border-gray-200 p-3"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gray-100">
                  {item.selectedImage?.url ? (
                    <img
                      src={item.selectedImage.url}
                      alt={item.product?.name || ""}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">
                      BS
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">
                    {item.product?.name || "Product not found"}
                  </p>
                  <p className="text-sm text-gray-500">{item.product?.sku || "—"}</p>
                  <p className="text-sm font-medium text-gray-900">
                    ৳{item.product?.price ?? "—"}
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={Boolean(item.isActive)}
                        onChange={() => handleToggleActive(item)}
                      />
                      Show in section
                    </label>
                  </div>

                  {section.type === "editorial-section" && item.productImages?.length > 0 && (
                    <div className="mt-3 max-w-sm">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                        Slider image
                      </p>

                      <CustomDropdown
                        value={item.selectedImage?.id || ""}
                        onChange={(value) => handleImageChange(item, value)}
                        options={item.productImages.map((image, imageIndex) => ({
                          value: image.id,
                          label:
                            "Image " +
                            (imageIndex + 1) +
                            (image.isPrimary ? " · Primary" : ""),
                        }))}
                        className="w-full"
                        menuClassName="min-w-full"
                      />

                      <label className="mt-2 inline-flex cursor-pointer items-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
                        Upload new product image
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(event) => handleImageUpload(item, event)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMove(index, "up")}
                    className="rounded-md border px-2 py-1 text-sm disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={index === products.length - 1}
                    onClick={() => handleMove(index, "down")}
                    className="rounded-md border px-2 py-1 text-sm disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.$id)}
                    className="ml-2 rounded-md border border-red-200 px-3 py-1 text-sm text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddProduct && (
          <AddProductToSection
            section={section}
            onClose={() => setShowAddProduct(false)}
            onAdded={async () => {
              setShowAddProduct(false);
              await loadProducts();
            }}
          />
        )}
      </div>
    </div>
  );
}

export default SectionProductManager;
