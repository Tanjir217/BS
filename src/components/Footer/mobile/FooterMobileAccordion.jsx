import { useState } from "react";
import { Link } from "react-router-dom";

function FooterMobileAccordion({ column, onToggle }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-300">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between py-5 text-left"
        aria-expanded={isOpen}
      >
        <span className="text-[11px] font-medium tracking-[0.12em]">
          {column.title}
        </span>

        <span className="text-lg font-light">
          {isOpen ? "−" : "+"}
        </span>
      </button>

      <div
        className={`grid transition-all duration-300 ease-out ${
          isOpen
            ? "grid-rows-[1fr] pb-5 opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <ul className="space-y-4">
            {column.links.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.href}
                  className="text-[12px] tracking-[0.03em] text-gray-700 no-underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default FooterMobileAccordion;