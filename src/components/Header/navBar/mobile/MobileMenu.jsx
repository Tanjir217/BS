import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { navigation } from "../../../../data/navigation";

function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const closeMenu = () => {
    setIsOpen(false);
    setActiveCategory(null);
    setExpandedSection(null);
  };

  const activeItem = navigation.find(
    (item) => item.id === activeCategory
  );

  const openCategory = (item) => {
    if (!item.megaMenu) {
      setIsOpen(false);
      return;
    }

    setActiveCategory(item.id);
    setExpandedSection(null);
  };

  return (
    <>
      {/* Menu button */}
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        className="flex h-10 w-10 items-center justify-center"
      >
        <span className="text-xl">☰</span>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-90 bg-black/50"
          onClick={closeMenu}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed left-0 top-0 z-100 h-dvh w-[86%] max-w-105 bg-white transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4">

          {activeCategory ? (
            <button
              type="button"
              onClick={() => {
                setActiveCategory(null);
                setExpandedSection(null);
              }}
              className="text-xl"
              aria-label="Back"
            >
              ←
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={closeMenu}
            className="text-2xl leading-none"
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        {/* Main menu */}
        {!activeCategory && (
          <nav className="overflow-y-auto px-4">
            {navigation.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openCategory(item)}
                className="flex w-full items-center justify-between border-b border-gray-300 py-4 text-left text-[12px] tracking-[0.04em]"
              >
                <span>{item.label}</span>

                {item.megaMenu && (
                  <span className="text-lg font-light">›</span>
                )}
              </button>
            ))}

            <div className="mt-5 space-y-3">
              <Link
                to="/wishlist"
                onClick={closeMenu}
                className="flex h-12 items-center justify-center rounded-md border border-gray-900 text-[12px] no-underline"
              >
                WISHLIST
              </Link>

              <Link
                to="/login"
                onClick={closeMenu}
                className="flex h-12 items-center justify-center rounded-md border border-gray-900 text-[12px] no-underline"
              >
                LOG IN
              </Link>
            </div>
          </nav>
        )}

        {/* Category submenu */}
        {activeCategory && activeItem?.megaMenu && (
          <div className="h-[calc(100dvh-56px)] overflow-y-auto px-4">

            {activeItem.megaMenu.columns.map((column) => {
              const isExpanded = expandedSection === column.id;

              return (
                <div key={column.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedSection(
                        isExpanded ? null : column.id
                      )
                    }
                    className="flex w-full items-center justify-between border-b border-gray-300 py-4 text-left text-[12px] tracking-[0.04em]"
                  >
                    <span>{column.title}</span>

                    <span className="text-lg font-light">
                      {isExpanded ? "⌃" : "⌄"}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="py-3">
                      {column.links.map((link) => (
                        <Link
                          key={link.label}
                          to={link.href}
                          onClick={closeMenu}
                          className="block py-3 text-[13px] no-underline"
                        >
                          {link.label}
                        </Link>
                      ))}

                      <Link
                        to={column.links[0]?.href || "#"}
                        onClick={closeMenu}
                        className="mt-2 block border-b border-gray-300 pb-4 pt-2 text-[13px] no-underline"
                      >
                        View All
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}

            {/* View all */}
            <Link
              to={activeItem.href}
              onClick={closeMenu}
              className="block border-b border-gray-300 py-4 text-[12px] no-underline"
            >
              VIEW ALL
            </Link>

            {/* Promo cards */}
            <div className="grid grid-cols-2 gap-3 py-5">
              {activeItem.megaMenu.promos.map((promo) => (
                <Link
                  key={promo.id}
                  to={promo.href}
                  onClick={closeMenu}
                  className="block no-underline"
                >
                  <img
                    src={promo.url}
                    alt={promo.label}
                    className="aspect-4/5 w-full object-cover rounded-md"
                  />

                  <span className="mt-2 block text-[10px] underline underline-offset-2">
                    {promo.label}
                  </span>
                </Link>
              ))}
            </div>

          </div>
        )}
      </aside>
    </>
  );
}

export default MobileMenu;