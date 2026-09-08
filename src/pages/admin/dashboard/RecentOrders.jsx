import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";

import { getRecentOrders } from "../../../services/dashboardServices";

function formatCurrency(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD")}`;
}

function formatDate(date) {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatOrderStatus(status) {
  if (!status) {
    return "Unknown";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function RecentOrders() {
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRecentOrders() {
    try {
      setLoading(true);
      setError("");

      const data = await getRecentOrders(5);

      setOrders(data);
    } catch (err) {
      console.error("Failed to load recent orders:", err);

      setError(err?.message || "Failed to load recent orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecentOrders();
  }, []);

  return (
    <SectionCard
      title="Recent Orders"
      description="Latest orders placed in your store"
    >
      {error ? (
        <div className="p-5">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-red-600">{error}</p>

              <button
                type="button"
                onClick={loadRecentOrders}
                className="shrink-0 text-xs font-medium text-red-700 underline"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      ) : loading ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-150">
            <thead>
              <tr className="border-b border-black/8 text-left">
                {["Order", "Customer", "Total", "Status", "Date"].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/35"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody>
              {[1, 2, 3, 4].map((item) => (
                <tr
                  key={item}
                  className="border-b border-black/6 last:border-0"
                >
                  <td className="px-5 py-4">
                    <div className="h-4 w-20 animate-pulse rounded bg-black/5" />
                  </td>

                  <td className="px-5 py-4">
                    <div className="h-4 w-24 animate-pulse rounded bg-black/5" />
                  </td>

                  <td className="px-5 py-4">
                    <div className="h-4 w-16 animate-pulse rounded bg-black/5" />
                  </td>

                  <td className="px-5 py-4">
                    <div className="h-5 w-16 animate-pulse rounded-full bg-black/5" />
                  </td>

                  <td className="px-5 py-4">
                    <div className="h-3 w-12 animate-pulse rounded bg-black/5" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center px-5">
          <p className="text-xs text-black/35">No orders yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-150">
            <thead>
              <tr className="border-b border-black/8 text-left">
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/35">
                  Order
                </th>

                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/35">
                  Customer
                </th>

                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/35">
                  Total
                </th>

                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/35">
                  Status
                </th>

                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/35">
                  Date
                </th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.$id}
                  className="border-b border-black/6 last:border-0 transition hover:bg-black/[0.02]"
                >
                  <td className="px-5 py-4">
                    <Link
                      to={`/admin/orders/${order.$id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      #{order.order_Number}
                    </Link>
                  </td>

                  <td className="px-5 py-4 text-sm text-black/60">
                    {order.customer_Name || "Guest customer"}
                  </td>

                  <td className="px-5 py-4 text-sm font-medium">
                    {formatCurrency(order.total)}
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge
                      status={formatOrderStatus(order.order_Status)}
                    />
                  </td>

                  <td className="px-5 py-4 text-xs text-black/40">
                    {formatDate(order.$createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

export default RecentOrders;
