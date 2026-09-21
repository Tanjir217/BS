import {
    ShoppingCart,
  } from "lucide-react";
  import { Link } from "react-router-dom";
  
  import { useCart } from "../../../../context/CartContext";
  
  function CartButton() {
    const { itemCount } =
      useCart();
  
    return (
      <Link
        to="/cart"
        className="relative inline-flex items-center justify-center"
        aria-label={`Shopping bag${
          itemCount > 0
            ? `, ${itemCount} items`
            : ""
        }`}
      >
        <ShoppingCart
          color="#5A1020"
          size={21}
          strokeWidth={1.5}
        />
  
        {itemCount > 0 && (
          <span
            className="absolute -right-2 -top-2 grid min-h-4 min-w-4 place-items-center rounded-full bg-[#5A1020] px-1 text-[9px] leading-none text-white"
            aria-hidden="true"
          >
            {itemCount > 99
              ? "99+"
              : itemCount}
          </span>
        )}
      </Link>
    );
  }
  
  export default CartButton;