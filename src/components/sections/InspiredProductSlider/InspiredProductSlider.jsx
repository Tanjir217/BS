import { useCallback, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import useAutoAdvance from "../../../hooks/useAutoAdvance";
import useHorizontalSwipe from "../../../hooks/useHorizontalSwipe";

function InspiredProductSlider({ products = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [motionDirection, setMotionDirection] = useState("next");
  const visibleCount = Math.min(products.length, 5);
  const centerSlot = Math.floor(visibleCount / 2);

  const visibleProducts = useMemo(() => {
    if (!products.length) return [];
    return Array.from({ length: visibleCount }, (_, slot) => {
      const index = (activeIndex + slot - centerSlot + products.length) % products.length;
      return products[index];
    });
  }, [activeIndex, centerSlot, products, visibleCount]);

  const move = useCallback((direction) => {
    setMotionDirection(direction > 0 ? "next" : "previous");
    setActiveIndex((current) => (current + direction + products.length) % products.length);
  }, [products.length]);

  const advance = useCallback(() => move(1), [move]);
  const swipeHandlers = useHorizontalSwipe({
    onSwipeLeft: () => move(1),
    onSwipeRight: () => move(-1),
  });

  useAutoAdvance({
    enabled: products.length > 1,
    isPaused,
    interval: 4500,
    onAdvance: advance,
  });

  if (!visibleProducts.length) return null;

  const featuredProduct = visibleProducts[centerSlot];

  return (
    <section
      aria-labelledby="inspired-products-title"
      className="inspired-slider"
      onBlurCapture={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <h2 id="inspired-products-title" className="inspired-slider__title">Get inspired</h2>
      <div className="inspired-slider__viewport" {...swipeHandlers}>
        <button aria-label="Previous products" className="inspired-slider__arrow inspired-slider__arrow--previous" onClick={() => move(-1)} type="button">
          <ChevronLeft aria-hidden="true" size={28} strokeWidth={1} />
        </button>

        <div
          aria-live="polite"
          className={`inspired-slider__track inspired-slider__track--${motionDirection}`}
          key={`${activeIndex}-${motionDirection}`}
        >
          {visibleProducts.map((product, index) => {
            const isFeatured = index === centerSlot;
            return (
              <article className={`inspired-slider__item ${isFeatured ? "is-featured" : ""}`} key={`${product.id}-${index}`}>
                <Link aria-label={`View ${product.name}`} className="inspired-slider__image" to={product.href}>
                  <img alt="" decoding="async" fetchPriority={isFeatured ? "high" : "auto"} loading={isFeatured ? "eager" : "lazy"} src={product.image} />
                </Link>
              </article>
            );
          })}
        </div>

        <button aria-label="Next products" className="inspired-slider__arrow inspired-slider__arrow--next" onClick={() => move(1)} type="button">
          <ChevronRight aria-hidden="true" size={28} strokeWidth={1} />
        </button>
      </div>

      <div className="inspired-slider__details">
        <p>{featuredProduct.name}</p>
        <p>{featuredProduct.currency}{new Intl.NumberFormat("en-US").format(featuredProduct.price)}</p>
        <Link className="inspired-slider__cta" to={featuredProduct.href}>Shop now</Link>
      </div>
    </section>
  );
}

export default InspiredProductSlider;
