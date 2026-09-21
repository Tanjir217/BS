import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

function SectionAction({
  to,
  children = "View all",
}) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-1.5 text-xs font-medium text-black/55 transition hover:text-black"
    >
      <span>{children}</span>

      <ArrowRight
        size={13}
        strokeWidth={1.8}
        className="transition-transform duration-200 group-hover:translate-x-0.5"
      />
    </Link>
  );
}

export default SectionAction;