import { Pencil, Trash2 } from "lucide-react";
import CategoryStatusBadge from "./CategoryStatusBadge";
import CategoryEmptyState from "./CategoryEmptyState";

function CategoryTable({
  categories,
  isLoading,
  onEdit,
  onDelete,
}) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-black/8 bg-white p-8 text-sm text-black/50">
        Loading categories...
      </div>
    );
  }

  if (categories.length === 0) {
    return <CategoryEmptyState />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-black/8 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="border-b border-black/8 bg-black/[0.02]">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-black/40">
                Category
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-black/40">
                Slug
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-black/40">
                Description
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-black/40">
                Status
              </th>

              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-black/40">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {categories.map((category) => (
              <tr
                key={category.$id}
                className="border-b border-black/6 last:border-b-0"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="h-11 w-11 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/5 text-xs text-black/35">
                        —
                      </div>
                    )}

                    <span className="font-medium">
                      {category.name}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4 text-sm text-black/55">
                  {category.slug}
                </td>

                <td className="max-w-xs px-6 py-4 text-sm text-black/50">
                  <p className="truncate">
                    {category.description || "No description"}
                  </p>
                </td>

                <td className="px-6 py-4">
                  <CategoryStatusBadge
                    isActive={category.isActive}
                  />
                </td>

                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(category)}
                      className="rounded-lg p-2 text-black/50 transition hover:bg-black/5 hover:text-black"
                      title="Edit category"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(category.$id)}
                      className="rounded-lg p-2 text-black/50 transition hover:bg-red-50 hover:text-red-600"
                      title="Delete category"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CategoryTable;