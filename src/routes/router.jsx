import React from "react";
import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Home from "../pages/home/Home";
import NotFound from "../pages/NotFound";
import ProductDetail from "../pages/product/ProductDetail";
import AdminLayout from "../pages/admin/layouts/AdminLayout";
import AdminDashboard from "../pages/admin/dashboard/AdminDashboard";
import CategoriesPage from "../pages/admin/categories/CategoriesPage";
import ProductsPage from "../pages/admin/products/ProductsPage";
import HomePage from "../pages/admin/home/HomePage";
import AdminOrderDetailPage from "../pages/admin/orders/OrderDetailPage";
import AdminOrdersPage from "../pages/admin/orders/OrdersPage";
import CustomersPage from "../pages/admin/customers/CustomersPage";
import CustomerDetailPage from "../pages/admin/customers/CustomerDetailPage";
import AnalyticsPage from "../pages/admin/analytics/AnalyticsPage";
import ProtectedAdminRoute from "./ProtectedAdminRoute";
import AdminLogin from "../pages/admin/AdminLogin";
import RoleProtectedRoute from "./RoleProtectedRoute";
import CategoryPage from "../pages/catalog/CategoryPage";
import CartPage from "../pages/cart/CartPage";
import CheckoutPage from "../pages/checkout/CheckoutPage";
import LoginPage from "../pages/account/LoginPage";
import RegisterPage from "../pages/account/RegisterPage";
import AccountPage from "../pages/account/AccountPage";
import ProfilePage from "../pages/account/ProfilePage";
import AddressesPage from "../pages/account/AddressesPage";
import OrdersPage from "../pages/account/OrdersPage";
import OrderDetailPage from "../pages/account/OrderDetailPage";
import ReturnRequestPage from "../pages/account/ReturnRequestPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Home /> },
      { path: "*", element: <NotFound /> },
      { path: "all-products/*", element: <CategoryPage /> },
      { path: "women/*", element: <CategoryPage /> },
      { path: "men/*", element: <CategoryPage /> },
      { path: "products/:slug", element: <ProductDetail /> },
      { path: "cart", element: <CartPage /> },
      { path: "checkout", element: <CheckoutPage /> },
      { path: "account/login", element: <LoginPage /> },
      { path: "account/register", element: <RegisterPage /> },
      { path: "account", element: <AccountPage /> },
      { path: "account/profile", element: <ProfilePage /> },
      { path: "account/addresses", element: <AddressesPage /> },
      { path: "account/orders", element: <OrdersPage /> },
      { path: "account/orders/:orderId", element: <OrderDetailPage /> },
      { path: "account/orders/:orderId/return", element: <ReturnRequestPage /> },
    ],
  },
  {
    path: "/admin",
    errorElement: <NotFound />,
    children: [
      { path: "login", element: <AdminLogin /> },
      {
        element: <ProtectedAdminRoute />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminDashboard /> },
              {
                element: <RoleProtectedRoute area="orders" />,
                children: [
                  { path: "orders", element: <AdminOrdersPage /> },
                  { path: "orders/:orderId", element: <AdminOrderDetailPage /> },
                ],
              },
              {
                element: <RoleProtectedRoute area="customers" />,
                children: [
                  { path: "customers", element: <CustomersPage /> },
                  { path: "customers/:customerId", element: <CustomerDetailPage /> },
                ],
              },
              {
                element: <RoleProtectedRoute area="products" />,
                children: [{ path: "products", element: <ProductsPage /> }],
              },
              {
                element: <RoleProtectedRoute area="categories" />,
                children: [{ path: "categories", element: <CategoriesPage /> }],
              },
              {
                element: <RoleProtectedRoute area="homepage" />,
                children: [{ path: "homepage", element: <HomePage /> }],
              },
              {
                element: <RoleProtectedRoute area="analytics" />,
                children: [{ path: "analytics", element: <AnalyticsPage /> }],
              },
            ],
          },
        ],
      },
    ],
  },
]);

export default router;
