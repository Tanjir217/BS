import "../index.css";

import { Outlet } from "react-router-dom";

import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import CartDrawer from "../components/cart/CartDrawer";

function MainLayout() {
  return (
    <>
      <Header />

      <main>
        <Outlet />
      </main>

      <Footer />

      <CartDrawer />
    </>
  );
}

export default MainLayout;