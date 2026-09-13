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
import CustomerDetailPage from "../pages/admin/customers/CustomerDetailPage";
import AnalyticsPage from "../pages/admin/analytics/AnalyticsPage";
import ProtectedAdminRoute from "./ProtectedAdminRoute";
import AdminLogin from "../pages/admin/AdminLogin";
import RoleProtectedRoute from "./RoleProtectedRoute";
import CategoryPage from "../pages/catalog/CategoryPage";
import CartPage from "../pages/cart/CartPage";
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
        path: "all-products/*",
        element: <CategoryPage />,
      },
      {
        path: "women/*",
        element: <CategoryPage />,
      },
      {
        path: "men/*",
        element: <CategoryPage />,
      },
      {
        path: "products/:slug",
        element: <ProductDetail />,
      },
      {
        path: "cart",
        element: <CartPage />,
      },
    ],
  },
  {
    path: "/admin",
    errorElement: <NotFound />,
    children: [
      {
        path: "login",
        element: <AdminLogin />,
      },
      {
        element: <ProtectedAdminRoute />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              {
                index: true,
                element: <AdminDashboard />,
              },
  
              {
                element: (
                  <RoleProtectedRoute area="orders" />
                ),
                children: [
                  {
                    path: "orders",
                    element: <OrdersPage />,
                  },
                  {
                    path: "orders/:orderId",
                    element: <OrderDetailPage />,
                  },
                ],
              },
  
              {
                element: (
                  <RoleProtectedRoute area="customers" />
                ),
                children: [
                  {
                    path: "customers",
                    element: <CustomersPage />,
                  },
                  {
                    path: "customers/:customerId",
                    element: <CustomerDetailPage />,
                  },
                ],
              },
  
              {
                element: (
                  <RoleProtectedRoute area="products" />
                ),
                children: [
                  {
                    path: "products",
                    element: <ProductsPage />,
                  },
                ],
              },
  
              {
                element: (
                  <RoleProtectedRoute area="categories" />
                ),
                children: [
                  {
                    path: "categories",
                    element: <CategoriesPage />,
                  },
                ],
              },
  
              {
                element: (
                  <RoleProtectedRoute area="homepage" />
                ),
                children: [
                  {
                    path: "homepage",
                    element: <HomePage />,
                  },
                ],
              },
  
              {
                element: (
                  <RoleProtectedRoute area="analytics" />
                ),
                children: [
                  {
                    path: "analytics",
                    element: <AnalyticsPage />,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  }
]);

export default router;
