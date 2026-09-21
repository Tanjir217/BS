import { Link } from "react-router-dom";

function DesktopNavigation({
  navigation = [],
  onMenuChange,
  isLoading,
}) {
  if (isLoading) {
    return (
      <nav
        aria-label="Main navigation"
        aria-busy="true"
        className="flex items-center gap-8"
      >
        <span className="h-4 w-14 animate-pulse rounded bg-black/5" />
        <span className="h-4 w-12 animate-pulse rounded bg-black/5" />
        <span className="h-4 w-16 animate-pulse rounded bg-black/5" />
        <span className="h-4 w-14 animate-pulse rounded bg-black/5" />
      </nav>
    );
  }

  return (
    <nav
      aria-label="Main navigation"
      className="flex items-center gap-8"
    >
      {navigation.map((item) => (
        <Link
          key={item.id}
          to={item.href}
          onMouseEnter={() =>
            onMenuChange(
              item.megaMenu
                ? item.id
                : null
            )
          }
          onFocus={() =>
            onMenuChange(
              item.megaMenu
                ? item.id
                : null
            )
          }
          className="text-md tracking-wide text-[#1C1C1C] no-underline transition-opacity hover:opacity-60"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export default DesktopNavigation;