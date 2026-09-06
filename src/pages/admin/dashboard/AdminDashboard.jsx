import DashboardStats from "./DashboardStats";
import SalesOverview from "./SalesOverview";
import BestSellingProducts from "./BestSellingProducts";
import FavoriteProducts from "./FavoriteProducts";
import RecentOrders from "./RecentOrders";
import LowStockProducts from "./LowStockProducts";

function AdminDashboard() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      {/* Page heading */}
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/40">
          Overview
        </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Dashboard
        </h1>

        <p className="mt-2 max-w-xl text-sm text-black/45">
          Keep track of your store, sales, products, and orders
          from one place.
        </p>
      </div>

      <DashboardStats />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <SalesOverview />

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
          <BestSellingProducts />
          <FavoriteProducts />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <RecentOrders />

        <LowStockProducts />
      </div>
    </div>
  );
}

export default AdminDashboard;