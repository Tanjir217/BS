import OrderRow from "./OrderRow";
import OrderEmptyState from "./OrderEmptyState";

function OrderTable({
  orders,
  isLoading,
  hasActiveFilters,
}) {
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-black/8 bg-white">
        <div className="divide-y divide-black/6">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="flex animate-pulse items-center justify-between gap-6 px-6 py-5"
            >
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-black/8" />
                <div className="h-3 w-20 rounded bg-black/6" />
              </div>

              <div className="h-4 w-24 rounded bg-black/8" />
              <div className="h-6 w-20 rounded-full bg-black/8" />
              <div className="h-6 w-20 rounded-full bg-black/8" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <OrderEmptyState
        hasActiveFilters={hasActiveFilters}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-black/8 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="border-b border-black/8 bg-black/[0.02]">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-black/40">
                Order
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-black/40">
                Customer
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-black/40">
                Total
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-black/40">
                Payment
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-black/40">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <OrderRow
                key={order.$id}
                order={order}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default OrderTable;