import { Link } from "react-router-dom";
function ShowcaseProduct({ product }) {
    if (!product) {
      return null;
    }
  
    const formattedPrice = new Intl.NumberFormat("en-US").format(
      Number(product.price || 0)
    );
  
    return (
      <article className="flex w-full max-w-md flex-col items-center text-center">
        <Link
          to={product.href || "#"}
          className="group block w-full"
        >
          <div className="flex h-80 items-center justify-center sm:h-95">
            {product.image ? (
              <img
                src={product.image}
                alt={product.alt || product.name || "Product"}
                loading="lazy"
                className="
                  max-h-full
                  max-w-full
                  object-contain
                  transition-transform
                  duration-500
                  group-hover:scale-[1.03]
                  rounded-md
                "
              />
            ) : (
              <div
                className="h-full w-full bg-neutral-100"
                aria-label="Product image unavailable"
              />
            )}
          </div>
  
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-[#1C1C1C] transition-colors hover:text-[#7A1F32]">
              {product.name}
            </h3>
  
            <p className="mt-3 text-sm text-[#7A1F32]">
              {product.currency || "৳"}
              {formattedPrice}
            </p>
          </div>
        </Link>
      </article>
    );
  }
  
  export default ShowcaseProduct;