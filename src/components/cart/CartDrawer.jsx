import { ArrowRight, LoaderCircle, X } from "lucide-react";
import { Link } from "react-router-dom";

import CartItem from "./CartItem";
import { useCart } from "../../context/CartContext";

function formatPrice(value) {
  return Number(value || 0).toLocaleString("en-BD", {
    maximumFractionDigits: 0,
  });
}

function CartDrawer() {
  const {
    items,
    itemCount,
    subtotal,

    isCartOpen,
    isValidating,
    validationError,

    hasUnavailableItems,
    hasCartChanges,

    closeCart,
    validateCart,
  } = useCart();

  if (!isCartOpen) {
    return null;
  }

  return (
    <div className="cart-drawer" aria-hidden={!isCartOpen}>
      <button
        type="button"
        className="cart-drawer__backdrop"
        onClick={closeCart}
        aria-label="Close shopping bag"
      />

      <aside
        className="cart-drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
      >
        <header className="cart-drawer__header">
          <div>
            <p className="cart-drawer__eyebrow">Shopping Bag</p>

            <h2>Your Bag</h2>
          </div>

          <button
            type="button"
            className="cart-drawer__close"
            onClick={closeCart}
            aria-label="Close shopping bag"
          >
            <X size={19} strokeWidth={1.4} />
          </button>
        </header>

        {isValidating && (
          <div className="cart-drawer__checking">
            <LoaderCircle size={15} className="animate-spin" />

            <span>Checking availability...</span>
          </div>
        )}

        {validationError && (
          <div className="cart-drawer__notice is-error">
            <p>{validationError}</p>

            <button type="button" onClick={validateCart}>
              Try Again
            </button>
          </div>
        )}

        {hasCartChanges && (
          <div className="cart-drawer__notice">
            <p>
              Your bag has been updated with the latest product information.
            </p>
          </div>
        )}

        {hasUnavailableItems && (
          <div className="cart-drawer__notice is-warning">
            <p>Some items in your bag are no longer available.</p>
          </div>
        )}

        <div className="cart-drawer__body">
          {items.length === 0 ? (
            <div className="cart-drawer__empty">
              <p>Your bag is currently empty.</p>

              <Link to="/all-products" onClick={closeCart}>
                Continue Shopping
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="cart-drawer__items">
              {items.map((item) => (
                <CartItem key={item.productId} item={item} />
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <footer className="cart-drawer__footer">
            <div className="cart-drawer__subtotal">
              <span>Subtotal</span>

              <strong>৳{formatPrice(subtotal)}</strong>
            </div>

            <p className="cart-drawer__delivery">
              Delivery calculated at checkout.
            </p>

            <Link
              to="/cart"
              onClick={closeCart}
              className="cart-drawer__button"
            >
              View Full Bag
              <ArrowRight size={15} />
            </Link>
          </footer>
        )}
      </aside>
    </div>
  );
}

export default CartDrawer;
