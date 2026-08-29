import { useCallback, useState } from "react";
import useAutoAdvance from "../../../hooks/useAutoAdvance";

import ShowcaseProduct from "./ShowcaseProduct";
import ShowcaseNavigation from "./ShowcaseNavigation";
import { Link } from "react-router-dom";
import useHorizontalSwipe from "../../../hooks/useHorizontalSwipe";

function EditorialProductShowcase({
  title = "",
  subtitle = "",
  editorial = {},
  products = [],
  className,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const productCount = products.length;

  const handleNext = useCallback(() => {
    setActiveIndex((currentIndex) =>
      currentIndex === productCount - 1 ? 0 : currentIndex + 1,
    );
  }, [productCount]);

  const handlePrevious = useCallback(() => {
    setActiveIndex((currentIndex) =>
      currentIndex === 0 ? productCount - 1 : currentIndex - 1,
    );
  }, [productCount]);
  const swipeHandlers = useHorizontalSwipe({
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrevious,
  });

  useAutoAdvance({
    enabled: productCount > 1,
    isPaused,
    onAdvance: handleNext,
    interval: 3000,
  });

  if (!productCount) {
    return null;
  }

  const activeProduct = products[activeIndex];

  return (
    <section
      aria-labelledby="editorial-product-showcase-title"
      className={`grid w-full grid-cols-1 lg:grid-cols-2 ${className}`}
    >
      {/* Editorial Side */}
      <div className="relative min-h-150 overflow-hidden bg-white lg:min-h-180">
        {editorial.image && (
          <img
            src={editorial.image}
            alt={editorial.alt || ""}
            className="absolute inset-0 h-full w-full object-contain"
          />
        )}

        {editorial.cta?.label && (
          <Link
            to={editorial.cta.href || "#"}
            className="
              absolute
              bottom-8
              left-8
              z-10
              border-b
              border-black
              pb-1
              text-sm
              font-semibold
              tracking-wide
              text-black
              transition-opacity
              hover:opacity-70
            "
          >
            {editorial.cta.label}
          </Link>
        )}
      </div>

      {/* Product Side */}
      <div className="relative flex min-h-150 flex-col items-center justify-between bg-white px-8 py-12 lg:min-h-180 lg:px-16">
        {/* Heading */}
        <div className="text-center">
          <h2
            id="editorial-product-showcase-title"
            className="text-lg font-semibold"
          >
            {title}
          </h2>

          {subtitle && (
            <p className="mt-4 text-sm text-neutral-700">{subtitle}</p>
          )}
        </div>

        {/* Product */}
        <div
          {...swipeHandlers}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
        >
          <ShowcaseProduct product={activeProduct} />
        </div>

        {/* Navigation */}
        <ShowcaseNavigation
          currentIndex={activeIndex}
          total={productCount}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSelect={setActiveIndex}
        />
      </div>
    </section>
  );
}

export default EditorialProductShowcase;
