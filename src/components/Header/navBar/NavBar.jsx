import { useState } from "react";

import Logo from "./shared/Logo";
import DesktopNavigation from "./desktop/DesktopNavigation";
import MegaMenu from "./desktop/MegaMenu";
import MobileMenu from "./mobile/MobileMenu";

import { navigation } from "../../../data/navigation";

function NavBar() {
  const [activeMenu, setActiveMenu] = useState(null);

  const activeItem = navigation.find(
    (item) => item.id === activeMenu
  );

  return (
    <header
      className="relative z-50 border-b border-gray-200 bg-white"
      onMouseLeave={() => setActiveMenu(null)}
    >
      <div className="flex h-16 items-center justify-between px-4 md:px-8">

        <div className="hidden md:block">
          <DesktopNavigation
            activeMenu={activeMenu}
            onMenuChange={setActiveMenu}
          />
        </div>

        <div className="md:hidden">
          <MobileMenu />
        </div>

        <Logo />

        <div className="flex items-center gap-5">
          <button type="button">Search</button>
          <button type="button">Account</button>
          <button type="button">Bag</button>
        </div>

      </div>

      {activeItem?.megaMenu && (
        <MegaMenu
          data={activeItem.megaMenu}
          onClose={() => setActiveMenu(null)}
        />
      )}
    </header>
  );
}

export default NavBar;