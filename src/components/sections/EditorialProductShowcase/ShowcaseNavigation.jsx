import { ChevronLeft, ChevronRight } from "lucide-react";

function ShowcaseNavigation({
  currentIndex,
  total,
  onPrevious,
  onNext,
  onSelect,
}) {
  if (!total) {
    return null;
  }

  return (
    <div className="flex w-full items-center justify-between">
      {/* Previous */}
      <button
        type="button"
        onClick={onPrevious}
        aria-label="Previous product"
        className="p-2 text-[#5A1020] transition-all hover:text-[#7A1F32]"
      >
        <ChevronLeft size={18} strokeWidth={1.5} />
      </button>

      {/* Indicators */}
      <div className="flex items-center gap-3">
        {Array.from({ length: total }).map((_, index) => {
          const isActive = index === currentIndex;

          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelect(index)}
              aria-label={`Go to product ${index + 1}`}
              aria-current={isActive ? "true" : undefined}
              className={`
                h-px
                transition-all
                duration-300
                ${
                  isActive
                    ? "w-5 bg-[#7A1F32]"
                    : "w-4 bg-[#D9C4C9]"
                }
              `}
            />
          );
        })}
      </div>

      {/* Next */}
      <button
        type="button"
        onClick={onNext}
        aria-label="Next product"
        className="p-2 text-[#5A1020] transition-all hover:text-[#7A1F32]"
      >
        <ChevronRight size={18} strokeWidth={1.5} />
      </button>
    </div>
  );
}

export default ShowcaseNavigation;