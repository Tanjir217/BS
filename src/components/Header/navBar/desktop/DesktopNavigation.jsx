import { useState } from "react";
import { Link } from "react-router-dom";
import { navigation } from "../../../../data/navigation";
import MegaMenu from "./MegaMenu";

function DesktopNavigation() {
  const [activeMenu, setActiveMenu] = useState(null);

  const activeItem = navigation.find(
    (item) => item.id === activeMenu
  );

  const handleMouseEnter = (item) => {
    if (item.megaMenu) {
      setActiveMenu(item.id);
    } else {
      setActiveMenu(null);
    }
  };

  const closeMenu = () => {
    setActiveMenu(null);
  };

  return (
    <div
      className="hidden md:block"
      onMouseLeave={closeMenu}
    >
      <nav
        aria-label="Main navigation"
        className="flex items-center gap-8"
      >
        {navigation.map((item) => (
          <Link
            key={item.id}
            to={item.href}
            onMouseEnter={() => handleMouseEnter(item)}
            onFocus={() => handleMouseEnter(item)}
            className="text-[13px] tracking-[0.08em] text-gray-900 no-underline transition-opacity hover:opacity-60"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {activeItem?.megaMenu && (
        <MegaMenu
          data={activeItem.megaMenu}
          onClose={closeMenu}
        />
      )}
    </div>
  );
}

export default DesktopNavigation;