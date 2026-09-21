function ProductStatusBadge({ isActive }) {
    return (
      <span
        className={[
          "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
          isActive
            ? "bg-emerald-50 text-emerald-700"
            : "bg-black/5 text-black/45",
        ].join(" ")}
      >
        {isActive ? "Active" : "Inactive"}
      </span>
    );
  }
  
  export default ProductStatusBadge;