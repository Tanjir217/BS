import { Link } from "react-router-dom";
import { navigation } from "../../../../data/navigation";

function DesktopNavigation({ activeMenu, onMenuChange }) {
  return (
    <nav
      aria-label="Main navigation"
      className="flex items-center gap-8"
    >
      {navigation.map((item) => (
        <Link
          key={item.id}
          to={item.href}
          onMouseEnter={() => {
            onMenuChange(
              item.megaMenu ? item.id : null
            );
          }}
          onFocus={() => {
            onMenuChange(
              item.megaMenu ? item.id : null
            );
          }}
          className="text-[13px] tracking-[0.08em] text-gray-900 no-underline hover:opacity-60"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export default DesktopNavigation;