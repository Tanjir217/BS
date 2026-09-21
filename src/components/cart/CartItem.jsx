import {
  AlertTriangle,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useCart } from "../../context/CartContext";

function formatPrice(value) {
  return Number(
    value || 0,
  ).toLocaleString("en-BD", {
    maximumFractionDigits: 0,
  });
}

function CartItem({
  item,
}) {
  const {
    updateQuantity,
    removeFromCart,
  } = useCart();

  const isUnavailable =
    item.validationStatus ===
      "unavailable" ||
    item.validationStatus ===
      "out-of-stock";

  const hasPriceChanged =
    item.validationStatus ===
    "price-changed";

  const hasStockReduced =
    item.validationStatus ===
    "stock-reduced";

  const maxQuantity =
    Number(item.stockQuantity) >
    0
      ? Number(
          item.stockQuantity,
        )
      : null;

  return (
    <article
      className={`cart-item ${
        isUnavailable
          ? "is-unavailable"
          : ""
      }`}
    >
      <Link
        to={`/products/${item.slug}`}
        className="cart-item__image"
      >
        {item.image?.url ? (
          <img
            src={item.image.url}
            alt={
              item.image.alt ||
              item.name
            }
          />
        ) : (
          <span>
            No Image
          </span>
        )}
      </Link>

      <div className="cart-item__content">
        <div className="cart-item__header">
          <div>
            <p className="cart-item__sku">
              {item.sku}
            </p>

            <Link
              to={`/products/${item.slug}`}
              className="cart-item__name"
            >
              {item.name}
            </Link>

            {item.color && (
              <p className="cart-item__meta">
                Colour:{" "}
                {item.color}
              </p>
            )}
          </div>

          <button
            type="button"
            className="cart-item__remove"
            onClick={() =>
              removeFromCart(
                item.productId,
              )
            }
            aria-label={`Remove ${item.name} from cart`}
          >
            <Trash2
              size={17}
              strokeWidth={1.4}
            />
          </button>
        </div>

        {hasPriceChanged && (
          <div className="cart-item__notice">
            <AlertTriangle
              size={13}
            />

            <span>
              Price updated to ৳
              {formatPrice(
                item.price,
              )}
            </span>
          </div>
        )}

        {hasStockReduced && (
          <div className="cart-item__notice">
            <AlertTriangle
              size={13}
            />

            <span>
              Quantity adjusted
              to {item.quantity}
              based on current
              stock.
            </span>
          </div>
        )}

        {item.validationStatus ===
          "out-of-stock" && (
          <div className="cart-item__notice is-error">
            <AlertTriangle
              size={13}
            />

            <span>
              Currently out of
              stock.
            </span>
          </div>
        )}

        {item.validationStatus ===
          "unavailable" && (
          <div className="cart-item__notice is-error">
            <AlertTriangle
              size={13}
            />

            <span>
              This product is no
              longer available.
            </span>
          </div>
        )}

        <div className="cart-item__bottom">
          <div className="cart-item__quantity">
            <button
              type="button"
              onClick={() =>
                updateQuantity(
                  item.productId,
                  item.quantity - 1,
                )
              }
              disabled={
                isUnavailable ||
                item.quantity <= 1
              }
              aria-label="Decrease quantity"
            >
              <Minus size={14} />
            </button>

            <span>
              {item.quantity}
            </span>

            <button
              type="button"
              onClick={() =>
                updateQuantity(
                  item.productId,
                  item.quantity + 1,
                )
              }
              disabled={
                isUnavailable ||
                (maxQuantity !==
                  null &&
                  item.quantity >=
                    maxQuantity)
              }
              aria-label="Increase quantity"
            >
              <Plus size={14} />
            </button>
          </div>

          <p className="cart-item__price">
            {isUnavailable ? (
              <span className="cart-item__unavailable-price">
                Unavailable
              </span>
            ) : (
              <>
                ৳
                {formatPrice(
                  item.price *
                    item.quantity,
                )}
              </>
            )}
          </p>
        </div>
      </div>
    </article>
  );
}

export default CartItem;