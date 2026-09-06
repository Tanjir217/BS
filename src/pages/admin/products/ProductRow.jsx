import { Pencil, Trash2, Star } from "lucide-react";
import ProductStatusBadge from "./ProductStatusBadge";

function ProductRow({ product, categories, onEdit, onDelete }) {
  const category = categories.find((item) => item.$id === product.categoryID);

  const hasDiscount =
    product.compareAtPrice && product.compareAtPrice > product.price;

  const discountPercent = hasDiscount
    ? Math.round(
        ((product.compareAtPrice - product.price) / product.compareAtPrice) *
          100,
      )
    : 0;

  function formatPrice(value) {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      maximumFractionDigits: 0,
    }).format(value ?? 0);
  }

  return (
    <tr className="border-b border-black/6 last:border-b-0">
      {/* Product */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {product.primaryImage?.url ? (
            <img
              src={product.primaryImage.url}
              alt={product.primaryImage.alt || product.name}
              className="h-11 w-11 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/5 text-xs text-black/35">
              BS
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="max-w-55 truncate font-medium">{product.name}</p>

              {product.isFeatured && (
                <Star
                  size={14}
                  fill="currentColor"
                  className="shrink-0 text-black/45"
                />
              )}
            </div>

            <p className="mt-0.5 max-w-[220px] truncate text-xs text-black/40">
              {product.slug}
            </p>
          </div>
        </div>
      </td>

      {/* SKU */}
      <td className="px-6 py-4 text-sm text-black/55">{product.sku}</td>

      {/* Category */}
      <td className="px-6 py-4 text-sm text-black/55">
        {category?.name || "Uncategorized"}
      </td>

      {/* Price */}
      <td className="px-6 py-4">
        <div className="text-sm font-medium">{formatPrice(product.price)}</div>

        {hasDiscount && (
          <div className="text-xs text-black/35 line-through">
            {formatPrice(product.compareAtPrice)}
          </div>
        )}
      </td>

      {/* Stock */}
      <td className="px-6 py-4">
        <span
          className={[
            "text-sm font-medium",
            product.stockQuantity <= 0
              ? "text-red-600"
              : product.stockQuantity <= 5
                ? "text-amber-600"
                : "text-black/60",
          ].join(" ")}
        >
          {product.stockQuantity}
        </span>
      </td>

      {/* Discount */}
      <td className="px-6 py-4 text-sm">
        {hasDiscount ? (
          <span className="font-medium text-emerald-600">
            {discountPercent}% OFF
          </span>
        ) : (
          <span className="text-black/35">—</span>
        )}
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <ProductStatusBadge isActive={product.isActive} />
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onEdit(product)}
            className="rounded-lg p-2 text-black/50 transition hover:bg-black/5 hover:text-black"
            title="Edit product"
          >
            <Pencil size={16} />
          </button>

          <button
            type="button"
            onClick={() => onDelete(product.$id)}
            className="rounded-lg p-2 text-black/50 transition hover:bg-red-50 hover:text-red-600"
            title="Delete product"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default ProductRow;
