import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

function CustomDropdown({
  options = [],
  value,
  onChange,
  placeholder = "Select option",
  className = "",
  menuClassName = "",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!ref.current?.contains(event.target)) setOpen(false);
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-10 w-full items-center justify-between gap-3 rounded-full border-0 bg-black/[0.035] px-4 py-2 text-sm text-black/75 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.055)] outline-none transition hover:bg-black/[0.055] focus-visible:ring-2 focus-visible:ring-black/10 disabled:cursor-not-allowed disabled:opacity-50"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{selected?.label || placeholder}</span>
        <ChevronDown
          size={15}
          strokeWidth={1.7}
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className={`absolute left-0 right-0 z-[100] mt-2 max-h-72 overflow-y-auto overscroll-contain rounded-2xl border-0 bg-white/95 p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.12)] backdrop-blur-xl ${menuClassName}`}
          role="listbox"
          aria-label={placeholder}
        >
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={String(option.value)}
                type="button"
                onClick={() => {
                  onChange?.(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  isSelected
                    ? "bg-black text-white"
                    : "text-black/65 hover:bg-black/[0.045] hover:text-black"
                }`}
                role="option"
                aria-selected={isSelected}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check size={14} strokeWidth={2} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CustomDropdown;
