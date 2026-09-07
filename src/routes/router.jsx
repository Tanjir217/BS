import React from "react";
import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Home from "../pages/home/Home";
import NotFound from "../pages/NotFound";
import ProductDetail from "../pages/product/ProductDetail";
import AdminLayout from "../pages/admin/layouts/AdminLayout";
import AdminDashboard from "../pages/admin/dashboard/AdminDashboard"
import CategoriesPage from "../pages/admin/categories/CategoriesPage";
import ProductsPage from "../pages/admin/products/ProductsPage";
import HomePage from "../pages/admin/home/HomePage"
import OrderDetailPage from "../pages/admin/orders/OrderDetailPage";
import OrdersPage from "../pages/admin/orders/OrdersPage";
import CustomersPage from "../pages/admin/customers/CustomersPage";
const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
      {
        path: "products/:slug",
        element: <ProductDetail />,
      },
    ],
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <AdminDashboard />,
      },
      {
        path: "categories",
        element: <CategoriesPage />,
      },
      {
        path: "products",
        element: <ProductsPage />,
      },
      {
        path: "homepage",
        element: <HomePage />,
      },
      {
        path: "orders",
        element: <OrdersPage />,
      },
      {
        path: "orders/:orderId",
        element: <OrderDetailPage />,
      },
      {
        path: "customers",
        element: <CustomersPage />,
      },
    ],
  }
]);

export default router;
