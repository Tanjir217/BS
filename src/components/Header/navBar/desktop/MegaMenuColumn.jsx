import { Link } from "react-router-dom";

function MegaMenuColumn({ column }) {
  return (
    <div>
      <h3 className="mb-5 text-lg font-semibold tracking-widest text-gray-900">
        {column.title}
      </h3>

      <ul className="m-0 list-none p-0">
        {column.links.map((link) => (
          <li
            key={link.label}
            className={link.separated ? "mt-3 border-t border-gray-300 pt-4" : ""}
          >
            <Link
              to={link.href}
              className="block py-1 text-md text-gray-900 no-underline transition-opacity hover:opacity-60"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <Link
        to={`${column.links[0]?.href.split("/").slice(0, 3).join("/")}`}
        className="mt-5 block border-t border-gray-300 pt-5 text-lg text-gray-900 no-underline hover:opacity-60"
      >
        View All
      </Link>
    </div>
  );
}

export default MegaMenuColumn;