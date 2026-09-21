import { Search, X } from "lucide-react";
import CustomDropdown from "../components/CustomDropdown";

function getCategoryLabel(category, categories) {
  const byId = new Map(categories.map((item) => [item.$id, item]));
  const names = [];
  const visited = new Set();
  let current = category;

  while (current && !visited.has(current.$id)) {
    visited.add(current.$id);
    names.unshift(current.name);
    current = current.parentCategoryID
      ? byId.get(current.parentCategoryID)
      : null;
  }

  return names.join(" / ");
}

function ProductFilters({ filters, categories, onChange }) {
  function updateFilter(name, value) {
    onChange((current) => ({ ...current, [name]: value }));
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
    <div className="rounded-2xl border-0 bg-white/65 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.05)] backdrop-blur-xl">
      <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
        <div className="relative">
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35"
          />
          <input
            type="search"
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
            placeholder="Search by name, SKU or slug..."
            className="w-full rounded-full border-0 bg-black/[0.035] py-2.5 pl-10 pr-4 text-sm text-black/75 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.055)] outline-none transition focus:bg-black/[0.05] focus:ring-2 focus:ring-black/10"
          />
        </div>

        <CustomDropdown
          value={filters.category}
          onChange={(value) => updateFilter("category", value)}
          options={[
            { value: "all", label: "All Categories" },
            ...categories.map((category) => ({
              value: category.$id,
              label: getCategoryLabel(category, categories),
            })),
          ]}
        />

        <CustomDropdown
          value={filters.status}
          onChange={(value) => updateFilter("status", value)}
          options={[
            { value: "all", label: "All Status" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
        />

        <CustomDropdown
          value={filters.stock}
          onChange={(value) => updateFilter("stock", value)}
          options={[
            { value: "all", label: "All Stock" },
            { value: "in-stock", label: "In Stock" },
            { value: "low", label: "Low Stock" },
            { value: "out", label: "Out of Stock" },
          ]}
        />

        <CustomDropdown
          value={filters.discount}
          onChange={(value) => updateFilter("discount", value)}
          options={[
            { value: "all", label: "All Pricing" },
            { value: "discounted", label: "Discounted" },
            { value: "no-discount", label: "No Discount" },
          ]}
        />

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center justify-center gap-2 rounded-full border-0 bg-black/[0.035] px-4 py-2.5 text-sm font-medium text-black/65 transition hover:bg-black/[0.07]"
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
