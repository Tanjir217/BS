import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getProductById } from "../services/productServices";

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

    return parsedCart
      .filter(
        (item) =>
          item &&
          typeof item.productId ===
            "string" &&
          Number(item.quantity) > 0,
      )
      .map((item) => ({
        ...item,
        quantity: Math.floor(
          Number(item.quantity),
        ),
        validationStatus:
          item.validationStatus ??
          "unverified",
        stockQuantity:
          Number.isFinite(
            Number(
              item.stockQuantity,
            ),
          )
            ? Number(
                item.stockQuantity,
              )
            : null,
      }));
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
    price:
      Number(product.price) || 0,
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
    stockQuantity:
      Number(product.stockQuantity) ||
      0,
    validationStatus: "unverified",
    addedAt:
      new Date().toISOString(),
  };
}

export function CartProvider({
  children,
}) {
  const [items, setItems] =
    useState(loadStoredCart);

  const [
    isCartOpen,
    setIsCartOpen,
  ] = useState(false);

  const [
    isValidating,
    setIsValidating,
  ] = useState(false);

  const [
    validationError,
    setValidationError,
  ] = useState(null);

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

  const addToCart = useCallback(
    (
      product,
      quantity = 1,
    ) => {
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
          Math.floor(
            Number(quantity) || 1,
          ),
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

          const nextQuantity =
            Math.min(
              existingItem.quantity +
                requestedQuantity,
              stockQuantity,
            );

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
                price:
                  Number(
                    product.price,
                  ) || 0,
                compareAtPrice:
                  product.compareAtPrice !==
                    null &&
                  product.compareAtPrice !==
                    undefined
                    ? Number(
                        product.compareAtPrice,
                      )
                    : null,
                stockQuantity,
                quantity:
                  nextQuantity,
                validationStatus:
                  "unverified",
              };
            },
          );
        },
      );

      return true;
    },
    [],
  );

  const updateQuantity =
    useCallback(
      (
        productId,
        quantity,
      ) => {
        const nextQuantity =
          Math.floor(
            Number(quantity),
          );

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

                const knownStock =
                  Number(
                    item.stockQuantity,
                  );

                const maxQuantity =
                  Number.isFinite(
                    knownStock,
                  ) &&
                  knownStock > 0
                    ? knownStock
                    : nextQuantity;

                return {
                  ...item,
                  quantity:
                    Math.min(
                      nextQuantity,
                      maxQuantity,
                    ),
                  validationStatus:
                    "unverified",
                };
              })
              .filter(Boolean),
        );
      },
      [],
    );

  const removeFromCart =
    useCallback(
      (productId) => {
        setItems(
          (currentItems) =>
            currentItems.filter(
              (item) =>
                item.productId !==
                productId,
            ),
        );
      },
      [],
    );

  const clearCart =
    useCallback(() => {
      setItems([]);
    }, []);

  const validateCart =
    useCallback(
      async () => {
        if (items.length === 0) {
          return;
        }

        setIsValidating(true);
        setValidationError(null);

        try {
          const validationResults =
            await Promise.all(
              items.map(async (item) => {
                try {
                  const product =
                    await getProductById(
                      item.productId,
                    );

                  if (!product) {
                    return {
                      ...item,
                      validationStatus:
                        "unavailable",
                      stockQuantity: 0,
                    };
                  }

                  const currentPrice =
                    Number(
                      product.price,
                    ) || 0;

                  const currentStock =
                    Math.max(
                      0,
                      Number(
                        product.stockQuantity,
                      ) || 0,
                    );

                  const priceChanged =
                    currentPrice !==
                    Number(
                      item.price,
                    );

                  if (
                    currentStock <= 0
                  ) {
                    return {
                      ...item,
                      price:
                        currentPrice,
                      stockQuantity: 0,
                      validationStatus:
                        "out-of-stock",
                    };
                  }

                  const quantityReduced =
                    item.quantity >
                    currentStock;

                  return {
                    ...item,
                    name:
                      product.name ??
                      item.name,
                    slug:
                      product.slug ??
                      item.slug,
                    sku:
                      product.sku ??
                      item.sku,
                    price:
                      currentPrice,
                    compareAtPrice:
                      product.compareAtPrice !==
                        null &&
                      product.compareAtPrice !==
                        undefined
                        ? Number(
                            product.compareAtPrice,
                          )
                        : null,
                    color:
                      product.color ??
                      item.color,
                    colorHEX:
                      product.colorHEX ??
                      item.colorHEX,
                    stockQuantity:
                      currentStock,
                    quantity:
                      quantityReduced
                        ? currentStock
                        : item.quantity,
                    validationStatus:
                      priceChanged
                        ? "price-changed"
                        : quantityReduced
                          ? "stock-reduced"
                          : "valid",
                  };
                } catch (error) {
                  console.error(
                    `Failed to validate cart item ${item.productId}:`,
                    error,
                  );

                  return {
                    ...item,
                    validationStatus:
                      "validation-error",
                  };
                }
              }),
            );

          setItems(
            validationResults,
          );
        } catch (error) {
          console.error(
            "Cart validation failed:",
            error,
          );

          setValidationError(
            "We could not verify your bag. Please try again.",
          );
        } finally {
          setIsValidating(false);
        }
      },
      [items],
    );

  const openCart =
    useCallback(async () => {
      setIsCartOpen(true);

      if (items.length > 0) {
        await validateCart();
      }
    }, [
      items.length,
      validateCart,
    ]);

  const closeCart =
    useCallback(() => {
      setIsCartOpen(false);
    }, []);

  const itemCount = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          item.validationStatus ===
            "unavailable" ||
          item.validationStatus ===
            "out-of-stock"
            ? total
            : total +
              item.quantity,
        0,
      ),
    [items],
  );

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) => {
          if (
            item.validationStatus ===
              "unavailable" ||
            item.validationStatus ===
              "out-of-stock"
          ) {
            return total;
          }

          return (
            total +
            item.price *
              item.quantity
          );
        },
        0,
      ),
    [items],
  );

  const hasUnavailableItems =
    useMemo(
      () =>
        items.some(
          (item) =>
            item.validationStatus ===
              "unavailable" ||
            item.validationStatus ===
              "out-of-stock",
        ),
      [items],
    );

  const hasCartChanges =
    useMemo(
      () =>
        items.some(
          (item) =>
            item.validationStatus ===
              "price-changed" ||
            item.validationStatus ===
              "stock-reduced",
        ),
      [items],
    );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,

      isCartOpen,
      isValidating,
      validationError,

      hasUnavailableItems,
      hasCartChanges,

      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,

      validateCart,
      openCart,
      closeCart,
    }),
    [
      items,
      itemCount,
      subtotal,
      isCartOpen,
      isValidating,
      validationError,
      hasUnavailableItems,
      hasCartChanges,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      validateCart,
      openCart,
      closeCart,
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