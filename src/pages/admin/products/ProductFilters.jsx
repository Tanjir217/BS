import { Search, X } from "lucide-react";

function ProductFilters({
  filters,
  categories,
  onChange,
}) {
  function updateFilter(name, value) {
    onChange((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function clearFilters() {
    onChange({
      search: "",
      category: "all",
      status: "all",
      stock: "all",
      discount: "all",
    });
  }

  const hasFilters =
    filters.search ||
    filters.category !== "all" ||
    filters.status !== "all" ||
    filters.stock !== "all" ||
    filters.discount !== "all";

  return (
    <div className="rounded-2xl border border-black/8 bg-white p-4">
      <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
        {/* Search */}
        <div className="relative">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-black/35"
          />

          <input
            type="text"
            value={filters.search}
            onChange={(event) =>
              updateFilter("search", event.target.value)
            }
            placeholder="Search by name, SKU or slug..."
            className="w-full rounded-xl border border-black/10 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-black"
          />
        </div>

        {/* Category */}
        <select
          value={filters.category}
          onChange={(event) =>
            updateFilter("category", event.target.value)
          }
          className="rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-black"
        >
          <option value="all">All Categories</option>

          {categories.map((category) => (
            <option key={category.$id} value={category.$id}>
              {category.name}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={filters.status}
          onChange={(event) =>
            updateFilter("status", event.target.value)
          }
          className="rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-black"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* Stock */}
        <select
          value={filters.stock}
          onChange={(event) =>
            updateFilter("stock", event.target.value)
          }
          className="rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-black"
        >
          <option value="all">All Stock</option>
          <option value="in-stock">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>

        {/* Discount */}
        <select
          value={filters.discount}
          onChange={(event) =>
            updateFilter("discount", event.target.value)
          }
          className="rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-black"
        >
          <option value="all">All Pricing</option>
          <option value="discounted">Discounted</option>
          <option value="no-discount">No Discount</option>
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center justify-center gap-2 rounded-xl border border-black/10 px-3 py-2.5 text-sm font-medium transition hover:bg-black/5"
          >
            <X size={15} />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

export default ProductFilters;