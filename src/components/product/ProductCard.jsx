import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

function formatPrice(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD", {
    maximumFractionDigits: 0,
  })}`;
}

function ProductCard({ product }) {
  const imageUrl = product.primaryImage?.url;

  return (
    <article className="group h-full">
      <Link
        to={product.href || `/products/${product.slug}`}
        className="flex h-full min-w-0 flex-col rounded-[1.75rem] bg-white p-2 sm:p-2.5 no-underline shadow-[0_10px_35px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.025] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(0,0,0,0.1)]"
      >
        <div className="relative aspect-[0.92] overflow-hidden rounded-[1.35rem] bg-[#f6f6f4]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.primaryImage?.alt || product.name}
              loading="lazy"
              className="h-full w-full object-contain p-3 sm:p-5 mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.045]"
            />
          ) : (
            <div className="grid h-full place-items-center text-xs uppercase tracking-[0.12em] text-black/30">
              No Image
            </div>
          )}

          {product.stockQuantity <= 0 && (
            <span className="absolute left-3 top-3 rounded-full bg-black/80 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-white backdrop-blur">
              Out of stock
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col px-2 pb-2 pt-3 sm:px-2.5 sm:pt-4">
          <div className="min-h-[3.2rem]">
            <h3 className="line-clamp-2 break-words text-[0.82rem] sm:text-[0.9rem] font-semibold leading-[1.15] tracking-[-0.02em] text-black">
              {product.name}
            </h3>
            {product.description && (
              <p className="mt-1 line-clamp-1 text-[0.68rem] text-black/42">
                {product.description}
              </p>
            )}
          </div>

          <div className="mt-auto flex flex-col items-stretch gap-2 pt-3 sm:flex-row sm:items-end sm:justify-between sm:gap-3 sm:pt-4">
            <div>
              <p className="text-sm font-semibold sm:text-base tracking-[-0.02em] text-black">
                {formatPrice(product.price)}
              </p>
              {product.compareAtPrice > product.price && (
                <p className="mt-0.5 text-[0.65rem] text-black/35 line-through">
                  {formatPrice(product.compareAtPrice)}
                </p>
              )}
            </div>

            <span className="inline-flex w-full min-w-0 items-center justify-center gap-1 rounded-full bg-black px-2.5 py-2 text-[0.58rem] sm:w-auto sm:shrink-0 sm:gap-1.5 sm:px-3.5 sm:text-[0.62rem] font-medium text-white transition group-hover:bg-[#5a1020]">
              Buy now
              <ArrowUpRight size={13} strokeWidth={2} />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default ProductCard;
