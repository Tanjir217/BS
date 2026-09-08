import { useEffect, useState } from "react";

import CustomDropdown from "../components/CustomDropdown";
import SectionCard from "../components/SectionCard";

import AnalyticsMetricCard from "../components/AnalyticsMetricCard";

import {
  getAnalyticsOverview,
} from "../../../services/analyticsServices";

const RANGE_OPTIONS = [
  {
    label: "Last 7 days",
    value: 7,
  },
  {
    label: "Last 30 days",
    value: 30,
  },
  {
    label: "Last 90 days",
    value: 90,
  },
];

function formatCurrency(value) {
  return `৳${Number(value || 0).toLocaleString(
    "en-BD"
  )}`;
}

function AnalyticsPage() {
  const [range, setRange] = useState(30);

  const [data, setData] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadAnalytics(
    selectedRange = range
  ) {
    try {
      setLoading(true);
      setError("");

      const result =
        await getAnalyticsOverview(
          selectedRange
        );

      setData(result);
    } catch (err) {
      console.error(
        "Failed to load analytics:",
        err
      );

      setError(
        err?.message ||
          "Failed to load analytics."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics(range);
  }, [range]);

  const metrics =
    data?.metrics;

  const revenueTrend =
    data?.revenueTrend || [];

  const maxRevenue = Math.max(
    ...revenueTrend.map(
      (item) =>
        Number(item.value) || 0
    ),
    1
  );

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/40">
            Insights
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Analytics
          </h1>

          <p className="mt-2 max-w-xl text-sm text-black/45">
            Understand your store performance,
            sales trends, and order activity.
          </p>
        </div>

        <CustomDropdown
          value={range}
          onChange={setRange}
          options={RANGE_OPTIONS}
          className="w-36"
          menuClassName="w-44"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                loadAnalytics(range)
              }
              className="shrink-0 text-xs font-medium text-red-700 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {loading ? (
          <>
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-xl bg-black/5"
              />
            ))}
          </>
        ) : (
          <>
            <AnalyticsMetricCard
              label="Revenue"
              value={formatCurrency(
                metrics?.revenue
              )}
              change={
                metrics?.revenueChange
              }
            />

            <AnalyticsMetricCard
              label="Orders"
              value={Number(
                metrics?.orders || 0
              ).toLocaleString(
                "en-BD"
              )}
              change={
                metrics?.ordersChange
              }
            />

            <AnalyticsMetricCard
              label="Average Order Value"
              value={formatCurrency(
                metrics?.averageOrderValue
              )}
              change={
                metrics?.averageOrderValueChange
              }
            />
          </>
        )}
      </div>

      {/* Revenue trend */}
      <SectionCard
        title="Revenue Trend"
        description={`Revenue over the last ${range} days`}
      >
        <div className="p-5">
          {loading ? (
            <div className="flex h-72 items-center justify-center">
              <p className="text-xs text-black/30">
                Loading revenue trend...
              </p>
            </div>
          ) : revenueTrend.length ===
            0 ? (
            <div className="flex h-72 items-center justify-center">
              <p className="text-xs text-black/35">
                No revenue data available.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <p className="text-xs text-black/40">
                  Total revenue
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {formatCurrency(
                    metrics?.revenue
                  )}
                </p>
              </div>

              <div className="flex h-72 items-end gap-1 border-b border-black/8 sm:gap-2">
                {revenueTrend.map(
                  (item) => {
                    const value =
                      Number(
                        item.value
                      ) || 0;

                    const height =
                      value === 0
                        ? 0
                        : Math.max(
                            (value /
                              maxRevenue) *
                              100,
                            3
                          );

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
                            title={`${item.label}: ${formatCurrency(value)}`}
                          >
                            {value > 0 && (
                              <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black px-2 py-1 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                                {formatCurrency(
                                  value
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="truncate pb-3 pt-3 text-center text-[9px] text-black/35">
                          {item.label}
                        </p>
                      </div>
                    );
                  }
                )}
              </div>
            </>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

export default AnalyticsPage;