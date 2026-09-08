import { useEffect, useState } from "react";
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
} from "lucide-react";

import StatCard from "../components/StatCard";
import { getDashboardStats } from "../../../services/dashboardServices";

function formatCurrency(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD")}`;
}

function formatPercentage(value) {
  const number = Number(value || 0);

  if (number > 0) {
    return `+${number.toFixed(1)}%`;
  }

  return `${number.toFixed(1)}%`;
}

export default function DashboardStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadStats() {
    try {
      setLoading(true);
      setError("");

      const data = await getDashboardStats();

      setStats(data);
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);

      setError(
        err?.message ||
          "Failed to load dashboard statistics."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-32 animate-pulse rounded-xl bg-gray-100"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={loadStats}
            className="text-sm font-medium text-red-700 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Sales"
        value={formatCurrency(stats?.totalSales)}
        change={formatPercentage(
          stats?.monthRevenueChange
        )}
        icon={DollarSign}
      />

      <StatCard
        title="Today's Sales"
        value={formatCurrency(stats?.todaySales)}
        change={formatPercentage(
          stats?.todayRevenueChange
        )}
        icon={TrendingUp}
      />

      <StatCard
        title="Orders This Month"
        value={Number(
          stats?.orders || 0
        ).toLocaleString("en-BD")}
        icon={ShoppingCart}
      />

      <StatCard
        title="Active Products"
        value={Number(
          stats?.activeProducts || 0
        ).toLocaleString("en-BD")}
        icon={Package}
      />
    </div>
  );
}