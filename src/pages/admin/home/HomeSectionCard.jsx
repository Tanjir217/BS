import HomeSectionStatusBadge from "./HomeSectionStatusBadge";

function HomeSectionCard({ section, onManage, onToggle }) {
  const isActive = Boolean(section.isActive);

  return (
    <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/35">
            {section.type}
          </p>

          <h2 className="mt-2 text-lg font-semibold text-black">
            {section.title || section.section_key}
          </h2>

          {section.sub_title && (
            <p className="mt-1 text-sm text-black/50">
              {section.sub_title}
            </p>
          )}
        </div>

        <HomeSectionStatusBadge isActive={isActive} />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/6 pt-4">
        <span className="text-xs text-black/40">
          Position {section.sortOrder ?? 0}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggle(section)}
            className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
              isActive
                ? "border-black/10 text-black/60 hover:bg-black/5"
                : "border-black bg-black text-white hover:bg-black/80"
            }`}
          >
            {isActive ? "Hide" : "Publish"}
          </button>

          <button
            type="button"
            onClick={onManage}
            className="rounded-lg bg-black px-4 py-2 text-xs font-medium text-white transition hover:bg-black/80"
          >
            Manage
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomeSectionCard;
