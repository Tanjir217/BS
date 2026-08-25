import { Link } from "react-router-dom";

function MegaMenuColumn({ column }) {
  return (
    <div>
      <h3 className="mb-7 text-[12px] font-normal tracking-widest text-gray-900">
        {column.title}
      </h3>

      <ul className="m-0 list-none p-0">
        {column.links.map((link) => (
          <li
            key={link.label}
            className={link.separated ? "mt-7 border-t border-gray-300 pt-6" : ""}
          >
            <Link
              to={link.href}
              className="block py-2 text-[13px] text-gray-900 no-underline transition-opacity hover:opacity-60"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <Link
        to={`${column.links[0]?.href.split("/").slice(0, 3).join("/")}`}
        className="mt-5 block border-t border-gray-300 pt-5 text-[13px] text-gray-900 no-underline hover:opacity-60"
      >
        View All
      </Link>
    </div>
  );
}

export default MegaMenuColumn;