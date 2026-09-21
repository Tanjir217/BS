function HomeSectionStatusBadge({ isActive }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        isActive
          ? "bg-emerald-50 text-emerald-700"
          : "bg-black/5 text-black/45"
      }`}
    >
      {isActive ? "Live" : "Hidden"}
    </span>
  );
}

export default HomeSectionStatusBadge;
