import { Heart, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import ProductCard from "../components/product/ProductCard";
import { useWishlist } from "../context/WishlistContext";
import { getProductsByIds } from "../services/productServices";

function WishlistPage() {
  const { items, count, removeFromWishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadWishlist() {
      if (items.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const rows = await getProductsByIds(
          items.map((item) => item.productId),
        );

        if (isMounted) {
          setProducts(rows);
        }
      } catch (error) {
        console.error("Failed to load wishlist:", error);

        if (isMounted) {
          setProducts([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadWishlist();

    return () => {
      isMounted = false;
    };
  }, [items]);

  return (
    <main className="mx-auto max-w-[1800px] bg-[#f6f6f4] px-4 py-10 sm:px-6 md:px-8 md:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 border-b border-black/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-black/40">
              Saved for later
            </p>
            <h1 className="mt-3 font-serif text-4xl font-normal tracking-tight sm:text-5xl">
              Your wishlist.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-black/55">
              Keep the shoes you love close and come back to them whenever you
              are ready.
            </p>
          </div>

          {count > 0 && (
            <span className="text-xs uppercase tracking-[0.14em] text-black/40">
              {count} {count === 1 ? "item" : "items"}
            </span>
          )}
        </div>

        {loading ? (
          <div className="mt-10">
            <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="animate-pulse rounded-[1.75rem] bg-white p-2.5">
                  <div className="aspect-[0.92] rounded-[1.35rem] bg-black/5" />
                  <div className="mt-4 h-4 w-2/3 rounded bg-black/5" />
                  <div className="mt-2 h-3 w-1/3 rounded bg-black/5" />
                </div>
              ))}
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="mt-10 rounded-[2rem] bg-white px-6 py-20 text-center shadow-[0_18px_50px_rgba(0,0,0,0.05)]">
            <Heart className="mx-auto text-[#5a1020]" size={30} strokeWidth={1.25} />
            <h2 className="mt-5 text-2xl font-medium">Nothing saved yet.</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-black/50">
              Tap the heart on any product to save it here for later.
            </p>
            <Link
              to="/all-products"
              className="mt-7 inline-flex bg-black px-6 py-3 text-xs font-medium uppercase tracking-[0.14em] text-white no-underline transition hover:bg-[#5a1020]"
            >
              Explore products
            </Link>
          </div>
        ) : (
          <div className="mt-10">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-black/45">
                Saved products are kept on this device.
              </p>
              <span className="hidden items-center gap-2 text-xs uppercase tracking-[0.12em] text-black/35 sm:flex">
                <Heart size={13} fill="currentColor" />
                Wishlist
              </span>
            </div>

            <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {products.map((product) => (
                <div key={product.$id} className="relative min-w-0">
                  <ProductCard product={product} />
                  <button
                    type="button"
                    onClick={() => removeFromWishlist(product.$id)}
                    className="absolute right-5 top-5 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-[#5a1020] shadow-md backdrop-blur transition hover:bg-[#5a1020] hover:text-white"
                    aria-label={`Remove ${product.name} from wishlist`}
                  >
                    <Trash2 size={15} strokeWidth={1.6} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default WishlistPage;
