import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tags,
  Home,
  Users,
  BarChart3,
  LogOut,
  RefreshCcw,
  X,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard, area: "dashboard" },
  { label: "Orders", to: "/admin/orders", icon: ShoppingBag, area: "orders" },
  { label: "Returns", to: "/admin/returns", icon: RefreshCcw, area: "orders" },
  { label: "Products", to: "/admin/products", icon: Package, area: "products" },
  { label: "Categories", to: "/admin/categories", icon: Tags, area: "categories" },
  { label: "Homepage", to: "/admin/homepage", icon: Home, area: "homepage" },
  { label: "Customers", to: "/admin/customers", icon: Users, area: "customers" },
  { label: "Analytics", to: "/admin/analytics", icon: BarChart3, area: "analytics" },
];

function AdminSidebar({ mobileOpen = false, onClose }) {
  const navigate = useNavigate();
  const { signOut, canAccess } = useAuth();

  async function handleSignOut() {
    await signOut();
    onClose?.();
    navigate("/admin/login", { replace: true });
  }

  const visibleNavigation = navigation.filter((item) => canAccess(item.area));

  function renderNavigation({ mobile = false } = {}) {
    return visibleNavigation.map((item) => {
      const Icon = item.icon;

      return (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/admin"}
          onClick={mobile ? onClose : undefined}
          className={({ isActive }) => [
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
            isActive
              ? "bg-black text-white"
              : "text-black/60 hover:bg-black/5 hover:text-black",
          ].join(" ")}
        >
          <Icon size={17} strokeWidth={1.8} />
          <span>{item.label}</span>
        </NavLink>
      );
    });
  }

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-black/8 bg-white lg:block">
        <div className="sticky top-0 flex h-screen flex-col">
          <div className="flex h-20 items-center border-b border-black/8 px-6">
            <div>
              <p className="text-lg font-semibold tracking-[0.18em]">BAYZID</p>
              <p className="text-[10px] tracking-[0.35em] text-black/45">SHOES ADMIN</p>
            </div>
          </div>

          <nav className="flex-1 px-3 py-6">
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/35">
              Management
            </p>
            <div className="space-y-1">{renderNavigation()}</div>
          </nav>

          <div className="border-t border-black/8 p-4">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-black/55 transition hover:bg-black/5 hover:text-black"
            >
              <LogOut size={17} strokeWidth={1.8} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/45 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-60 flex w-[86%] max-w-80 flex-col bg-white shadow-2xl transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        aria-hidden={!mobileOpen}
      >
        <div className="flex h-20 items-center justify-between border-b border-black/8 px-5">
          <div>
            <p className="text-lg font-semibold tracking-[0.18em]">BAYZID</p>
            <p className="text-[10px] tracking-[0.35em] text-black/45">SHOES ADMIN</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/8 text-black/55 hover:bg-black/5 hover:text-black"
            aria-label="Close management navigation"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-6">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/35">
            Management
          </p>
          <div className="space-y-1">{renderNavigation({ mobile: true })}</div>
        </nav>

        <div className="border-t border-black/8 p-4">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-black/55 transition hover:bg-black/5 hover:text-black"
          >
            <LogOut size={17} strokeWidth={1.8} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
