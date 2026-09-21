function OrderEmptyState({
  hasActiveFilters = false,
}) {
  return (
    <div className="rounded-2xl border border-black/8 bg-white p-10 text-center">
      <h3 className="text-sm font-semibold text-black">
        {hasActiveFilters
          ? "No matching orders"
          : "No orders yet"}
      </h3>

      <p className="mt-1 text-sm text-black/45">
        {hasActiveFilters
          ? "Try changing or clearing your filters."
          : "Orders will appear here when customers place them."}
      </p>
    </div>
  );
}

export default OrderEmptyState;