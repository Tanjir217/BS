import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
} from "react-router-dom";

import {
  getCategories,
} from "../../services/categoryServices";

import {
  getProductsByCategoryIds,
} from "../../services/productServices";

import {
  buildCategoryTree,
  findCategoryByPath,
  getDescendantCategoryIds,
} from "../../utils/categoryTree";

import ProductGrid from "../../components/product/ProductGrid";

function CategoryPage() {
  const location = useLocation();

  const [category, setCategory] =
    useState(null);

  const [products, setProducts] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isProductsLoading, setIsProductsLoading] =
    useState(false);

  const [error, setError] =
    useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCategory() {
      try {
        setIsLoading(true);
        setError(null);

        const categories =
          await getCategories();

        const tree =
          buildCategoryTree(
            categories
          );

        const segments =
          location.pathname
            .split("/")
            .filter(Boolean);

        const slugs =
          segments[0] ===
          "all-products"
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

        setCategory(
          resolvedCategory
        );

        /*
         * Get the selected category plus
         * every descendant category.
         */
        const categoryIds =
          getDescendantCategoryIds(
            resolvedCategory
          );

        setIsProductsLoading(true);

        const productResponse =
          await getProductsByCategoryIds(
            categoryIds
          );

        if (!isMounted) {
          return;
        }

        setProducts(
          productResponse.products
        );
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
          setIsProductsLoading(false);
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
      {/* Header */}
      <header className="max-w-3xl">
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
      </header>

      {/* Child categories */}
      {category.children.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xs uppercase tracking-[0.18em] text-black/40">
            Explore
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {category.children.map(
              (child) => (
                <Link
                  key={child.$id}
                  to={`/all-products/${[
                    ...location.pathname
                      .split("/")
                      .filter(Boolean)
                      .filter(
                        (segment) =>
                          segment !==
                          "all-products"
                      ),
                    child.slug,
                  ].join("/")}`}
                  className="group border border-black/10 p-5 no-underline transition hover:border-black"
                >
                  {child.imageUrl && (
                    <img
                      src={
                        child.imageUrl
                      }
                      alt={child.name}
                      loading="lazy"
                      className="aspect-[4/5] w-full object-cover"
                    />
                  )}

                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-black">
                      {child.name}
                    </h3>

                    {child.description && (
                      <p className="mt-2 text-xs leading-5 text-black/50">
                        {
                          child.description
                        }
                      </p>
                    )}
                  </div>
                </Link>
              )
            )}
          </div>
        </section>
      )}

      {/* Products */}
      <section className="mt-16 border-t border-black/10 pt-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-black/40">
              Shop
            </p>

            <h2 className="mt-2 text-2xl font-medium">
              {category.name}
            </h2>
          </div>

          {!isProductsLoading &&
            products.length > 0 && (
              <p className="text-xs text-black/40">
                {products.length} products
              </p>
            )}
        </div>

        <ProductGrid
          products={products}
          isLoading={
            isProductsLoading
          }
        />
      </section>
    </main>
  );
}

export default CategoryPage;