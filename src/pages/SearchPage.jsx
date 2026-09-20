import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import ProductGrid from "../components/product/ProductGrid";
import { searchProducts } from "../services/productServices";

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [input, setInput] = useState(query);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(Boolean(query));
  const [error, setError] = useState("");

  useEffect(() => {
    setInput(query);
  }, [query]);

  useEffect(() => {
    let isMounted = true;

    async function runSearch() {
      const term = query.trim();

      if (!term) {
        setProducts([]);
        setLoading(false);
        setError("");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const results = await searchProducts(term);

        if (isMounted) {
          setProducts(results);
        }
      } catch (searchError) {
        console.error("Product search failed:", searchError);

        if (isMounted) {
          setProducts([]);
          setError("We could not complete that search. Please try again.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    runSearch();

    return () => {
      isMounted = false;
    };
  }, [query]);

  function handleSubmit(event) {
    event.preventDefault();

    const term = input.trim();

    if (!term) {
      setSearchParams({});
      return;
    }

    setSearchParams({ q: term });
  }

  function clearSearch() {
    setInput("");
    setSearchParams({});
  }

  return (
    <main className="mx-auto max-w-[1800px] bg-[#f6f6f4] px-4 py-10 sm:px-6 md:px-8 md:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="border-b border-black/10 pb-8">
          <p className="text-xs uppercase tracking-[0.18em] text-black/40">
            Find your pair
          </p>
          <h1 className="mt-3 font-serif text-4xl font-normal tracking-tight sm:text-5xl">
            Search.
          </h1>

          <form
            onSubmit={handleSubmit}
            className="mt-7 flex max-w-3xl items-center gap-3 rounded-full bg-white px-5 py-2 shadow-[0_10px_35px_rgba(0,0,0,0.05)] ring-1 ring-black/[0.04]"
          >
            <Search size={19} className="shrink-0 text-[#5a1020]" />
            <input
              type="search"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Search by product name, colour, SKU..."
              aria-label="Search products"
              className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-black/30"
              autoFocus
            />
            {input && (
              <button
                type="button"
                onClick={clearSearch}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-black/45 transition hover:bg-black/5 hover:text-black"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
            <button
              type="submit"
              className="shrink-0 rounded-full bg-black px-5 py-2.5 text-xs font-medium uppercase tracking-[0.12em] text-white transition hover:bg-[#5a1020]"
            >
              Search
            </button>
          </form>
        </div>

        <section className="mt-10">
          {!query.trim() ? (
            <div className="rounded-[2rem] bg-white px-6 py-20 text-center shadow-[0_18px_50px_rgba(0,0,0,0.05)]">
              <Search className="mx-auto text-[#5a1020]" size={30} strokeWidth={1.25} />
              <h2 className="mt-5 text-2xl font-medium">What are you looking for?</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-black/50">
                Search for a shoe by name, colour, SKU, or product description.
              </p>
            </div>
          ) : loading ? (
            <ProductGrid products={[]} isLoading />
          ) : error ? (
            <div className="rounded-[2rem] bg-white px-6 py-20 text-center">
              <h2 className="text-2xl font-medium">Search unavailable.</h2>
              <p className="mt-3 text-sm text-black/50">{error}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-[2rem] bg-white px-6 py-20 text-center">
              <h2 className="text-2xl font-medium">No products found.</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-black/50">
                Try a different product name, colour, SKU, or a shorter search.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-black/50">
                  Results for <strong className="font-medium text-black">“{query}”</strong>
                </p>
                <span className="text-xs uppercase tracking-[0.12em] text-black/35">
                  {products.length} {products.length === 1 ? "product" : "products"}
                </span>
              </div>
              <ProductGrid products={products} />
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default SearchPage;
