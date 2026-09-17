import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import CartItem from "../../components/cart/CartItem";
import { useCart } from "../../context/CartContext";

function formatPrice(value) {
  return Number(value || 0).toLocaleString("en-BD", {
    maximumFractionDigits: 0,
  });
}

function CartPage() {
  const navigate = useNavigate();

  const {
    items,
    itemCount,
    subtotal,
    clearCart,
    validateCart,
    isValidating,
    hasUnavailableItems,
    hasCartChanges,
  } = useCart();

  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    validateCart();
    // Cart validation intentionally runs when the cart page mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items.length === 0) {
    return (
      <main className="cart-page">
        <div className="cart-page__empty">
          <p className="cart-page__eyebrow">Shopping Bag</p>

          <h1>Your bag is empty</h1>

          <p>
            Discover the latest collection and find something worth taking home.
          </p>

          <Link to="/all-products" className="cart-page__continue">
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  const checkoutDisabled =
    isValidating || hasUnavailableItems || hasCartChanges;

  function handleCheckout() {
    if (checkoutDisabled) {
      return;
    }

    navigate("/checkout");
  }

  return (
    <main className="cart-page">
      <header className="cart-page__header">
        <div>
          <p className="cart-page__eyebrow">Shopping Bag</p>

          <h1>Your Bag</h1>
        </div>

        <span>
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
      </header>

      <div className="cart-page__layout">
        <section className="cart-page__items">
          {items.map((item) => (
            <CartItem key={item.productId} item={item} />
          ))}

          <button
            type="button"
            className="cart-page__clear"
            onClick={clearCart}
          >
            Clear Bag
          </button>
        </section>

        <aside className="cart-summary">
          <div className="cart-summary__heading">
            <span>Summary</span>
          </div>

          <div className="cart-summary__row">
            <span>Subtotal</span>

            <strong>৳{formatPrice(subtotal)}</strong>
          </div>

          <div className="cart-summary__row">
            <span>Delivery</span>

            <span>Calculated at checkout</span>
          </div>

          <div className="cart-summary__total">
            <span>Total</span>

            <strong>৳{formatPrice(subtotal)}</strong>
          </div>

          <button
            type="button"
            className="cart-summary__checkout"
            onClick={handleCheckout}
            disabled={checkoutDisabled}
          >
            {isValidating ? "Checking bag..." : "Checkout"}
          </button>

          <p className="cart-summary__note">
            Cash on Delivery is currently available at checkout. Online payment
            will be added with the production payment integration.
          </p>

          <Link to="/all-products" className="cart-summary__continue">
            Continue Shopping
          </Link>
        </aside>
      </div>
    </main>
  );
}

export default CartPage;
