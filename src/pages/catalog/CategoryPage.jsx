import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
} from "react-router-dom";

import { getCategories } from "../../services/categoryServices";

import {
  buildCategoryTree,
  findCategoryByPath,
} from "../../utils/categoryTree";

function CategoryPage() {
  const location = useLocation();

  const [category, setCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCategory() {
      try {
        setIsLoading(true);
        setError(null);

        const categories =
          await getCategories();

        const tree =
          buildCategoryTree(categories);

        const segments = location.pathname
          .split("/")
          .filter(Boolean);

        /*
         * Supports both:
         *
         * /all-products/women/shoes
         *
         * and the current legacy navigation:
         *
         * /women/shoes
         */
        const slugs =
          segments[0] === "all-products"
            ? segments.slice(1)
            : segments;

        const resolvedCategory =
          findCategoryByPath(
            tree,
            slugs
          );

        if (!isMounted) {
          return;
        }

        if (!resolvedCategory) {
          setCategory(null);
          setError(
            "Category could not be found."
          );
          return;
        }

        setCategory(resolvedCategory);
      } catch (loadError) {
        console.error(
          "Failed to load category:",
          loadError
        );

        if (isMounted) {
          setError(
            "Unable to load this category."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCategory();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-360 px-6 py-16 md:px-10">
        <p className="text-sm text-black/50">
          Loading category...
        </p>
      </main>
    );
  }

  if (error || !category) {
    return (
      <main className="mx-auto max-w-360 px-6 py-16 md:px-10">
        <p className="text-xs uppercase tracking-[0.18em] text-black/40">
          Catalog
        </p>

        <h1 className="mt-3 text-3xl font-medium">
          Category not found
        </h1>

        <p className="mt-3 text-sm text-black/50">
          {error}
        </p>

        <Link
          to="/"
          className="mt-8 inline-block border-b border-black pb-1 text-sm no-underline"
        >
          Back to home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-360 px-6 py-12 md:px-10 md:py-16">
      <div className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.18em] text-black/40">
          Catalog
        </p>

        <h1 className="mt-3 text-4xl font-medium tracking-tight">
          {category.name}
        </h1>

        {category.description && (
          <p className="mt-4 max-w-2xl text-sm leading-6 text-black/55">
            {category.description}
          </p>
        )}
      </div>

      {category.children.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xs uppercase tracking-[0.18em] text-black/40">
            Explore
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {category.children.map(
              (child) => {
                const currentSegments =
                  location.pathname
                    .split("/")
                    .filter(Boolean);

                const isCanonical =
                  currentSegments[0] ===
                  "all-products";

                const currentPath =
                  isCanonical
                    ? currentSegments.slice(1)
                    : currentSegments;

                const childPath = [
                  ...currentPath,
                  child.slug,
                ];

                return (
                  <Link
                    key={child.$id}
                    to={`/all-products/${childPath.join(
                      "/"
                    )}`}
                    className="group border border-black/10 p-5 no-underline transition hover:border-black"
                  >
                    {child.imageUrl && (
                      <img
                        src={child.imageUrl}
                        alt={child.name}
                        className="aspect-[4/5] w-full object-cover"
                      />
                    )}

                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-black">
                        {child.name}
                      </h3>

                      {child.description && (
                        <p className="mt-2 text-xs leading-5 text-black/50">
                          {child.description}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              }
            )}
          </div>
        </section>
      )}

      {category.children.length === 0 && (
        <section className="mt-16 border-t border-black/10 pt-8">
          <p className="text-sm text-black/50">
            This category is ready for product
            listing.
          </p>
        </section>
      )}
    </main>
  );
}

export default CategoryPage;