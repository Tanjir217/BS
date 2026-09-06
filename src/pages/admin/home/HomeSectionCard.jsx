import HomeSectionStatusBadge from "./HomeSectionStatusBadge";

function HomeSectionCard({ section, onManage }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            {section.type}
          </p>

          <h2 className="mt-1 text-lg font-semibold text-gray-900">
            {section.title || section.section_key}
          </h2>

          {section.sub_title && (
            <p className="mt-1 text-sm text-gray-500">
              {section.sub_title}
            </p>
          )}
        </div>

        <HomeSectionStatusBadge
          isActive={section.is_Active}
        />
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Position: {section.sort_Order}
        </span>

        <button
          type="button"
          onClick={onManage}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Manage
        </button>
      </div>
    </div>
  );
}

export default HomeSectionCard;