import { useEffect, useState } from "react";
import { Footprints } from "lucide-react";
import CustomDropdown from "../ui/CustomDropdown";

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
    <section className="rounded-[1.75rem] bg-white/80 shadow-[0_12px_40px_rgba(0,0,0,0.045)] ring-1 ring-black/[0.025] backdrop-blur">
      <div className="p-5 md:p-7">
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
            <div className="catalog-price-range relative mt-10 h-28 overflow-hidden rounded-2xl bg-[#5A1020] px-7 sm:px-10">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[11px] font-medium text-white sm:left-5">
                {CURRENCY_SYMBOL}{formatPrice(minimumPrice)}
              </span>

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-medium text-white sm:right-5">
                {CURRENCY_SYMBOL}{formatPrice(maximumPrice)}
              </span>

              <div className="catalog-price-range__track absolute left-16 right-16 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/85">
                <div
                  className="absolute inset-y-0 rounded-full bg-[#D9A7B0]"
                  style={{
                    left: `${minimumPosition}%`,
                    right: `${100 - maximumPosition}%`,
                  }}
                />

                <div
                  className="pointer-events-none absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-8 text-white drop-shadow-[0_3px_8px_rgba(0,0,0,0.28)]"
                  style={{
                    left: `${(minimumPosition + maximumPosition) / 2}%`,
                  }}
                  aria-hidden="true"
                >
                  <Footprints size={30} strokeWidth={1.8} />
                </div>

                <div
                  className="pointer-events-none absolute left-0 top-1/2 z-20 -translate-x-1/2 translate-y-6 whitespace-nowrap rounded-lg bg-white px-3 py-1.5 text-[11px] font-semibold text-[#5A1020] shadow-[0_5px_16px_rgba(0,0,0,0.16)]"
                  style={{
                    left: `${(minimumPosition + maximumPosition) / 2}%`,
                  }}
                >
                  <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-white" />
                  <span className="relative">
                    {CURRENCY_SYMBOL}{formatPrice(safeMinimum)} — {CURRENCY_SYMBOL}{formatPrice(safeMaximum)}
                  </span>
                </div>
              </div>

              <input
                type="range"
                aria-label="Minimum price"
                min={minimumPrice}
                max={maximumPrice}
                step="1"
                value={safeMinimum}
                onChange={handleMinimumChange}
                className={`catalog-price-range__input ${
                  safeMinimum >= maximumPrice ? "z-40" : "z-30"
                }`}
              />

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
            <p className="mb-3 text-xs uppercase tracking-[0.14em] text-black/45">
              Availability
            </p>
            <CustomDropdown
              value={draftFilters.availability}
              onChange={(value) => updateDraftFilter("availability", value)}
              options={[
                { value: "all", label: "All products" },
                { value: "in-stock", label: "In stock" },
              ]}
              className="w-full"
            />
          </div>
        </div>

        {/* Apply */}
        <div className="mt-7 flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
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
          left: 4rem;
          top: 50%;
          width: calc(100% - 8rem);
          height: 34px;
          transform: translateY(-50%);
          margin: 0;
          appearance: none;
          -webkit-appearance: none;
          background: transparent;
          pointer-events: auto;
          outline: none;
        }

        .catalog-price-range__input::-webkit-slider-runnable-track {
          height: 4px;
          background: transparent;
        }

        .catalog-price-range__input::-moz-range-track {
          height: 4px;
          background: transparent;
        }

        .catalog-price-range__input::-webkit-slider-thumb {
          width: 30px;
          height: 30px;
          margin-top: -13px;
          appearance: none;
          -webkit-appearance: none;
          border: 0;
          border-radius: 9999px;
          background: transparent;
          box-shadow: none;
          pointer-events: auto;
          cursor: grab;
        }

        .catalog-price-range__input::-webkit-slider-thumb:active {
          cursor: grabbing;
        }

        .catalog-price-range__input::-moz-range-thumb {
          width: 30px;
          height: 30px;
          border: 0;
          border-radius: 9999px;
          background: transparent;
          box-shadow: none;
          pointer-events: auto;
          cursor: grab;
        }

        .catalog-price-range__input::-moz-range-thumb:active {
          cursor: grabbing;
        }

        .catalog-price-range__input:focus-visible::-webkit-slider-thumb {
          outline: 3px solid rgba(217, 167, 176, 0.65);
          outline-offset: 3px;
        }

        .catalog-price-range__input:focus-visible::-moz-range-thumb {
          outline: 3px solid rgba(217, 167, 176, 0.65);
          outline-offset: 3px;
        }
      `}</style>
    </section>
  );
}

export default ProductFilters;
