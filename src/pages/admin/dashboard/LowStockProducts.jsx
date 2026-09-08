import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

import SectionCard from "../components/SectionCard";
import { getLowStockProducts } from "../../../services/dashboardServices";

function LowStockProducts() {
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadLowStockProducts() {
    try {
      setLoading(true);
      setError("");

      const data =
        await getLowStockProducts(5);

      setProducts(data);
    } catch (err) {
      console.error(
        "Failed to load low stock products:",
        err
      );

      setError(
        err?.message ||
          "Failed to load low stock products."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLowStockProducts();
  }, []);

  return (
    <SectionCard
      title="Low Stock"
      description="Products that need restocking"
    >
      {error ? (
        <div className="p-5">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-red-600">
                {error}
              </p>

              <button
                type="button"
                onClick={loadLowStockProducts}
                className="shrink-0 text-xs font-medium text-red-700 underline"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      ) : loading ? (
        <div className="divide-y divide-black/8">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 px-5 py-4"
            >
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-black/5" />

              <div className="min-w-0 flex-1">
                <div className="h-4 w-32 animate-pulse rounded bg-black/5" />

                <div className="mt-2 h-3 w-20 animate-pulse rounded bg-black/5" />
              </div>

              <div className="h-6 w-12 animate-pulse rounded-full bg-black/5" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex min-h-40 flex-col items-center justify-center px-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/5">
            <AlertTriangle
              size={17}
              strokeWidth={1.7}
              className="text-black/40"
            />
          </div>

          <p className="text-xs font-medium text-black/60">
            Inventory looks healthy
          </p>

          <p className="mt-1 text-[11px] text-black/35">
            No active products are low on stock.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-black/8">
          {products.map((product) => {
            const stock = Number(
              product.stockQuantity || 0
            );

            const isOutOfStock =
              stock === 0;

            return (
              <div
                key={product.$id}
                className="flex items-center gap-3 px-5 py-4 transition hover:bg-black/[0.02]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/5">
                  <AlertTriangle
                    size={16}
                    strokeWidth={1.7}
                    className="text-black/60"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {product.name}
                  </p>

                  <p className="mt-1 truncate text-xs text-black/40">
                    SKU: {product.sku || "—"}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p
                    className={[
                      "text-sm font-semibold",
                      isOutOfStock
                        ? "text-red-600"
                        : "text-black",
                    ].join(" ")}
                  >
                    {stock}
                  </p>

                  <p className="mt-0.5 text-[10px] text-black/35">
                    {isOutOfStock
                      ? "Out of stock"
                      : stock === 1
                        ? "item left"
                        : "items left"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

export default LowStockProducts;