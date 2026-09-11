import { Link } from "react-router-dom";

function ProductCard({ product }) {
  const imageUrl =
    product.primaryImage?.url;

  return (
    <article className="group">
      <Link
        to={`/products/${product.slug}`}
        className="block no-underline"
      >
        <div className="aspect-[4/5] overflow-hidden bg-gray-100">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={
                product.primaryImage
                  ?.alt ||
                product.name
              }
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="grid h-full place-items-center text-xs uppercase tracking-[0.12em] text-black/30">
              No Image
            </div>
          )}
        </div>

        <div className="pt-4">
          <h3 className="text-sm font-medium text-black">
            {product.name}
          </h3>

          <div className="mt-2 flex items-center justify-between gap-4">
            <p className="text-sm text-black/65">
              {product.price}
            </p>

            {product.color && (
              <span className="text-xs text-black/40">
                {product.color}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}

export default ProductCard;