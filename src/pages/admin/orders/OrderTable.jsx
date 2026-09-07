import OrderRow from "./OrderRow";
import OrderEmptyState from "./OrderEmptyState";

function OrderTable({ orders, isLoading }) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-black/8 bg-white p-8 text-sm text-black/50">
        Loading orders...
      </div>
    );
  }

  if (orders.length === 0) {
    return <OrderEmptyState />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-black/8 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
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

              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-black/40">
                Actions
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