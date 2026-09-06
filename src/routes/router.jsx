import React from "react";
import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Home from "../pages/home/Home";
import NotFound from "../pages/NotFound";
import ProductDetail from "../pages/product/ProductDetail";
import Admin from "../pages/admin/Admin";
import CategoriesPage from "../pages/admin/categories/CategoriesPage";
import ProductsPage from "../pages/admin/products/ProductsPage";
import HomePage from "../pages/admin/home/HomePage"
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
      {
        path: "admin",
        element: <Admin />,
      },
      {
        path: "/admin/categories",
        element: <CategoriesPage />,
      },
      {
        path: "/admin/products",
        element: <ProductsPage />,
      },
      {
        path : "/admin/homepage",
        element : <HomePage/>
      }
    ],
  },
]);

export default router;
