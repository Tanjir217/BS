import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function RoleProtectedRoute({ area }) {
  const {
    loading,
    isAuthenticated,
    isManagementMember,
    canAccess,
  } = useAuth();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-4">
        <p className="text-sm text-black/50">
          Checking access...
        </p>
      </main>
    );
  }

  if (!isAuthenticated || !isManagementMember) {
    return (
      <Navigate
        to="/admin/login"
        replace
      />
    );
  }

  if (!canAccess(area)) {
    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }

  return <Outlet />;
}

export default RoleProtectedRoute;