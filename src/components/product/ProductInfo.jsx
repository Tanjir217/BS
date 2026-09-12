import { Heart, Minus, Plus } from "lucide-react";
import { useState } from "react";

import ProductAccordion from "./ProductAccordion";

function formatPrice(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "0";
  }

  return numericValue.toLocaleString("en-BD", {
    maximumFractionDigits: 0,
  });
}

function ProductInfo({ product }) {
  const [quantity, setQuantity] =
    useState(1);

  const [isWishlisted, setIsWishlisted] =
    useState(false);

  const stockQuantity =
    Number(product.stockQuantity) || 0;

  const isInStock =
    stockQuantity > 0;

  const compareAtPrice =
    product.compareAtPrice !==
      null &&
    product.compareAtPrice !==
      undefined &&
    product.compareAtPrice !== ""
      ? Number(
          product.compareAtPrice,
        )
      : null;

  const hasDiscount =
    Number.isFinite(
      compareAtPrice,
    ) &&
    compareAtPrice >
      Number(product.price);

  function increaseQuantity() {
    setQuantity((current) =>
      Math.min(
        current + 1,
        Math.max(stockQuantity, 1),
      ),
    );
  }

  function decreaseQuantity() {
    setQuantity((current) =>
      Math.max(
        1,
        current - 1,
      ),
    );
  }

  return (
    <aside className="product-info">
      {/* Product heading */}
      <div className="product-info__heading">
        <div className="product-info__title-row">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-black/40">
              {product.sku}
            </p>

            <h1 className="mt-3 text-3xl font-medium tracking-tight">
              {product.name}
            </h1>
          </div>

          <button
            className={`product-info__wishlist ${
              isWishlisted
                ? "is-active"
                : ""
            }`}
            type="button"
            onClick={() =>
              setIsWishlisted(
                (current) =>
                  !current,
              )
            }
            aria-label={
              isWishlisted
                ? "Remove from wishlist"
                : "Add to wishlist"
            }
          >
            <Heart
              size={21}
              strokeWidth={1.25}
              fill={
                isWishlisted
                  ? "currentColor"
                  : "none"
              }
            />
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <p className="text-lg font-medium">
            ৳
            {formatPrice(
              product.price,
            )}
          </p>

          {hasDiscount && (
            <p className="text-sm text-black/40 line-through">
              ৳
              {formatPrice(
                compareAtPrice,
              )}
            </p>
          )}
        </div>
      </div>

      {/* Color */}
      {product.color && (
        <div className="product-info__choice mt-8">
          <div className="product-info__choice-header">
            <span>
              Colour:{" "}
              <strong>
                {product.color}
              </strong>
            </span>
          </div>

          <div className="mt-3">
            <span
              className="inline-block h-8 w-8 rounded-full border border-black/15"
              style={{
                backgroundColor:
                  product.colorHEX ||
                  "transparent",
              }}
              aria-label={
                product.color
              }
              title={
                product.color
              }
            />
          </div>
        </div>
      )}

      {/* Stock */}
      <div className="mt-8 border-y border-black/10 py-5">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.14em] text-black/40">
            Availability
          </span>

          <span
            className={
              isInStock
                ? "text-sm"
                : "text-sm text-black/40"
            }
          >
            {isInStock
              ? "In stock"
              : "Out of stock"}
          </span>
        </div>

        {isInStock &&
          stockQuantity <= 5 && (
            <p className="mt-2 text-xs text-black/40">
              Only {stockQuantity}{" "}
              left
            </p>
          )}
      </div>

      {/* Quantity */}
      <div className="product-info__quantity mt-8">
        <span>Quantity</span>

        <div>
          <button
            type="button"
            onClick={
              decreaseQuantity
            }
            disabled={
              !isInStock ||
              quantity <= 1
            }
            aria-label="Decrease quantity"
          >
            <Minus size={15} />
          </button>

          <span aria-live="polite">
            {quantity}
          </span>

          <button
            type="button"
            onClick={
              increaseQuantity
            }
            disabled={
              !isInStock ||
              quantity >=
                stockQuantity
            }
            aria-label="Increase quantity"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* Add to bag */}
      <button
        className="product-info__add mt-5"
        type="button"
        disabled={!isInStock}
      >
        {isInStock
          ? "Add To Bag"
          : "Out Of Stock"}
      </button>

      {/* Product details */}
      <div className="product-info__accordions mt-8">
        <ProductAccordion
          title="Product Details"
          defaultOpen
        >
          <p>
            Item No.{" "}
            {product.sku}
          </p>

          {product.description && (
            <p>
              {product.description}
            </p>
          )}
        </ProductAccordion>

        <ProductAccordion
          title="Delivery & Returns"
        >
          <p>
            Delivery and return
            information will be
            connected to the
            commerce configuration
            during checkout
            implementation.
          </p>
        </ProductAccordion>
      </div>
    </aside>
  );
}

export default ProductInfo;