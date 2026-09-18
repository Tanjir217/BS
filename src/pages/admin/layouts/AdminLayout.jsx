import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

function AdminLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#171717]">
      <div className="flex min-h-screen">
        <AdminSidebar
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />

        <div className="min-w-0 flex-1">
          <AdminHeader onMenuOpen={() => setMobileNavOpen(true)} />

          <main className="px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
