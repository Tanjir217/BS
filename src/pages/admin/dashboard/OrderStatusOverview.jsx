import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, PackageCheck, XCircle } from "lucide-react";

import SectionCard from "../components/SectionCard";
import {
  getOrderStatusOverview,
} from "../../../services/dashboardServices";

const STATUS_CONFIG = {
  pending: {
    icon: Clock3,
  },
  confirmed: {
    icon: CheckCircle2,
  },
  processing: {
    icon: PackageCheck,
  },
  shipped: {
    icon: PackageCheck,
  },
  delivered: {
    icon: CheckCircle2,
  },
  cancelled: {
    icon: XCircle,
  },
};

function OrderStatusOverview() {
  const [statuses, setStatuses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOrderStatuses() {
    try {
      setLoading(true);
      setError("");

      const data =
        await getOrderStatusOverview();

      setStatuses(data);
    } catch (err) {
      console.error(
        "Failed to load order status overview:",
        err
      );

      setError(
        err?.message ||
          "Failed to load order status overview."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrderStatuses();
  }, []);

  const totalOrders = statuses.reduce(
    (total, status) =>
      total + Number(status.count || 0),
    0
  );

  return (
    <SectionCard
      title="Order Status"
      description="Current order distribution"
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
                onClick={loadOrderStatuses}
                className="shrink-0 text-xs font-medium text-red-700 underline"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      ) : loading ? (
        <div className="divide-y divide-black/8">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 px-5 py-3.5"
            >
              <div className="h-8 w-8 animate-pulse rounded-lg bg-black/5" />

              <div className="h-3 w-20 animate-pulse rounded bg-black/5" />

              <div className="ml-auto h-3 w-8 animate-pulse rounded bg-black/5" />
            </div>
          ))}
        </div>
      ) : totalOrders === 0 ? (
        <div className="flex min-h-40 items-center justify-center px-5">
          <p className="text-xs text-black/35">
            No orders yet.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-black/8">
          {statuses.map((status) => {
            const Icon =
              STATUS_CONFIG[status.key]?.icon ||
              Clock3;

            const percentage =
              totalOrders > 0
                ? Math.round(
                    (status.count /
                      totalOrders) *
                      100
                  )
                : 0;

            return (
              <div
                key={status.key}
                className="flex items-center gap-3 px-5 py-3.5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/5">
                  <Icon
                    size={15}
                    strokeWidth={1.7}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">
                      {status.label}
                    </p>

                    <p className="text-xs text-black/45">
                      {status.count}
                    </p>
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
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

export default OrderStatusOverview;