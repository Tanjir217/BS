import {
    Minus,
    Plus,
    Trash2,
  } from "lucide-react";
  import { Link } from "react-router-dom";
  
  import { useCart } from "../../context/CartContext";
  
  function formatPrice(value) {
    return Number(value || 0).toLocaleString(
      "en-BD",
      {
        maximumFractionDigits: 0,
      },
    );
  }
  
  function CartItem({
    item,
  }) {
    const {
      updateQuantity,
      removeFromCart,
    } = useCart();
  
    return (
      <article className="cart-item">
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
                aria-label="Increase quantity"
              >
                <Plus size={14} />
              </button>
            </div>
  
            <p className="cart-item__price">
              ৳
              {formatPrice(
                item.price *
                  item.quantity,
              )}
            </p>
          </div>
        </div>
      </article>
    );
  }
  
  export default CartItem;