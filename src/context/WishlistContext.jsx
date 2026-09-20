import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const WISHLIST_STORAGE_KEY = "bayzid-shoes-wishlist-v1";

function loadStoredWishlist() {
  try {
    const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item) =>
        item &&
        typeof item.productId === "string" &&
        item.productId.trim() !== "",
    );
  } catch (error) {
    console.error("Failed to load wishlist:", error);
    return [];
  }
}

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(loadStoredWishlist);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Failed to save wishlist:", error);
    }
  }, [items]);

  const isWishlisted = useCallback(
    (productId) => items.some((item) => item.productId === productId),
    [items],
  );

  const addToWishlist = useCallback((product) => {
    if (!product?.$id) {
      return;
    }

    setItems((currentItems) => {
      if (currentItems.some((item) => item.productId === product.$id)) {
        return currentItems;
      }

      return [
        ...currentItems,
        {
          productId: product.$id,
          slug: product.slug || "",
          addedAt: new Date().toISOString(),
        },
      ];
    });
  }, []);

  const removeFromWishlist = useCallback((productId) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.productId !== productId),
    );
  }, []);

  const toggleWishlist = useCallback(
    (product) => {
      if (!product?.$id) {
        return false;
      }

      const alreadySaved = items.some(
        (item) => item.productId === product.$id,
      );

      if (alreadySaved) {
        removeFromWishlist(product.$id);
        return false;
      }

      addToWishlist(product);
      return true;
    },
    [items, addToWishlist, removeFromWishlist],
  );

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      isWishlisted,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
    }),
    [
      items,
      isWishlisted,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
    ],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used inside WishlistProvider");
  }

  return context;
}
