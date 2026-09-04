import { Link } from "react-router-dom";
import MegaMenuColumn from "./MegaMenuColumn";

function MegaMenu({ data, isOpen, onClose }) {
  return (
    <div
      className={`
        relative left-0 top-full z-50 w-full
        border-t border-gray-200 bg-white
        transition-all duration-300 ease-out
        ${
          isOpen
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-2 opacity-0"
        }
      `}
    >
      {data && (
        <div className="mx-auto max-w-360 px-10 py-6">
          <div className="grid grid-cols-12 gap-8">

            <div className="col-span-8 grid grid-cols-4 gap-10">
              {data.columns.map((column) => (
                <MegaMenuColumn
                  key={column.id}
                  column={column}
                />
              ))}
            </div>

            <div className="col-span-4 grid grid-cols-2 gap-6">
              {data.promos.map((promo) => (
                <Link
                  key={promo.id}
                  to={promo.href}
                  onClick={onClose}
                  className="group block no-underline"
                >
                  <div className="overflow-hidden">
                    <img
                      src={promo.url}
                      alt={promo.label}
                      className="aspect-4/5 w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.02] rounded-md"
                    />
                  </div>

                  <span className="mt-2 block text-[12px] tracking-wider text-gray-900 underline underline-offset-2">
                    {promo.label}
                  </span>
                </Link>
              ))}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default MegaMenu;