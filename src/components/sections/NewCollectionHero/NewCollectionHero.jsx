import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import useAutoAdvance from "../../../hooks/useAutoAdvance";

const scenes = [[0, 1], [2], [3, 4]];

function NewCollectionHero({ products = [] }) {
  const [activeScene, setActiveScene] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const sceneProducts = scenes[activeScene]
    .map((index) => products[index])
    .filter(Boolean);

  const advance = useCallback(() => {
    setActiveScene((current) => (current + 1) % scenes.length);
  }, []);

  useAutoAdvance({
    enabled: products.length > 0,
    isPaused,
    onAdvance: advance,
    interval: 3000,
  });

  if (products.length === 0) return null;

  return (
    <section
      aria-labelledby="new-collection-title"
      className="collection-scene relative isolate min-h-136 overflow-hidden bg-white sm:min-h-160 lg:min-h-184"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <h2 id="new-collection-title" className="collection-scene__title">
        New Collection
      </h2>

      <div
        aria-live="polite"
        className={`collection-scene__stage collection-scene__stage--${activeScene + 1}`}
      >
        {sceneProducts.map((product, index) => (
          <article className="collection-scene__product" key={product.id}>
            <Link aria-label={`View ${product.name}`} to={product.href}>
              <img
                alt={product.name}
                className="h-full w-full object-contain bg-transparent"
                decoding="async"
                fetchPriority={
                  activeScene === 0 && index === 0 ? "high" : "auto"
                }
                src={product.image}
              />
            </Link>
            {/* <div className="collection-scene__details block lg:hidden">
              <p>{product.name}</p>
              <p>{product.currency}{new Intl.NumberFormat("en-US").format(product.price)}</p>
            </div> */}
          </article>
        ))}
      </div>

      <Link className="collection-scene__cta" to="/category/new-collection">
        Shop New Collections
      </Link>
      <div aria-label="Collection scenes" className="collection-scene__dots">
        {scenes.map((_, index) => (
          <button
            aria-label={`Show scene ${index + 1}`}
            aria-pressed={index === activeScene}
            className={index === activeScene ? "is-active" : ""}
            key={index}
            onClick={() => setActiveScene(index)}
            type="button"
          />
        ))}
      </div>
    </section>
  );
}

export default NewCollectionHero;
