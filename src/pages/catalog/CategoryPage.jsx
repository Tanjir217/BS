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
import CustomDropdown from "../../components/ui/CustomDropdown";
import { getCategoryPromotion } from "../../services/categoryPromotionServices";
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
  const [promotion, setPromotion] = useState(null);

  const promotionHref = promotion?.cta_Href || "";
  const promotionIsInternal = promotionHref.startsWith("/");

  useEffect(() => {
    let isMounted = true;

    const promotionCategoryId =
      category?.$id || "all-products";

    getCategoryPromotion(promotionCategoryId)
      .then((result) => {
        if (isMounted) {
          setPromotion(result);
        }
      })
      .catch((promotionError) => {
        console.error("Failed to load category promotion:", promotionError);
      });

    return () => {
      isMounted = false;
    };
  }, [category?.$id]);

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

        const segments = location.pathname.split("/").filter(Boolean);

        const slugs =
          segments[0] === "all-products" ? segments.slice(1) : segments;

        // Be tolerant of legacy/generated links that accidentally repeated
        // the catalog prefix, e.g. /all-products/all-products/men.
        while (slugs[0] === "all-products") {
          slugs.shift();
        }

        const isAllProducts = slugs.length === 0;

        let resolvedCategory;

        if (isAllProducts) {
          resolvedCategory = {
            $id: "all-products",
            name: "All products",
            description: "Browse every active product in the store.",
            children: [],
          };
        } else {
          const categories = await getCategories();
          const tree = buildCategoryTree(categories);
          resolvedCategory = findCategoryByPath(tree, slugs);
        }

        if (!isMounted) {
          return;
        }

        if (!resolvedCategory) {
          setCategory(null);
          setError("Category could not be found.");
          return;
        }

        const resolvedCategoryIds = isAllProducts
          ? []
          : getDescendantCategoryIds(resolvedCategory);

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
    if (!category || (!categoryIds.length && category.$id !== "all-products")) {
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

        const visibleProducts =
          category.$id === "all-products"
            ? productResponse.products
            : productResponse.products.filter((product) =>
                categoryIds.includes(product.categoryID),
              );

        setProducts(visibleProducts);

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
    if (
      isLoadingMore ||
      page >= totalPages ||
      (!categoryIds.length && category?.$id !== "all-products")
    ) {
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

      const visibleProducts =
        category?.$id === "all-products"
          ? productResponse.products
          : productResponse.products.filter((product) =>
              categoryIds.includes(product.categoryID),
            );

      setProducts((currentProducts) => [
        ...currentProducts,
        ...visibleProducts,
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
    <main className="mx-auto max-w-[1800px] bg-[#f6f6f4] px-4 py-10 sm:px-6 md:px-8 md:py-14">
      {/* Dynamic promotional banner */}
      <section className="relative overflow-hidden rounded-[2rem] bg-black text-white shadow-[0_24px_70px_rgba(0,0,0,0.12)]">
        {promotion?.imageUrl && (
          <img
            src={promotion.imageUrl}
            alt={promotion.editorial_Alt || promotion.title || "Bayzid Shoes promotion"}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/15" />

        <div className="relative flex min-h-[260px] items-end justify-between gap-8 p-7 sm:min-h-[320px] sm:p-10 lg:min-h-[390px] lg:p-14">
          <div className="max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/55">
              {category.name}
            </p>

            <h1 className="mt-3 max-w-2xl font-serif text-4xl font-normal tracking-tight sm:text-5xl lg:text-7xl">
              {promotion?.title || "Explore " + category.name + "."}
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
              {promotion?.sub_title ||
                category.description ||
                "Discover the latest Bayzid Shoes collection."}
            </p>

            {promotion?.cta_Label && promotionHref && (
              promotionIsInternal ? (
                <Link
                  to={promotionHref}
                  className="mt-7 inline-flex items-center border border-white/35 bg-white px-5 py-3 text-xs font-medium uppercase tracking-[0.14em] text-black transition hover:bg-transparent hover:text-white"
                >
                  {promotion.cta_Label}
                </Link>
              ) : (
                <a
                  href={promotionHref}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-7 inline-flex items-center border border-white/35 bg-white px-5 py-3 text-xs font-medium uppercase tracking-[0.14em] text-black transition hover:bg-transparent hover:text-white"
                >
                  {promotion.cta_Label}
                </a>
              )
            )}
          </div>

          <span className="hidden shrink-0 text-[10px] uppercase tracking-[0.2em] text-white/45 lg:block">
            Bayzid Shoes
          </span>
        </div>
      </section>

      {/* Products */}
      <section className="mt-16 border-t border-black/10 pt-10">
        <div className="mb-7 flex flex-col gap-5 pb-2 md:flex-row md:items-end md:justify-between">
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

          <div className="flex w-full items-center justify-between gap-3 sm:w-auto">
            <label className="text-xs uppercase tracking-[0.14em] text-black/40">
              Sort by
            </label>
            <CustomDropdown
              value={sort}
              onChange={setSort}
              options={[
                { value: "newest", label: "Newest" },
                { value: "featured", label: "Featured" },
                { value: "price-asc", label: "Price: Low to High" },
                { value: "price-desc", label: "Price: High to Low" },
              ]}
              className="min-w-48"
              menuClassName="min-w-52"
            />
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
