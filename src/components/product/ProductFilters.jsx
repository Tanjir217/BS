function ProductFilters({
    filters,
    onChange,
    onClear,
  }) {
    const hasFilters =
      filters.minPrice !== "" ||
      filters.maxPrice !== "" ||
      filters.color !== "" ||
      filters.availability !== "all";
  
    function updateFilter(
      name,
      value,
    ) {
      onChange((current) => ({
        ...current,
        [name]: value,
      }));
    }
  
    return (
      <div className="border border-black/10 bg-white">
        <div className="grid gap-6 p-6 md:grid-cols-4">
          {/* Minimum price */}
          <div>
            <label
              htmlFor="filter-min-price"
              className="mb-2 block text-xs uppercase tracking-[0.14em] text-black/45"
            >
              Min price
            </label>
  
            <input
              id="filter-min-price"
              type="number"
              min="0"
              value={filters.minPrice}
              onChange={(event) =>
                updateFilter(
                  "minPrice",
                  event.target.value,
                )
              }
              placeholder="0"
              className="w-full border-b border-black/20 bg-transparent py-2 text-sm outline-none focus:border-black"
            />
          </div>
  
          {/* Maximum price */}
          <div>
            <label
              htmlFor="filter-max-price"
              className="mb-2 block text-xs uppercase tracking-[0.14em] text-black/45"
            >
              Max price
            </label>
  
            <input
              id="filter-max-price"
              type="number"
              min="0"
              value={filters.maxPrice}
              onChange={(event) =>
                updateFilter(
                  "maxPrice",
                  event.target.value,
                )
              }
              placeholder="50000"
              className="w-full border-b border-black/20 bg-transparent py-2 text-sm outline-none focus:border-black"
            />
          </div>
  
          {/* Color */}
          <div>
            <label
              htmlFor="filter-color"
              className="mb-2 block text-xs uppercase tracking-[0.14em] text-black/45"
            >
              Color
            </label>
  
            <input
              id="filter-color"
              type="text"
              value={filters.color}
              onChange={(event) =>
                updateFilter(
                  "color",
                  event.target.value,
                )
              }
              placeholder="Black"
              className="w-full border-b border-black/20 bg-transparent py-2 text-sm outline-none focus:border-black"
            />
          </div>
  
          {/* Availability */}
          <div>
            <label
              htmlFor="filter-availability"
              className="mb-2 block text-xs uppercase tracking-[0.14em] text-black/45"
            >
              Availability
            </label>
  
            <select
              id="filter-availability"
              value={filters.availability}
              onChange={(event) =>
                updateFilter(
                  "availability",
                  event.target.value,
                )
              }
              className="w-full border-b border-black/20 bg-transparent py-2 text-sm outline-none focus:border-black"
            >
              <option value="all">
                All products
              </option>
  
              <option value="in-stock">
                In stock
              </option>
            </select>
          </div>
        </div>
  
        {hasFilters && (
          <div className="border-t border-black/10 px-6 py-4">
            <button
              type="button"
              onClick={onClear}
              className="text-xs uppercase tracking-[0.14em] text-black/55 underline underline-offset-4 transition hover:text-black"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    );
  }
  
  export default ProductFilters;