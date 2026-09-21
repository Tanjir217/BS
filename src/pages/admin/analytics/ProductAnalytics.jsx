import { useEffect, useState } from "react";
import { Package, ShoppingBag, TrendingUp } from "lucide-react";

import SectionCard from "../components/SectionCard";
import { getProductAnalytics } from "../../../services/analyticsServices";

function formatCurrency(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD")}`;
}

function ProductAnalytics({ range }) {
  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  async function loadProductAnalytics() {
    try {
      setLoading(true);
      setError("");

      const result = await getProductAnalytics(range);

      setData(result);
    } catch (err) {
      console.error("Failed to load product analytics:", err);

      setError(err?.message || "Failed to load product analytics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProductAnalytics();
  }, [range]);

  const metrics = data?.metrics || {
    revenue: 0,
    unitsSold: 0,
    productsSold: 0,
  };

  const products = data?.products || [];

  const categories = data?.categories || [];

  const topProducts = products.slice(0, 8);

  const maxProductRevenue = Math.max(
    ...topProducts.map((product) => Number(product.revenue || 0)),
    1,
  );

  const maxCategoryRevenue = Math.max(
    ...categories.map((category) => Number(category.revenue || 0)),
    1,
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Product Revenue"
          value={formatCurrency(metrics.revenue)}
          description="Delivered and paid orders"
          icon={TrendingUp}
        />

        <MetricCard
          label="Units Sold"
          value={Number(metrics.unitsSold || 0).toLocaleString("en-BD")}
          description="Units from revenue orders"
          icon={ShoppingBag}
        />

        <MetricCard
          label="Products Sold"
          value={Number(metrics.productsSold || 0).toLocaleString("en-BD")}
          description="Unique products with sales"
          icon={Package}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-red-600">{error}</p>

            <button
              type="button"
              onClick={loadProductAnalytics}
              className="shrink-0 text-xs font-medium text-red-700 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        {/* Top Products */}
        <SectionCard
          title="Top Products"
          description="Products ranked by revenue"
        >
          {loading ? (
            <LoadingList count={6} />
          ) : topProducts.length === 0 ? (
            <EmptyState
              title="No product sales yet"
              description="There are no delivered and paid product sales in this period."
            />
          ) : (
            <div className="divide-y divide-black/6">
              {topProducts.map((product, index) => {
                const revenue = Number(product.revenue || 0);

                const width =
                  maxProductRevenue > 0
                    ? (revenue / maxProductRevenue) * 100
                    : 0;

                return (
                  <div key={product.productId} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-black/30">
                            #{index + 1}
                          </span>

                          <p className="truncate text-sm font-medium">
                            {product.name}
                          </p>
                        </div>

                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-black/35">
                          <span>{product.sku || "No SKU"}</span>

                          <span>{product.categoryName || "Uncategorized"}</span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold">
                          {formatCurrency(revenue)}
                        </p>

                        <p className="mt-1 text-xs text-black/35">
                          {Number(product.unitsSold || 0).toLocaleString(
                            "en-BD",
                          )}{" "}
                          units ·{" "}
                          {Number(product.orderCount || 0).toLocaleString(
                            "en-BD",
                          )}{" "}
                          orders
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/5">
                      <div
                        className="h-full rounded-full bg-black"
                        style={{
                          width: `${width}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* Category Performance */}
        <SectionCard
          title="Category Performance"
          description="Revenue by product category"
        >
          {loading ? (
            <LoadingList count={5} />
          ) : categories.length === 0 ? (
            <EmptyState
              title="No category sales yet"
              description="Category performance will appear after product sales are recorded."
            />
          ) : (
            <div className="divide-y divide-black/6">
              {categories.map((category) => {
                const revenue = Number(category.revenue || 0);

                const width =
                  maxCategoryRevenue > 0
                    ? (revenue / maxCategoryRevenue) * 100
                    : 0;

                return (
                  <div key={category.categoryId} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {category.name || "Uncategorized"}
                        </p>

                        <p className="mt-1 text-xs text-black/35">
                          {Number(category.productCount || 0).toLocaleString(
                            "en-BD",
                          )}{" "}
                          products ·{" "}
                          {Number(category.unitsSold || 0).toLocaleString(
                            "en-BD",
                          )}{" "}
                          units
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-semibold">
                        {formatCurrency(revenue)}
                      </p>
                    </div>

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/5">
                      <div
                        className="h-full rounded-full bg-black"
                        style={{
                          width: `${width}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function MetricCard({ label, value, description, icon: Icon }) {
  return (
    <div className="rounded-xl border border-black/8 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-black/40">{label}</p>

        <Icon size={17} strokeWidth={1.8} className="text-black/30" />
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>

      <p className="mt-2 text-xs text-black/35">{description}</p>
    </div>
  );
}

function LoadingList({ count = 5 }) {
  return (
    <div className="space-y-4 p-5">
      {Array.from({
        length: count,
      }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="h-3 w-32 rounded bg-black/5" />

          <div className="mt-3 h-2 rounded bg-black/5" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="text-sm font-medium">{title}</p>

      <p className="mt-1 text-xs text-black/35">{description}</p>
    </div>
  );
}

export default ProductAnalytics;
