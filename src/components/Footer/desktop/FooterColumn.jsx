import { Link } from "react-router-dom";

function FooterColumn({ column }) {
    return (
        <div className="md:border-l border-gray-500 pl-6 w-full">
        <h3 className="mb-6 text-sm font-semibold tracking-[0.12em]">
            {column.title}
        </h3>

        <ul className="space-y-3">
            {column.links.map((link) => (
            <li key={link.label}>
                <Link
                to={link.href}
                className="text-[12px] tracking-[0.04em] text-gray-700 no-underline transition-opacity duration-200 hover:opacity-50"
                >
                {link.label}
                </Link>
            </li>
            ))}
        </ul>
        </div>
    );
}

export default FooterColumn;