import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import "./index.css";
import "./styles/orderExperience.css";
import "./styles/returnExperience.css";
import "./styles/ui-polish.css";
import router from "./routes/router";

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { CustomerAuthProvider } from "./context/CustomerAuthContext";
import ErrorBoundary from "./components/system/ErrorBoundary";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <CustomerAuthProvider>
          <CartProvider>
            <RouterProvider router={router} />
          </CartProvider>
        </CustomerAuthProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
