import { useEffect, useMemo, useState } from "react";

import {
  addProductToSection,
  getAvailableProductsForSection,
} from "../../../services/homeAdminServices";

function AddProductToSection({
  section,
  onClose,
  onAdded,
}) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const data =
          await getAvailableProductsForSection(
            section.$id
          );

        setProducts(data);
      } catch (error) {
        console.error(
          "Failed to load available products:",
          error
        );

        setError(
          "Failed to load available products."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [section.$id]);

  const filteredProducts = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.name
          ?.toLowerCase()
          .includes(value) ||
        product.sku
          ?.toLowerCase()
          .includes(value)
      );
    });
  }, [products, search]);

  async function handleAdd() {
    if (!selectedProductId) {
      return;
    }

    try {
      setAdding(true);
      setError("");

      await addProductToSection({
        sectionId: section.$id,
        productId: selectedProductId,
      });

      onAdded();
    } catch (error) {
      console.error(
        "Failed to add product:",
        error
      );

      setError(
        error.message ||
          "Failed to add product."
      );
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">
            Add Product
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Choose a product to add to this section.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          Cancel
        </button>
      </div>

      <div className="mt-4">
        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search by name or SKU..."
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500"
        />
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">
          Loading products...
        </p>
      ) : filteredProducts.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">
          No available products found.
        </p>
      ) : (
        <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
          {filteredProducts.map((product) => (
            <button
              key={product.$id}
              type="button"
              onClick={() =>
                setSelectedProductId(product.$id)
              }
              className={`flex w-full items-center gap-3 rounded-lg border bg-white p-3 text-left ${
                selectedProductId === product.$id
                  ? "border-gray-900"
                  : "border-gray-200"
              }`}
            >
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-gray-100">
                {product.primaryImage?.url ? (
                  <img
                    src={product.primaryImage.url}
                    alt={product.name}
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
                  {product.name}
                </p>

                <p className="text-xs text-gray-500">
                  {product.sku}
                </p>

                <p className="text-sm font-medium text-gray-900">
                  ${product.price}
                </p>
              </div>

              {selectedProductId === product.$id && (
                <span className="text-sm font-medium text-gray-900">
                  Selected
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          disabled={
            !selectedProductId || adding
          }
          onClick={handleAdd}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {adding ? "Adding..." : "Add Product"}
        </button>
      </div>
    </div>
  );
}

export default AddProductToSection;