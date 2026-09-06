function ProductEmptyState() {
    return (
      <div className="rounded-2xl border border-dashed border-black/10 bg-white px-6 py-16 text-center">
        <h3 className="text-base font-semibold">
          No products found
        </h3>
  
        <p className="mt-1 text-sm text-black/45">
          Try changing your filters or create a new product.
        </p>
      </div>
    );
  }
  
  export default ProductEmptyState;