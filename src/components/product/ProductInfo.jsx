import { Heart, Minus, Plus } from "lucide-react";
import { useState } from "react";
import ProductAccordion from "./ProductAccordion";

function ProductInfo({ product }) {
  const [selectedSize, setSelectedSize] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [quantity, setQuantity] = useState(1);

  return (
    <aside className="product-info">
      <div className="product-info__heading">
        <p className="product-info__badge">{product.badge}</p>
        <div className="product-info__title-row">
          <h1>{product.name}</h1>
          <button
            className={`product-info__wishlist ${isWishlisted ? "is-active" : ""}`}
            type="button"
            onClick={() => setIsWishlisted((current) => !current)}
            aria-label={
              isWishlisted ? "Remove from wishlist" : "Add to wishlist"
            }
          >
            <Heart
              size={21}
              strokeWidth={1.25}
              fill={isWishlisted ? "currentColor" : "none"}
            />
          </button>
        </div>
        <p className="product-info__subtitle">{product.subtitle}</p>
        <p className="product-info__price">
          {product.currency}
          {product.price.toLocaleString("en-GB")}
        </p>
      </div>

      <div className="product-info__choice">
        <div className="product-info__choice-header">
          <span>
            Colour: <strong>{product.color}</strong>
          </span>
        </div>
        <button
          className="product-info__color"
          type="button"
          aria-label={`Color: ${product.color}`}
        >
          <span style={{ backgroundColor: product.colourHex }} />
        </button>
      </div>

      <div className="product-info__choice">
        <div className="product-info__choice-header">
          <span>Size {selectedSize && <strong>IT {selectedSize}</strong>}</span>
          <button className="product-info__text-button" type="button">
            Size Guide
          </button>
        </div>
        <div
          className="product-info__sizes"
          role="list"
          aria-label="Select size"
        >
          {product.sizes.map((size) => (
            <button
              className={selectedSize === size ? "is-selected" : ""}
              key={size}
              type="button"
              onClick={() => setSelectedSize(size)}
              aria-pressed={selectedSize === size}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="product-info__quantity">
        <span>Quantity</span>
        <div>
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            aria-label="Decrease quantity"
          >
            <Minus size={15} />
          </button>
          <span aria-live="polite">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((value) => value + 1)}
            aria-label="Increase quantity"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      <button
        className="product-info__add"
        type="button"
        disabled={!selectedSize}
      >
        {selectedSize ? "Add To Bag" : "Select Size"}
      </button>
      <p className="product-info__delivery">
        Delivery estimated in 1–4 business days
        <br />
        Enjoy complimentary delivery and returns
      </p>

      <div className="product-info__accordions">
        <ProductAccordion title="Product Details" defaultOpen>
          <p>Item No. {product.sku}</p>
          <p>{product.description}</p>
          <ul>
            {product.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        </ProductAccordion>
        <ProductAccordion title="Delivery & Returns">
          <p>
            Complimentary standard delivery and returns. Your order will arrive
            in 1–4 business days.
          </p>
        </ProductAccordion>
        <ProductAccordion title="Find In Store">
          <p>
            Visit a Bayzid Shoes boutique to try this style with a personal
            advisor.
          </p>
        </ProductAccordion>
      </div>
    </aside>
  );
}

export default ProductInfo;
