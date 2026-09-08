import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

import SectionCard from "../components/SectionCard";
import { getBestSellingProducts } from "../../../services/dashboardServices";

function formatCurrency(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD")}`;
}

function BestSellingProducts() {
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadBestSellingProducts() {
    try {
      setLoading(true);
      setError("");

      const data =
        await getBestSellingProducts(5);

      setProducts(data);
    } catch (err) {
      console.error(
        "Failed to load best selling products:",
        err
      );

      setError(
        err?.message ||
          "Failed to load best selling products."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBestSellingProducts();
  }, []);

  return (
    <SectionCard
      title="Best Selling"
      description="Top products by units sold"
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
                onClick={loadBestSellingProducts}
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
              <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-black/5" />

              <div className="min-w-0 flex-1">
                <div className="h-4 w-32 animate-pulse rounded bg-black/5" />

                <div className="mt-2 h-3 w-20 animate-pulse rounded bg-black/5" />
              </div>

              <div className="h-3 w-20 animate-pulse rounded bg-black/5" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center px-5">
          <p className="text-xs text-black/35">
            No completed sales yet.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-black/8">
          {products.map((product) => (
            <div
              key={product.productId}
              className="flex items-center gap-3 px-5 py-4"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/5 text-xs font-semibold">
                {product.rank}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {product.name}
                </p>

                <p className="mt-1 text-xs text-black/40">
                  {product.sold} sold
                </p>
              </div>

              <p className="shrink-0 text-xs font-medium">
                {formatCurrency(
                  product.revenue
                )}
              </p>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export default BestSellingProducts;