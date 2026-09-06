import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";

const orders = [
  {
    id: "#BS1024",
    customer: "Tanjir",
    total: "৳36,800",
    status: "Processing",
    date: "Sep 6",
  },
  {
    id: "#BS1023",
    customer: "Rahim",
    total: "৳27,800",
    status: "Shipped",
    date: "Sep 5",
  },
  {
    id: "#BS1022",
    customer: "Karim",
    total: "৳15,200",
    status: "Delivered",
    date: "Sep 5",
  },
  {
    id: "#BS1021",
    customer: "Nusrat",
    total: "৳24,500",
    status: "Pending",
    date: "Sep 4",
  },
];

function RecentOrders() {
  return (
    <SectionCard
      title="Recent Orders"
      description="Latest orders placed in your store"
      action={
        <button className="text-xs font-medium underline underline-offset-4">
          View all
        </button>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-150">
          <thead>
            <tr className="border-b border-black/8 text-left">
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/35">
                Order
              </th>

              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/35">
                Customer
              </th>

              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/35">
                Total
              </th>

              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/35">
                Status
              </th>

              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/35">
                Date
              </th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-b border-black/6 last:border-0"
              >
                <td className="px-5 py-4 text-sm font-medium">
                  {order.id}
                </td>

                <td className="px-5 py-4 text-sm text-black/60">
                  {order.customer}
                </td>

                <td className="px-5 py-4 text-sm font-medium">
                  {order.total}
                </td>

                <td className="px-5 py-4">
                  <StatusBadge status={order.status} />
                </td>

                <td className="px-5 py-4 text-xs text-black/40">
                  {order.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

export default RecentOrders;