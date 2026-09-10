import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";

const navigation = [
  {
    label: "Dashboard",
    to: "/admin",
    icon: LayoutDashboard,
    area: "dashboard",
  },
  {
    label: "Orders",
    to: "/admin/orders",
    icon: ShoppingBag,
    area: "orders",
  },
  {
    label: "Products",
    to: "/admin/products",
    icon: Package,
    area: "products",
  },
  {
    label: "Categories",
    to: "/admin/categories",
    icon: Tags,
    area: "categories",
  },
  {
    label: "Homepage",
    to: "/admin/homepage",
    icon: Home,
    area: "homepage",
  },
  {
    label: "Customers",
    to: "/admin/customers",
    icon: Users,
    area: "customers",
  },
  {
    label: "Analytics",
    to: "/admin/analytics",
    icon: BarChart3,
    area: "analytics",
  },
];
function AdminSidebar() {
  const navigate = useNavigate();
  const { signOut, canAccess } = useAuth();

  async function handleSignOut() {
    await signOut();
    navigate("/admin/login", { replace: true });
  }
  return (
    <aside className="hidden w-64 shrink-0 border-r border-black/8 bg-white lg:block">
      <div className="sticky top-0 flex h-screen flex-col">
        {/* Brand */}
        <div className="flex h-20 items-center border-b border-black/8 px-6">
          <div>
            <p className="text-lg font-semibold tracking-[0.18em]">BAYZID</p>

            <p className="text-[10px] tracking-[0.35em] text-black/45">
              SHOES ADMIN
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/35">
            Management
          </p>

          <div className="space-y-1">
            {navigation
            .filter((item) => canAccess(item.area))
            .map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/admin"}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                      isActive
                        ? "bg-black text-white"
                        : "text-black/60 hover:bg-black/5 hover:text-black",
                    ].join(" ")
                  }
                >
                  <Icon size={17} strokeWidth={1.8} />

                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          <p className="mb-3 mt-10 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/35">
            System
          </p>

        </nav>

        {/* Bottom */}
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
  );
}

export default AdminSidebar;
