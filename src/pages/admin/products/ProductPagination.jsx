import { ChevronLeft, ChevronRight } from "lucide-react";

function ProductPagination({
  page,
  totalPages,
  totalProducts,
  onPageChange,
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-black/8 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-black/45">
        {totalProducts} products · Page {page} of{" "}
        {totalPages}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-black/10 px-3 py-2 text-sm font-medium transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft size={15} />
          Previous
        </button>

        <span className="px-2 text-sm font-medium">
          {page}
        </span>

        <button
          type="button"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-black/10 px-3 py-2 text-sm font-medium transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Next
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

export default ProductPagination;