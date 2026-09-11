import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function MobileMenu({
  navigation = [],
  isLoading,
}) {
  const [isOpen, setIsOpen] =
    useState(false);

  const [activeCategory, setActiveCategory] =
    useState(null);

  useEffect(() => {
    document.body.style.overflow =
      isOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const closeMenu = () => {
    setIsOpen(false);
    setActiveCategory(null);
  };

  const activeItem =
    navigation.find(
      (item) =>
        item.id === activeCategory
    );

  const openCategory = (item) => {
    if (!item.megaMenu) {
      return;
    }

    setActiveCategory(item.id);
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
        <span className="text-xl">
          ☰
        </span>
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
          isOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4">
          {activeCategory ? (
            <button
              type="button"
              onClick={() =>
                setActiveCategory(null)
              }
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
          <nav className="h-[calc(100dvh-56px)] overflow-y-auto px-4">
            {isLoading ? (
              <div className="space-y-4 py-5">
                <div className="h-5 animate-pulse rounded bg-black/5" />
                <div className="h-5 animate-pulse rounded bg-black/5" />
                <div className="h-5 animate-pulse rounded bg-black/5" />
              </div>
            ) : (
              <>
                {navigation.map((item) =>
                  item.megaMenu ? (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        openCategory(item)
                      }
                      className="flex w-full items-center justify-between border-b border-gray-300 py-4 text-left text-[12px] tracking-[0.04em]"
                    >
                      <span>
                        {item.label}
                      </span>

                      <span className="text-lg font-light">
                        ›
                      </span>
                    </button>
                  ) : (
                    <Link
                      key={item.id}
                      to={item.href}
                      onClick={closeMenu}
                      className="flex w-full items-center justify-between border-b border-gray-300 py-4 text-left text-[12px] tracking-[0.04em] no-underline"
                    >
                      <span>
                        {item.label}
                      </span>
                    </Link>
                  )
                )}

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
              </>
            )}
          </nav>
        )}

        {/* Category submenu */}
        {activeCategory &&
          activeItem?.megaMenu && (
            <div className="h-[calc(100dvh-56px)] overflow-y-auto px-4">
              <div className="pb-6">
                {activeItem.megaMenu.columns.map(
                  (column) => (
                    <section
                      key={column.id}
                      className="border-b border-gray-300 py-4"
                    >
                      {/* Column title */}
                      <h2 className="text-[12px] font-medium tracking-[0.08em]">
                        {column.title}
                      </h2>

                      {/* Category links */}
                      {column.links?.length > 0 && (
                        <ul className="mt-3 space-y-1">
                          {column.links.map(
                            (link) => (
                              <li
                                key={
                                  link.id ||
                                  link.label
                                }
                              >
                                <Link
                                  to={
                                    link.href
                                  }
                                  onClick={
                                    closeMenu
                                  }
                                  className="block py-2 text-[13px] text-black/75 no-underline transition-opacity hover:opacity-60"
                                >
                                  {
                                    link.label
                                  }
                                </Link>
                              </li>
                            )
                          )}
                        </ul>
                      )}

                      {/* Section View All */}
                      {column.href && (
                        <Link
                          to={column.href}
                          onClick={closeMenu}
                          className="mt-3 inline-block text-[11px] font-medium uppercase tracking-[0.08em] underline underline-offset-4 no-underline"
                        >
                          View All
                        </Link>
                      )}
                    </section>
                  )
                )}

                {/* Main category View All */}
                <Link
                  to={activeItem.href}
                  onClick={closeMenu}
                  className="block py-5 text-[12px] font-medium uppercase tracking-[0.08em] underline underline-offset-4 no-underline"
                >
                  View All {activeItem.label}
                </Link>

                {/* Promo cards */}
                {activeItem.megaMenu
                  .promos?.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 py-5">
                    {activeItem.megaMenu.promos.map(
                      (promo) => (
                        <Link
                          key={promo.id}
                          to={promo.href}
                          onClick={closeMenu}
                          className="block no-underline"
                        >
                          <img
                            src={promo.url}
                            alt={promo.label}
                            className="aspect-[4/5] w-full rounded-md object-cover"
                          />

                          <span className="mt-2 block text-[10px] underline underline-offset-2">
                            {promo.label}
                          </span>
                        </Link>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
      </aside>
    </>
  );
}

export default MobileMenu;