import { Search } from "lucide-react";
import { Link } from "react-router-dom";

function SearchButton() {
  return (
    <Link
      to="/search"
      aria-label="Search products"
      className="inline-flex items-center justify-center"
    >
      <Search color="#5A1020" />
    </Link>
  );
}

export default SearchButton;
