import { useEffect, useState } from "react";

import {
  getSectionProductsWithDetails,
  removeProductFromSection,
  updateSectionProduct,
  moveSectionProduct,
} from "../../../services/homeAdminServices";
import AddProductToSection from "./AddProductToSection";

function SectionProductManager({ section, onClose }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const data = await getSectionProductsWithDetails(section.$id);

      setProducts(data);
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
    const confirmed = window.confirm(
      `Remove this product from ${(
        section.title || section.section_key
      )}?`,
    );

    if (!confirmed) return;

    try {
      await removeProductFromSection(sectionProductId);

      await loadProducts();
    } catch (error) {
      console.error("Failed to remove product:", error);

      setError("Failed to remove product.");
    }
  }

  async function handleMove(index, direction) {
    const current = products[index];
  
    if (!current) {
      return;
    }
  
    const targetIndex =
      direction === "up"
        ? index - 1
        : index + 1;
  
    if (
      targetIndex < 0 ||
      targetIndex >= products.length
    ) {
      return;
    }
  
    try {
      setError("");
  
      await moveSectionProduct(
        section.$id,
        current.$id,
        direction
      );
  
      await loadProducts();
    } catch (error) {
      console.error(
        "Failed to reorder products:",
        error
      );
  
      setError("Failed to reorder products.");
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 p-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {section.title || "New Collection"}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Manage products in this homepage section.
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
        {loading && (
          <p className="text-sm text-gray-500">Loading products...</p>
        )}

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {!loading && products.length === 0 && (
          <p className="text-sm text-gray-500">
            No products assigned to this section.
          </p>
        )}

        {!loading && products.length > 0 && (
          <div className="space-y-3">
            {products.map((item, index) => (
              <div
                key={item.$id}
                className="flex items-center gap-4 rounded-lg border border-gray-200 p-3"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gray-100">
                  {item.primaryImage?.url ? (
                    <img
                      src={item.primaryImage.url}
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

                  <p className="text-sm text-gray-500">
                    {item.product?.sku || "—"}
                  </p>

                  <p className="text-sm font-medium text-gray-900">
                    ${item.product?.price ?? "—"}
                  </p>
                </div>

                <div className="flex items-center gap-1">
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
