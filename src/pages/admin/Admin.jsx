import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./dashboard/AdminDashboard";

function Admin() {
  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  );
}

export default Admin;