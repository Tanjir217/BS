import { ChevronDown } from "lucide-react";

function ProductAccordion({ title, children, defaultOpen = false }) {
  return (
    <details className="product-accordion" open={defaultOpen}>
      <summary>
        <span>{title}</span>
        <ChevronDown size={18} strokeWidth={1.4} aria-hidden="true" />
      </summary>
      <div className="product-accordion__content">{children}</div>
    </details>
  );
}

export default ProductAccordion;
