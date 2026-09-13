import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  const CART_STORAGE_KEY =
    "bayzid-shoes-cart-v1";
  
  const CartContext =
    createContext(null);
  
  function loadStoredCart() {
    try {
      const storedCart =
        localStorage.getItem(
          CART_STORAGE_KEY,
        );
  
      if (!storedCart) {
        return [];
      }
  
      const parsedCart =
        JSON.parse(storedCart);
  
      if (!Array.isArray(parsedCart)) {
        return [];
      }
  
      return parsedCart.filter(
        (item) =>
          item &&
          typeof item.productId ===
            "string" &&
          Number(item.quantity) > 0,
      );
    } catch (error) {
      console.error(
        "Failed to load cart:",
        error,
      );
  
      return [];
    }
  }
  
  function createCartItem(
    product,
    quantity,
  ) {
    const image =
      product.primaryImage ??
      product.images?.[0] ??
      null;
  
    return {
      productId: product.$id,
      slug: product.slug,
      name: product.name,
      sku: product.sku ?? "",
      price: Number(product.price) || 0,
      compareAtPrice:
        product.compareAtPrice !==
          null &&
        product.compareAtPrice !==
          undefined
          ? Number(
              product.compareAtPrice,
            )
          : null,
      color: product.color ?? "",
      colorHEX:
        product.colorHEX ?? "",
      image: image
        ? {
            id: image.id ?? "",
            url: image.url ?? "",
            alt: image.alt ?? "",
          }
        : null,
      quantity,
      addedAt:
        new Date().toISOString(),
    };
  }
  
  export function CartProvider({
    children,
  }) {
    const [items, setItems] =
      useState(loadStoredCart);
  
    useEffect(() => {
      try {
        localStorage.setItem(
          CART_STORAGE_KEY,
          JSON.stringify(items),
        );
      } catch (error) {
        console.error(
          "Failed to save cart:",
          error,
        );
      }
    }, [items]);
  
    function addToCart(
      product,
      quantity = 1,
    ) {
      if (!product?.$id) {
        return false;
      }
  
      const stockQuantity =
        Math.max(
          0,
          Number(
            product.stockQuantity,
          ) || 0,
        );
  
      if (stockQuantity <= 0) {
        return false;
      }
  
      const requestedQuantity =
        Math.max(
          1,
          Number(quantity) || 1,
        );
  
      setItems(
        (currentItems) => {
          const existingItem =
            currentItems.find(
              (item) =>
                item.productId ===
                product.$id,
            );
  
          if (!existingItem) {
            return [
              ...currentItems,
              createCartItem(
                product,
                Math.min(
                  requestedQuantity,
                  stockQuantity,
                ),
              ),
            ];
          }
  
          return currentItems.map(
            (item) => {
              if (
                item.productId !==
                product.$id
              ) {
                return item;
              }
  
              return {
                ...item,
                quantity: Math.min(
                  item.quantity +
                    requestedQuantity,
                  stockQuantity,
                ),
              };
            },
          );
        },
      );
  
      return true;
    }
  
    function updateQuantity(
      productId,
      quantity,
    ) {
      const nextQuantity =
        Number(quantity);
  
      setItems(
        (currentItems) =>
          currentItems
            .map((item) => {
              if (
                item.productId !==
                productId
              ) {
                return item;
              }
  
              if (
                !Number.isFinite(
                  nextQuantity,
                ) ||
                nextQuantity <= 0
              ) {
                return null;
              }
  
              return {
                ...item,
                quantity:
                  Math.floor(
                    nextQuantity,
                  ),
              };
            })
            .filter(Boolean),
      );
    }
  
    function removeFromCart(
      productId,
    ) {
      setItems(
        (currentItems) =>
          currentItems.filter(
            (item) =>
              item.productId !==
              productId,
          ),
      );
    }
  
    function clearCart() {
      setItems([]);
    }
  
    const itemCount = useMemo(
      () =>
        items.reduce(
          (total, item) =>
            total +
            item.quantity,
          0,
        ),
      [items],
    );
  
    const subtotal = useMemo(
      () =>
        items.reduce(
          (total, item) =>
            total +
            item.price *
              item.quantity,
          0,
        ),
      [items],
    );
  
    const value = useMemo(
      () => ({
        items,
        itemCount,
        subtotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }),
      [
        items,
        itemCount,
        subtotal,
      ],
    );
  
    return (
      <CartContext.Provider
        value={value}
      >
        {children}
      </CartContext.Provider>
    );
  }
  
  export function useCart() {
    const context =
      useContext(CartContext);
  
    if (!context) {
      throw new Error(
        "useCart must be used inside CartProvider",
      );
    }
  
    return context;
  }