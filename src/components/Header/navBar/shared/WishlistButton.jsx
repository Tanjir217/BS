import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useWishlist } from "../../../../context/WishlistContext";

function WishlistButton() {
  const { count } = useWishlist();

  return (
    <Link
      to="/wishlist"
      aria-label={"Wishlist" + (count > 0 ? ", " + count + " items" : "")}
      className="relative inline-flex items-center justify-center"
    >
      <Heart color="#5A1020" size={21} strokeWidth={1.5} />
      {count > 0 && (
        <span
          className="absolute -right-2 -top-2 grid min-h-4 min-w-4 place-items-center rounded-full bg-[#5A1020] px-1 text-[9px] leading-none text-white"
          aria-hidden="true"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

export default WishlistButton;