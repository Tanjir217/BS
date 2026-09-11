import ProductCard from "./ProductCard";

function ProductGrid({
  products = [],
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({
          length: 8,
        }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse"
          >
            <div className="aspect-[4/5] bg-black/5" />

            <div className="mt-4 h-4 w-2/3 rounded bg-black/5" />

            <div className="mt-2 h-3 w-1/3 rounded bg-black/5" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="border-t border-black/10 py-16 text-center">
        <p className="text-sm text-black/50">
          No products found in this category.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.$id}
          product={product}
        />
      ))}
    </div>
  );
}

export default ProductGrid;