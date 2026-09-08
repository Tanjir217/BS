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
  const dropdownRef = useRef(null);

  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);

      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleSelect(option) {
    onChange?.(option.value);
    setOpen(false);
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={[
          "flex w-full items-center justify-between gap-3",
          "rounded-lg border border-black/10 bg-white",
          "px-3 py-2 text-xs font-medium text-black",
          "transition",
          "hover:border-black/20",
          "focus:outline-none focus:ring-2 focus:ring-black/10",
          "disabled:cursor-not-allowed disabled:opacity-50",
        ].join(" ")}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{selectedOption?.label || placeholder}</span>

        <ChevronDown
          size={14}
          strokeWidth={1.8}
          className={[
            "shrink-0 transition-transform duration-200",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {open && (
        <div
          className={[
            "absolute right-0 z-50 mt-2 min-w-full",
            "overflow-hidden rounded-xl",
            "border border-black/10 bg-white",
            "p-1 shadow-lg shadow-black/10",
            menuClassName,
          ].join(" ")}
          role="listbox"
        >
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                className={[
                  "flex w-full items-center",
                  "justify-between gap-3",
                  "rounded-lg px-3 py-2",
                  "text-left text-xs",
                  "transition",
                  isSelected ? "bg-black/5 font-medium" : "hover:bg-black/5",
                ].join(" ")}
                role="option"
                aria-selected={isSelected}
              >
                <span className="truncate">{option.label}</span>

                {isSelected && (
                  <Check size={14} strokeWidth={2} className="shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CustomDropdown;
