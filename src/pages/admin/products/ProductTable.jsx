import ProductRow from "./ProductRow";
import ProductEmptyState from "./ProductEmptyState";

function ProductTable({
  products,
  categories,
  isLoading,
  onEdit,
  onDelete,
}) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-black/8 bg-white p-8 text-sm text-black/50">
        Loading products...
      </div>
    );
  }

  if (products.length === 0) {
    return <ProductEmptyState />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-black/8 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead className="border-b border-black/8 bg-black/[0.02]">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-black/40">
                Product
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-black/40">
                SKU
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-black/40">
                Category
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-black/40">
                Price
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-black/40">
                Stock
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-black/40">
                Discount
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
            {products.map((product) => (
              <ProductRow
                key={product.$id}
                product={product}
                categories={categories}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProductTable;