import { useEffect, useState } from "react";

import Logo from "./shared/Logo";
import DesktopNavigation from "./desktop/DesktopNavigation";
import MegaMenu from "./desktop/MegaMenu";
import MobileMenu from "./mobile/MobileMenu";

import AccountButton from "./shared/AccountButton";
import CartButton from "./shared/CartButton";
import SearchButton from "./shared/SearchButton";

import { getCategories } from "../../../services/categoryServices";

import { buildCategoryTree } from "../../../utils/categoryTree";
import {
  buildNavigationFromTree,
} from "../../../utils/navigationTree";

function NavBar() {
  const [activeMenu, setActiveMenu] =
    useState(null);

  const [
    navigation,
    setNavigation,
  ] = useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [navigationError, setNavigationError] =
    useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadNavigation() {
      try {
        setIsLoading(true);
        setNavigationError(null);

        const categories =
          await getCategories();

        const tree =
          buildCategoryTree(categories);

        const navigationItems =
          buildNavigationFromTree(tree);

        if (!isMounted) {
          return;
        }

        setNavigation(
          navigationItems
        );
      } catch (error) {
        console.error(
          "Failed to load navigation:",
          error
        );

        if (isMounted) {
          setNavigationError(
            "Unable to load navigation."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadNavigation();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeItem =
    navigation.find(
      (item) =>
        item.id === activeMenu
    );

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
          <MobileMenu
            navigation={navigation}
            isLoading={isLoading}
            error={navigationError}
          />
        </div>

        {/* Desktop navigation */}
        <div className="order-2 hidden md:block">
          <DesktopNavigation
            navigation={navigation}
            onMenuChange={setActiveMenu}
            isLoading={isLoading}
          />
        </div>

        {/* Logo */}
        <Logo
          className="order-1"
        />

        {/* Right side */}
        <div className="order-3 flex items-center gap-2 sm:gap-4 md:gap-5 lg:gap-6">
          <SearchButton
            type="button"
            aria-label="Search"
            className=""
            color="#5A1020"
          />

          <AccountButton
            color="#5A1020"
            type="button"
            aria-label="Account"
            className=""
          />

          <CartButton
            type="button"
            aria-label="Shopping bag"
            className=""
            color="#5A1020"
          />
        </div>
      </div>

      {/* Mega menu */}
      {activeItem?.megaMenu && (
        <MegaMenu
          data={activeItem.megaMenu}
          isOpen={Boolean(activeItem.megaMenu)}
          onClose={closeMenu}
        />
      )}
    </header>
  );
}

export default NavBar;