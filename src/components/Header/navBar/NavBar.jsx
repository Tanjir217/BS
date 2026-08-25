import Logo from "./shared/Logo";
import DesktopNavigation from "./desktop/DesktopNavigation";
import MobileMenu from "./mobile/MobileMenu";

function NavBar() {
  return (
    <header className="relative border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">

        {/* Mobile menu */}
        <div className="md:hidden">
          <MobileMenu />
        </div>

        {/* Desktop navigation */}
        <div className="hidden md:block">
          <DesktopNavigation />
        </div>

        {/* Logo */}
        <Logo />

        {/* Right side */}
        <div className="flex items-center gap-5">
          <button
            type="button"
            aria-label="Search"
            className="text-gray-900"
          >
            Search
          </button>

          <button
            type="button"
            aria-label="Account"
            className="text-gray-900"
          >
            Account
          </button>

          <button
            type="button"
            aria-label="Shopping bag"
            className="text-gray-900"
          >
            Bag
          </button>
        </div>

      </div>
    </header>
  );
}

export default NavBar;