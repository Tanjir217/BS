import { useEffect, useState } from "react";
import {
  Crown,
  Repeat2,
  ShoppingBag,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";

import SectionCard from "../components/SectionCard";
import { getCustomerAnalytics } from "../../../services/analyticsServices";

function formatCurrency(value) {
  return `৳${Number(value || 0).toLocaleString(
    "en-BD"
  )}`;
}

function formatTier(tier) {
  if (!tier) {
    return "Regular";
  }

  return (
    tier.charAt(0).toUpperCase() +
    tier.slice(1)
  );
}

function CustomerAnalytics({
  range,
}) {
  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadCustomerAnalytics() {
    try {
      setLoading(true);
      setError("");

      const result =
        await getCustomerAnalytics(
          range
        );

      setData(result);
    } catch (err) {
      console.error(
        "Failed to load customer analytics:",
        err
      );

      setError(
        err?.message ||
          "Failed to load customer analytics."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomerAnalytics();
  }, [range]);

  const metrics =
    data?.metrics || {
      revenue: 0,
      purchasingCustomers: 0,
      newCustomers: 0,
      returningCustomers: 0,
      averageCustomerSpend: 0,
    };

  const topCustomers =
    data?.topCustomers || [];

  const tierPerformance =
    data?.tierPerformance || [];

  const maxCustomerRevenue =
    Math.max(
      ...topCustomers.map(
        (customer) =>
          Number(
            customer.revenue || 0
          )
      ),
      1
    );

  const maxTierRevenue =
    Math.max(
      ...tierPerformance.map(
        (tier) =>
          Number(
            tier.revenue || 0
          )
      ),
      1
    );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Customer Revenue"
          value={formatCurrency(
            metrics.revenue
          )}
          description="Delivered and paid orders"
          icon={TrendingUp}
        />

        <MetricCard
          label="Purchasing Customers"
          value={Number(
            metrics.purchasingCustomers ||
              0
          ).toLocaleString(
            "en-BD"
          )}
          description="Unique customers"
          icon={Users}
        />

        <MetricCard
          label="New Customers"
          value={Number(
            metrics.newCustomers ||
              0
          ).toLocaleString(
            "en-BD"
          )}
          description="Customers created in period"
          icon={UserPlus}
        />

        <MetricCard
          label="Returning Customers"
          value={Number(
            metrics.returningCustomers ||
              0
          ).toLocaleString(
            "en-BD"
          )}
          description="Customers with prior purchases"
          icon={Repeat2}
        />

        <MetricCard
          label="Average Customer Spend"
          value={formatCurrency(
            metrics.averageCustomerSpend
          )}
          description="Revenue per purchasing customer"
          icon={ShoppingBag}
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={
                loadCustomerAnalytics
              }
              className="shrink-0 text-xs font-medium text-red-700 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        {/* Top Customers */}
        <SectionCard
          title="Top Customers"
          description="Customers ranked by revenue"
        >
          {loading ? (
            <LoadingList count={6} />
          ) : topCustomers.length ===
            0 ? (
            <EmptyState
              title="No customer sales yet"
              description="There are no identified customer purchases in this period."
            />
          ) : (
            <div className="divide-y divide-black/6">
              {topCustomers.map(
                (
                  customer,
                  index
                ) => {
                  const revenue =
                    Number(
                      customer.revenue ||
                        0
                    );

                  const width =
                    maxCustomerRevenue >
                    0
                      ? (revenue /
                          maxCustomerRevenue) *
                        100
                      : 0;

                  return (
                    <div
                      key={
                        customer.customerId
                      }
                      className="px-5 py-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-black/30">
                              #
                              {index +
                                1}
                            </span>

                            <p className="truncate text-sm font-medium">
                              {
                                customer.name
                              }
                            </p>
                          </div>

                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-black/35">
                            <span>
                              {formatTier(
                                customer.tier
                              )}
                            </span>

                            {customer.email && (
                              <span className="truncate">
                                {
                                  customer.email
                                }
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold">
                            {formatCurrency(
                              revenue
                            )}
                          </p>

                          <p className="mt-1 text-xs text-black/35">
                            {Number(
                              customer.orderCount ||
                                0
                            ).toLocaleString(
                              "en-BD"
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
                }
              )}
            </div>
          )}
        </SectionCard>

        {/* Tier Performance */}
        <SectionCard
          title="Tier Performance"
          description="Customer revenue by current tier"
        >
          {loading ? (
            <LoadingList count={3} />
          ) : tierPerformance.length ===
            0 ? (
            <EmptyState
              title="No tier data yet"
              description="Tier performance will appear after identified customer purchases are recorded."
            />
          ) : (
            <div className="divide-y divide-black/6">
              {tierPerformance.map(
                (tier) => {
                  const revenue =
                    Number(
                      tier.revenue ||
                        0
                    );

                  const width =
                    maxTierRevenue >
                    0
                      ? (revenue /
                          maxTierRevenue) *
                        100
                      : 0;

                  return (
                    <div
                      key={
                        tier.tier
                      }
                      className="px-5 py-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <Crown
                              size={15}
                              strokeWidth={1.8}
                              className="text-black/35"
                            />

                            <p className="text-sm font-medium">
                              {formatTier(
                                tier.tier
                              )}
                            </p>
                          </div>

                          <p className="mt-1 text-xs text-black/35">
                            {Number(
                              tier.customerCount ||
                                0
                            ).toLocaleString(
                              "en-BD"
                            )}{" "}
                            customers ·{" "}
                            {Number(
                              tier.orderCount ||
                                0
                            ).toLocaleString(
                              "en-BD"
                            )}{" "}
                            orders
                          </p>
                        </div>

                        <p className="shrink-0 text-sm font-semibold">
                          {formatCurrency(
                            revenue
                          )}
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
                }
              )}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
}) {
  return (
    <div className="rounded-xl border border-black/8 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-black/40">
          {label}
        </p>

        <Icon
          size={17}
          strokeWidth={1.8}
          className="text-black/30"
        />
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight">
        {value}
      </p>

      <p className="mt-2 text-xs text-black/35">
        {description}
      </p>
    </div>
  );
}

function LoadingList({
  count = 5,
}) {
  return (
    <div className="space-y-4 p-5">
      {Array.from({
        length: count,
      }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse"
        >
          <div className="h-3 w-32 rounded bg-black/5" />

          <div className="mt-3 h-2 rounded bg-black/5" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  title,
  description,
}) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="text-sm font-medium">
        {title}
      </p>

      <p className="mt-1 text-xs text-black/35">
        {description}
      </p>
    </div>
  );
}

export default CustomerAnalytics;