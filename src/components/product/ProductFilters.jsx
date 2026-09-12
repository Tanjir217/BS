import { useEffect, useState } from "react";

const CURRENCY_SYMBOL = "৳";

function formatPrice(value) {
  return new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
  }).format(value);
}

function ProductFilters({
  filters,
  filterOptions,
  priceRange,
  isPriceRangeLoading,
  onApply,
  onClear,
}) {
  const [draftFilters, setDraftFilters] = useState(filters);

  /*
   * Keep the local filter controls synchronized
   * with the filters that have actually been applied.
   *
   * Moving the slider only changes draftFilters.
   * It does NOT trigger a product query.
   */
  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

  if (isPriceRangeLoading) {
    return (
      <section className="border border-black/10 bg-white p-6">
        <div className="animate-pulse">
          <div className="h-3 w-24 bg-black/10" />

          <div className="mt-8 h-1 w-full bg-black/10" />

          <div className="mt-5 flex justify-between">
            <div className="h-4 w-20 bg-black/10" />
            <div className="h-4 w-20 bg-black/10" />
          </div>
        </div>
      </section>
    );
  }

  /*
   * No active products means there is no price
   * range to display.
   */
  if (!priceRange) {
    return (
      <section className="border border-black/10 bg-white p-6">
        <p className="text-xs uppercase tracking-[0.14em] text-black/40">
          Filters
        </p>

        <p className="mt-4 text-sm text-black/50">
          No products are available for filtering.
        </p>
      </section>
    );
  }

  const minimumPrice = Number(priceRange.min);

  const maximumPrice = Number(priceRange.max);

  const hasPriceRange = maximumPrice > minimumPrice;

  /*
   * Empty means the full database range.
   */
  const selectedMinimum =
    draftFilters.minPrice === ""
      ? minimumPrice
      : Math.min(
          Math.max(Number(draftFilters.minPrice), minimumPrice),
          maximumPrice,
        );

  const selectedMaximum =
    draftFilters.maxPrice === ""
      ? maximumPrice
      : Math.min(
          Math.max(Number(draftFilters.maxPrice), minimumPrice),
          maximumPrice,
        );

  const safeMinimum = Math.min(selectedMinimum, selectedMaximum);

  const safeMaximum = Math.max(selectedMinimum, selectedMaximum);

  const priceSpan = maximumPrice - minimumPrice;

  const minimumPosition =
    priceSpan > 0 ? ((safeMinimum - minimumPrice) / priceSpan) * 100 : 0;

  const maximumPosition =
    priceSpan > 0 ? ((safeMaximum - minimumPrice) / priceSpan) * 100 : 100;

  const hasAppliedFilters =
    filters.minPrice !== "" ||
    filters.maxPrice !== "" ||
    filters.color !== "" ||
    filters.availability !== "all";

  const hasDraftChanges =
    draftFilters.minPrice !== filters.minPrice ||
    draftFilters.maxPrice !== filters.maxPrice ||
    draftFilters.color !== filters.color ||
    draftFilters.availability !== filters.availability;

  function updateDraftFilter(name, value) {
    setDraftFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleMinimumChange(event) {
    const value = Number(event.target.value);

    const maximum =
      draftFilters.maxPrice === ""
        ? maximumPrice
        : Number(draftFilters.maxPrice);

    const nextMinimum = Math.min(value, maximum);

    updateDraftFilter("minPrice", nextMinimum);
  }

  function handleMaximumChange(event) {
    const value = Number(event.target.value);

    const minimum =
      draftFilters.minPrice === ""
        ? minimumPrice
        : Number(draftFilters.minPrice);

    const nextMaximum = Math.max(value, minimum);

    updateDraftFilter("maxPrice", nextMaximum);
  }

  function handleApply() {
    const nextFilters = {
      ...draftFilters,

      /*
       * Selecting the complete database range
       * does not need to become an actual query
       * filter.
       */
      minPrice: safeMinimum <= minimumPrice ? "" : safeMinimum,

      maxPrice: safeMaximum >= maximumPrice ? "" : safeMaximum,
    };

    onApply(nextFilters);
  }

  function handleClear() {
    const clearedFilters = {
      minPrice: "",
      maxPrice: "",
      color: "",
      availability: "all",
    };

    setDraftFilters(clearedFilters);

    onClear();
  }

  return (
    <section className="border border-black/10 bg-white">
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-black/40">
              Filter
            </p>

            <h3 className="mt-2 text-lg font-medium">Refine your selection</h3>
          </div>

          {hasAppliedFilters && (
            <button
              type="button"
              onClick={handleClear}
              className="self-start text-xs uppercase tracking-[0.14em] text-black/45 underline underline-offset-4 transition hover:text-black sm:self-auto"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Price */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-black/45">
                Price
              </p>

              <p className="mt-1 text-sm text-black/60">
                {CURRENCY_SYMBOL}
                {formatPrice(safeMinimum)} — {CURRENCY_SYMBOL}
                {formatPrice(safeMaximum)}
              </p>
            </div>

            <p className="text-xs text-black/35">
              {CURRENCY_SYMBOL}
              {formatPrice(minimumPrice)} — {CURRENCY_SYMBOL}
              {formatPrice(maximumPrice)}
            </p>
          </div>

          {hasPriceRange ? (
            <div className="catalog-price-range relative mt-10 h-20">
              {/* Track */}
              <div className="absolute left-0 right-0 top-5 h-1.5 rounded-full bg-black/10" />

              {/* Selected range */}
              <div
                className="absolute top-5 h-1.5 rounded-full bg-black"
                style={{
                  left: `${minimumPosition}%`,
                  right: `${100 - maximumPosition}%`,
                }}
              />

              {/* Minimum value bubble */}
              <div
                className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-md border border-black bg-white px-2.5 py-1 text-xs font-medium shadow-sm"
                style={{
                  left: `${minimumPosition}%`,
                }}
              >
                {CURRENCY_SYMBOL}
                {formatPrice(safeMinimum)}
              </div>

              {/* Maximum value bubble */}
              <div
                className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-md border border-black bg-white px-2.5 py-1 text-xs font-medium shadow-sm"
                style={{
                  left: `${maximumPosition}%`,
                }}
              >
                {CURRENCY_SYMBOL}
                {formatPrice(safeMaximum)}
              </div>

              {/* Minimum slider */}
              <input
                type="range"
                aria-label="Minimum price"
                min={minimumPrice}
                max={maximumPrice}
                step="1"
                value={safeMinimum}
                onChange={handleMinimumChange}
                className={`catalog-price-range__input ${
                  safeMinimum >= maximumPrice ? "z-20" : "z-30"
                }`}
              />

              {/* Maximum slider */}
              <input
                type="range"
                aria-label="Maximum price"
                min={minimumPrice}
                max={maximumPrice}
                step="1"
                value={safeMaximum}
                onChange={handleMaximumChange}
                className="catalog-price-range__input z-20"
              />
            </div>
          ) : (
            <div className="mt-8 rounded-md bg-black/0.03 px-4 py-3 text-sm">
              {CURRENCY_SYMBOL}
              {formatPrice(minimumPrice)}
            </div>
          )}
        </div>

        {/* Other filters */}
        <div className="mt-8 grid gap-6 border-t border-black/10 pt-8 md:grid-cols-2">
          {/* Color */}
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.14em] text-black/45">
              Color
            </p>

            {filterOptions.colors.length === 0 ? (
              <p className="text-sm text-black/40">
                No color options available.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {filterOptions.colors.map((colorOption) => {
                  const isSelected = draftFilters.color === colorOption.name;

                  return (
                    <button
                      key={colorOption.name}
                      type="button"
                      onClick={() =>
                        updateDraftFilter(
                          "color",
                          isSelected ? "" : colorOption.name,
                        )
                      }
                      aria-pressed={isSelected}
                      className={`flex items-center gap-2 border px-3 py-2 text-sm transition ${
                        isSelected
                          ? "border-black bg-black text-white"
                          : "border-black/10 bg-white text-black hover:border-black"
                      }`}
                    >
                      {colorOption.hex && (
                        <span
                          aria-hidden="true"
                          className="h-3.5 w-3.5 rounded-full border border-black/15"
                          style={{
                            backgroundColor: colorOption.hex,
                          }}
                        />
                      )}

                      <span>{colorOption.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
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
              value={draftFilters.availability}
              onChange={(event) =>
                updateDraftFilter("availability", event.target.value)
              }
              className="w-full border-b border-black/20 bg-transparent py-2 text-sm outline-none transition focus:border-black"
            >
              <option value="all">All products</option>

              <option value="in-stock">In stock</option>
            </select>
          </div>
        </div>

        {/* Apply */}
        <div className="mt-8 flex flex-col gap-3 border-t border-black/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-black/40">
            Move the range freely. Products update when you apply the filters.
          </p>

          <button
            type="button"
            onClick={handleApply}
            disabled={!hasDraftChanges}
            className="min-h-11 border border-black bg-black px-7 py-3 text-xs font-medium uppercase tracking-[0.14em] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
          >
            Apply filters
          </button>
        </div>
      </div>

      <style>{`
        .catalog-price-range__input {
          position: absolute;
          left: 0;
          top: 18px;
          width: 100%;
          height: 18px;
          margin: 0;
          appearance: none;
          -webkit-appearance: none;
          background: transparent;
          pointer-events: none;
          outline: none;
        }

        .catalog-price-range__input::-webkit-slider-runnable-track {
          height: 6px;
          background: transparent;
        }

        .catalog-price-range__input::-moz-range-track {
          height: 6px;
          background: transparent;
        }

        .catalog-price-range__input::-webkit-slider-thumb {
          width: 24px;
          height: 24px;
          margin-top: -9px;
          appearance: none;
          -webkit-appearance: none;
          border: 2px solid black;
          border-radius: 9999px;
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.14);
          pointer-events: auto;
          cursor: grab;
        }

        .catalog-price-range__input::-webkit-slider-thumb:active {
          cursor: grabbing;
          transform: scale(1.08);
        }

        .catalog-price-range__input::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border: 2px solid black;
          border-radius: 9999px;
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.14);
          pointer-events: auto;
          cursor: grab;
        }

        .catalog-price-range__input::-moz-range-thumb:active {
          cursor: grabbing;
        }

        .catalog-price-range__input:focus-visible::-webkit-slider-thumb {
          outline: 3px solid rgba(0, 0, 0, 0.15);
          outline-offset: 3px;
        }

        .catalog-price-range__input:focus-visible::-moz-range-thumb {
          outline: 3px solid rgba(0, 0, 0, 0.15);
          outline-offset: 3px;
        }
      `}</style>
    </section>
  );
}

export default ProductFilters;
