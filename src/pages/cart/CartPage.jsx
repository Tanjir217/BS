import { Link } from "react-router-dom";

import CartItem from "../../components/cart/CartItem";
import { useCart } from "../../context/CartContext";

function formatPrice(value) {
  return Number(value || 0).toLocaleString(
    "en-BD",
    {
      maximumFractionDigits: 0,
    },
  );
}

function CartPage() {
  const {
    items,
    itemCount,
    subtotal,
    clearCart,
  } = useCart();

  if (items.length === 0) {
    return (
      <main className="cart-page">
        <div className="cart-page__empty">
          <p className="cart-page__eyebrow">
            Shopping Bag
          </p>

          <h1>
            Your bag is empty
          </h1>

          <p>
            Discover the latest
            collection and find
            something worth taking
            home.
          </p>

          <Link
            to="/all-products"
            className="cart-page__continue"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <header className="cart-page__header">
        <div>
          <p className="cart-page__eyebrow">
            Shopping Bag
          </p>

          <h1>
            Your Bag
          </h1>
        </div>

        <span>
          {itemCount}{" "}
          {itemCount === 1
            ? "item"
            : "items"}
        </span>
      </header>

      <div className="cart-page__layout">
        <section className="cart-page__items">
          {items.map(
            (item) => (
              <CartItem
                key={
                  item.productId
                }
                item={item}
              />
            ),
          )}

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
            <span>
              Summary
            </span>
          </div>

          <div className="cart-summary__row">
            <span>
              Subtotal
            </span>

            <strong>
              ৳
              {formatPrice(
                subtotal,
              )}
            </strong>
          </div>

          <div className="cart-summary__row">
            <span>
              Delivery
            </span>

            <span>
              Calculated at
              checkout
            </span>
          </div>

          <div className="cart-summary__total">
            <span>
              Total
            </span>

            <strong>
              ৳
              {formatPrice(
                subtotal,
              )}
            </strong>
          </div>

          <button
            type="button"
            className="cart-summary__checkout"
            disabled
          >
            Checkout
          </button>

          <p className="cart-summary__note">
            Checkout will be
            connected in the next
            commerce section.
          </p>

          <Link
            to="/all-products"
            className="cart-summary__continue"
          >
            Continue Shopping
          </Link>
        </aside>
      </div>
    </main>
  );
}

export default CartPage;