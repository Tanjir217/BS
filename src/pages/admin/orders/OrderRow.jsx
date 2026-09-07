import OrderStatusBadge from "./OrderStatusBadge";

function formatPrice(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD")}`;
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function OrderRow({ order }) {
  return (
    <tr className="border-b border-black/6 last:border-b-0">
      <td className="px-6 py-4">
        <div>
          <p className="font-medium text-black">
            {order.order_Number}
          </p>

          <p className="mt-0.5 text-xs text-black/40">
            {formatDate(order.$createdAt)}
          </p>
        </div>
      </td>

      <td className="px-6 py-4">
        <div>
          <p className="font-medium text-black">
            {order.customer_Name}
          </p>

          <p className="mt-0.5 text-xs text-black/45">
            {order.customer_Phone}
          </p>
        </div>
      </td>

      <td className="px-6 py-4 text-sm font-medium text-black">
        {formatPrice(order.total)}
      </td>

      <td className="px-6 py-4">
        <OrderStatusBadge
          status={order.payment_Status}
          type="payment"
        />
      </td>

      <td className="px-6 py-4">
        <OrderStatusBadge
          status={order.order_Status}
          type="order"
        />
      </td>

      <td className="px-6 py-4 text-right">
        <button
          type="button"
          className="text-sm font-medium text-black/60 transition hover:text-black"
        >
          View
        </button>
      </td>
    </tr>
  );
}

export default OrderRow;