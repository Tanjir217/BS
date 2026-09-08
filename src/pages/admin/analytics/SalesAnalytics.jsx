import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, PackageCheck, XCircle } from "lucide-react";

import SectionCard from "../components/SectionCard";

import { getSalesAnalytics } from "../../../services/analyticsServices";

function formatCurrency(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD")}`;
}

const STATUS_ICONS = {
  pending: Clock3,
  confirmed: CheckCircle2,
  processing: PackageCheck,
  shipped: PackageCheck,
  delivered: CheckCircle2,
  cancelled: XCircle,
};

function SalesAnalytics({ range = 30 }) {
  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  async function loadSalesAnalytics() {
    try {
      setLoading(true);
      setError("");

      const result = await getSalesAnalytics(range);

      setData(result);
    } catch (err) {
      console.error("Failed to load sales analytics:", err);

      setError(err?.message || "Failed to load sales analytics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSalesAnalytics();
  }, [range]);

  const trend = data?.trend || [];

  const statusBreakdown = data?.statusBreakdown || [];

  const maxRevenue = Math.max(
    ...trend.map((item) => Number(item.revenue) || 0),
    1,
  );

  const maxOrders = Math.max(
    ...trend.map((item) => Number(item.orders) || 0),
    1,
  );

  const totalOrders = statusBreakdown.reduce(
    (total, item) => total + Number(item.count || 0),
    0,
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
      <SectionCard
        title="Sales Performance"
        description={`Revenue and orders over the last ${range} days`}
      >
        {error ? (
          <div className="p-5">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-red-600">{error}</p>

                <button
                  type="button"
                  onClick={loadSalesAnalytics}
                  className="shrink-0 text-xs font-medium text-red-700 underline"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="flex h-80 items-center justify-center">
            <p className="text-xs text-black/30">
              Loading sales performance...
            </p>
          </div>
        ) : (
          <div className="p-5">
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-black/40">Revenue</p>

                <p className="mt-1 text-lg font-semibold">
                  {formatCurrency(data?.metrics?.revenue)}
                </p>
              </div>

              <div>
                <p className="text-xs text-black/40">Orders</p>

                <p className="mt-1 text-lg font-semibold">
                  {Number(data?.metrics?.orders || 0).toLocaleString("en-BD")}
                </p>
              </div>

              <div>
                <p className="text-xs text-black/40">Average Order Value</p>

                <p className="mt-1 text-lg font-semibold">
                  {formatCurrency(data?.metrics?.averageOrderValue)}
                </p>
              </div>
            </div>

            <div className="mb-2">
              <p className="text-xs font-medium text-black/50">Daily revenue</p>
            </div>

            <div className="flex h-56 items-end gap-1 border-b border-black/8 sm:gap-2">
              {trend.map((item) => {
                const revenue = Number(item.revenue) || 0;

                const height =
                  revenue === 0 ? 0 : Math.max((revenue / maxRevenue) * 100, 3);

                return (
                  <div
                    key={item.date}
                    className="flex h-full min-w-0 flex-1 flex-col justify-end"
                  >
                    <div className="flex min-h-0 flex-1 items-end">
                      <div
                        className="group relative w-full rounded-t-md bg-black transition-all duration-300 hover:bg-black/75"
                        style={{
                          height: `${height}%`,
                        }}
                        title={`${item.label}: ${formatCurrency(revenue)}`}
                      >
                        {revenue > 0 && (
                          <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black px-2 py-1 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                            {formatCurrency(revenue)}
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="truncate pb-3 pt-3 text-center text-[9px] text-black/35">
                      {item.label}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8">
              <p className="mb-2 text-xs font-medium text-black/50">
                Daily orders
              </p>

              <div className="flex h-28 items-end gap-1 border-b border-black/8 sm:gap-2">
                {trend.map((item) => {
                  const orders = Number(item.orders) || 0;

                  const height =
                    orders === 0 ? 0 : Math.max((orders / maxOrders) * 100, 4);

                  return (
                    <div
                      key={item.date}
                      className="flex h-full min-w-0 flex-1 items-end"
                      title={`${item.label}: ${orders} orders`}
                    >
                      <div
                        className="w-full rounded-t-sm bg-black/25 transition-all duration-300 hover:bg-black/40"
                        style={{
                          height: `${height}%`,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Order Status"
        description="Order distribution for this period"
      >
        {loading ? (
          <div className="flex h-80 items-center justify-center">
            <p className="text-xs text-black/30">Loading order status...</p>
          </div>
        ) : totalOrders === 0 ? (
          <div className="flex h-80 items-center justify-center">
            <p className="text-xs text-black/35">No orders in this period.</p>
          </div>
        ) : (
          <div className="divide-y divide-black/8">
            {statusBreakdown.map((status) => {
              const Icon = STATUS_ICONS[status.key] || Clock3;

              const percentage =
                totalOrders > 0
                  ? Math.round((status.count / totalOrders) * 100)
                  : 0;

              return (
                <div key={status.key} className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/5">
                      <Icon size={15} strokeWidth={1.7} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">{status.label}</p>

                        <p className="text-xs text-black/45">{status.count}</p>
                      </div>

                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/5">
                        <div
                          className="h-full rounded-full bg-black transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export default SalesAnalytics;
