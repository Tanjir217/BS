import { useEffect, useState } from "react";

import SectionCard from "../components/SectionCard";
import CustomDropdown from "../components/CustomDropdown";

import { getSalesOverview } from "../../../services/dashboardServices";

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
  return `৳${Number(value || 0).toLocaleString("en-BD")}`;
}

function SalesOverview() {
  const [range, setRange] = useState(7);

  const [data, setData] = useState({
    revenue: 0,
    sales: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSalesOverview(selectedRange = range) {
    try {
      setLoading(true);
      setError("");

      const result = await getSalesOverview(selectedRange);

      setData(result);
    } catch (err) {
      console.error("Failed to load sales overview:", err);

      setError(err?.message || "Failed to load sales overview.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSalesOverview(range);
  }, [range]);

  const maxValue = Math.max(
    ...data.sales.map((item) => Number(item.value) || 0),
    1,
  );

  return (
    <SectionCard
      title="Sales Overview"
      description={`Revenue performance over the last ${range} days`}
      action={
        <CustomDropdown
          value={range}
          onChange={setRange}
          options={RANGE_OPTIONS}
          className="w-32"
          menuClassName="w-40"
        />
      }
    >
      <div className="p-5">
        {error ? (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-xs text-red-600">{error}</p>

            <button
              type="button"
              onClick={() => loadSalesOverview(range)}
              className="shrink-0 text-xs font-medium text-red-700 underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-end justify-between">
              <div>
                <p className="text-xs text-black/40">Revenue</p>

                <p className="mt-1 text-2xl font-semibold">
                  {loading ? "—" : formatCurrency(data.revenue)}
                </p>
              </div>
            </div>

            <div className="relative flex h-64 items-end gap-2 border-b border-black/8 sm:gap-3">
              {loading ? (
                <div className="flex h-full w-full items-center justify-center">
                  <p className="text-xs text-black/30">Loading sales...</p>
                </div>
              ) : data.sales.length === 0 ? (
                <div className="flex h-full w-full items-center justify-center">
                  <p className="text-xs text-black/30">
                    No sales data available.
                  </p>
                </div>
              ) : (
                data.sales.map((item) => {
                  const value = Number(item.value) || 0;

                  const height =
                    value === 0 ? 0 : Math.max((value / maxValue) * 100, 3);

                  return (
                    <div
                      key={item.date}
                      className="flex h-full min-w-0 flex-1 flex-col justify-end"
                    >
                      <div className="flex min-h-0 flex-1 items-end">
                        <div
                          className={[
                            "group relative w-full",
                            "rounded-t-lg bg-black",
                            "transition-all duration-300",
                            "hover:bg-black/75",
                          ].join(" ")}
                          style={{
                            height: `${height}%`,
                          }}
                          title={formatCurrency(value)}
                        >
                          {value > 0 && (
                            <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black px-2 py-1 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                              {formatCurrency(value)}
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="truncate pb-3 pt-3 text-center text-[10px] text-black/35">
                        {item.label}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </SectionCard>
  );
}

export default SalesOverview;
