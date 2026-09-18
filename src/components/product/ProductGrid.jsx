import ProductCard from "./ProductCard";

function ProductGrid({ products = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="animate-pulse rounded-[1.75rem] bg-white p-2.5">
            <div className="aspect-[0.92] rounded-[1.35rem] bg-black/5" />
            <div className="mt-4 h-4 w-2/3 rounded bg-black/5" />
            <div className="mt-2 h-3 w-1/3 rounded bg-black/5" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-[1.5rem] bg-white/70 py-16 text-center shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
        <p className="text-sm text-black/50">No products found in this category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => (
        <ProductCard key={product.$id} product={product} />
      ))}
    </div>
  );
}

export default ProductGrid;
