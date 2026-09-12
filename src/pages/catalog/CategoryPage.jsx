import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getCategories } from "../../services/categoryServices";
import {
  getProductsByCategoryIds,
  getProductPriceRange,
  getProductFilterOptions,
} from "../../services/productServices";
import ProductFilters from "../../components/product/ProductFilters";
import {
  buildCategoryTree,
  findCategoryByPath,
  getDescendantCategoryIds,
} from "../../utils/categoryTree";
import ProductGrid from "../../components/product/ProductGrid";
const DEFAULT_FILTERS = {
  minPrice: "",
  maxPrice: "",
  color: "",
  availability: "all",
};
function CategoryPage() {
  
  const location = useLocation();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categoryIds, setCategoryIds] = useState([]);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState("newest");
  const [priceRange, setPriceRange] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [isPriceRangeLoading, setIsPriceRangeLoading] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    colors: [],
  });

  /*
   * Category context
   *
   * Runs only when the category URL changes.
   *
   * This is responsible for:
   * - resolving the category
   * - resolving descendant category IDs
   * - getting the database price range
   *
   * It does NOT load products.
   */
  useEffect(() => {
    let isMounted = true;

    async function loadCategoryContext() {
      try {
        setIsLoading(true);
        setError(null);

        setCategory(null);
        setCategoryIds([]);

        setProducts([]);
        setPage(1);
        setTotalPages(1);
        setTotalProducts(0);

        setPriceRange(null);
        setIsPriceRangeLoading(true);
        setFilterOptions({
          colors: [],
        });
        /*
         * A new category starts with clean filters.
         */
        setFilters(DEFAULT_FILTERS);

        const categories = await getCategories();

        const tree = buildCategoryTree(categories);

        const segments = location.pathname.split("/").filter(Boolean);

        const slugs =
          segments[0] === "all-products" ? segments.slice(1) : segments;

        const resolvedCategory = findCategoryByPath(tree, slugs);

        if (!isMounted) {
          return;
        }

        if (!resolvedCategory) {
          setCategory(null);
          setError("Category could not be found.");
          return;
        }

        const resolvedCategoryIds = getDescendantCategoryIds(resolvedCategory);

        /*
         * Price range is independent from
         * sorting and active filters.
         *
         * It is therefore fetched only once
         * for this category.
         */
        const [
          resolvedPriceRange,
          resolvedFilterOptions,
        ] = await Promise.all([
          getProductPriceRange(
            resolvedCategoryIds,
          ),
        
          getProductFilterOptions(
            resolvedCategoryIds,
          ),
        ]);
        if (!isMounted) {
          return;
        }

        setCategory(
          resolvedCategory,
        );
        
        setCategoryIds(
          resolvedCategoryIds,
        );
        
        setPriceRange(
          resolvedPriceRange,
        );
        
        setFilterOptions(
          resolvedFilterOptions,
        );
      } catch (loadError) {
        console.error("Failed to load category:", loadError);

        if (isMounted) {
          setError("Unable to load this category.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsPriceRangeLoading(false);
        }
      }
    }

    loadCategoryContext();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);
  /*
   * Product catalog query
   *
   * This runs when:
   * - category changes
   * - sort changes
   * - an applied filter changes
   *
   * Draft filter changes do NOT reach this effect.
   */
  useEffect(() => {
    if (categoryIds.length === 0) {
      return undefined;
    }

    let isMounted = true;

    async function loadProducts() {
      try {
        setIsProductsLoading(true);
        setProducts([]);
        setPage(1);
        setTotalPages(1);
        setTotalProducts(0);

        const productResponse = await getProductsByCategoryIds(categoryIds, {
          page: 1,
          limit: 24,
          sort,
          filters: {
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
            color: filters.color,
            availability: filters.availability,
          },
        });

        if (!isMounted) {
          return;
        }

        setProducts(productResponse.products);

        setPage(productResponse.page);

        setTotalPages(productResponse.totalPages);

        setTotalProducts(productResponse.total);
      } catch (loadError) {
        console.error("Failed to load products:", loadError);

        if (isMounted) {
          setError("Unable to load products.");
        }
      } finally {
        if (isMounted) {
          setIsProductsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [
    categoryIds,
    sort,
    filters.minPrice,
    filters.maxPrice,
    filters.color,
    filters.availability,
  ]);
  /*
   * Load the next page of products and append
   * them to the existing product list.
   */
  async function handleLoadMore() {
    if (isLoadingMore || page >= totalPages || categoryIds.length === 0) {
      return;
    }

    try {
      setIsLoadingMore(true);

      const nextPage = page + 1;

      const productResponse = await getProductsByCategoryIds(categoryIds, {
        page: nextPage,
        limit: 24,
        sort,
        filters,
      });

      setProducts((currentProducts) => [
        ...currentProducts,
        ...productResponse.products,
      ]);

      setPage(productResponse.page);

      setTotalPages(productResponse.totalPages);
    } catch (loadError) {
      console.error("Failed to load more products:", loadError);
    } finally {
      setIsLoadingMore(false);
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-360 px-6 py-16 md:px-10">
        <p className="text-sm text-black/50">Loading category...</p>
      </main>
    );
  }

  if (error || !category) {
    return (
      <main className="mx-auto max-w-360 px-6 py-16 md:px-10">
        <p className="text-xs uppercase tracking-[0.18em] text-black/40">
          Catalog
        </p>

        <h1 className="mt-3 text-3xl font-medium">Category not found</h1>

        <p className="mt-3 text-sm text-black/50">{error}</p>

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
            {category.children.map((child) => (
              <Link
                key={child.$id}
                to={`/all-products/${[
                  ...location.pathname
                    .split("/")
                    .filter(Boolean)
                    .filter((segment) => segment !== "all-products"),
                  child.slug,
                ].join("/")}`}
                className="group border border-black/10 p-5 no-underline transition hover:border-black"
              >
                {child.imageUrl && (
                  <img
                    src={child.imageUrl}
                    alt={child.name}
                    loading="lazy"
                    className="aspect-4/5 w-full object-cover"
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
            ))}
          </div>
        </section>
      )}

      {/* Products */}
      <section className="mt-16 border-t border-black/10 pt-10">
        <div className="mb-8 flex flex-col gap-6 border-b border-black/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-black/40">
              Shop
            </p>

            <h2 className="mt-2 text-2xl font-medium">{category.name}</h2>

            {!isProductsLoading && totalProducts > 0 && (
              <p className="mt-2 text-xs text-black/40">
                {totalProducts} products
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <label
              htmlFor="product-sort"
              className="text-xs uppercase tracking-[0.14em] text-black/40"
            >
              Sort by
            </label>

            <select
              id="product-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="min-w-44 border-0 border-b border-black/20 bg-transparent py-2 text-sm outline-none"
            >
              <option value="newest">Newest</option>

              <option value="featured">Featured</option>

              <option value="price-asc">Price: Low to High</option>

              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
        <div className="mb-8">
          <ProductFilters
            filters={filters}
            filterOptions={filterOptions}
            priceRange={priceRange}
            isPriceRangeLoading={isPriceRangeLoading}
            onApply={setFilters}
            onClear={() => setFilters(DEFAULT_FILTERS)}
          />
        </div>
        <ProductGrid products={products} isLoading={isProductsLoading} />

        {/* Load More */}
        {!isProductsLoading && products.length > 0 && page < totalPages && (
          <div className="mt-14 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="min-w-40 border border-black px-8 py-4 text-xs font-medium uppercase tracking-[0.14em] transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLoadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

export default CategoryPage;
