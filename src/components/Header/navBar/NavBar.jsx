import { useState } from "react";

import Logo from "./shared/Logo";
import DesktopNavigation from "./desktop/DesktopNavigation";
import MegaMenu from "./desktop/MegaMenu";
import MobileMenu from "./mobile/MobileMenu";
import AccountButton from "./shared/AccountButton";
import { navigation } from "../../../data/navigation";
import CartButton from "./shared/CartButton";
import SearchButton from "./shared/SearchButton";

function NavBar() {
  const [activeMenu, setActiveMenu] = useState(null);

  const activeItem = navigation.find((item) => item.id === activeMenu);

  const closeMenu = () => {
    setActiveMenu(null);
  };

  return (
    <header
      className="relative z-50 border-b border-gray-200 bg-white"
      onMouseLeave={closeMenu}
    >
      <div className="flex h-15 items-center justify-between px-10 md:px-8">
        {/* Mobile menu */}
        <div className="md:hidden">
          <MobileMenu />
        </div>

        {/* Desktop navigation */}
        <div className="hidden md:block">
          <DesktopNavigation
            activeMenu={activeMenu}
            onMenuChange={setActiveMenu}
          />
        </div>

        {/* Logo */}
        <Logo 
        
        className = ""/>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-5 lg:gap-6">
          <SearchButton
            type="button"
            aria-label="Search"
            className="text-gray-900"
          />

          <AccountButton
            type="button"
            aria-label="Account"
            className="text-gray-900"
          />

          <CartButton
            type="button"
            aria-label="Shopping bag"
            className="text-gray-900"
          />
        </div>
      </div>

      {/* Mega menu */}
      {activeItem?.megaMenu && (
        <MegaMenu
          data={activeItem.megaMenu}
          isOpen={Boolean(activeItem?.megaMenu)}
          onClose={closeMenu}
        />
      )}
    </header>
  );
}

export default NavBar;