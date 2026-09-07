import OrderStatusBadge from "./OrderStatusBadge";

function formatPrice(value) {
  return `৳${Number(value || 0).toLocaleString(
    "en-BD"
  )}`;
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function OrderRow({ order }) {
  return (
    <tr className="border-b border-black/6 last:border-b-0 transition hover:bg-black/[0.015]">
      {/* Order */}
      <td className="px-6 py-4">
        <div>
          <p className="font-medium text-black">
            {order.order_Number || "—"}
          </p>

          <p className="mt-0.5 text-xs text-black/40">
            {formatDate(order.$createdAt)}
          </p>
        </div>
      </td>

      {/* Customer */}
      <td className="px-6 py-4">
        <div>
          <p className="font-medium text-black">
            {order.customer_Name || "—"}
          </p>

          <p className="mt-0.5 text-xs text-black/45">
            {order.customer_Phone || "No phone"}
          </p>
        </div>
      </td>

      {/* Total */}
      <td className="px-6 py-4 text-sm font-semibold text-black">
        {formatPrice(order.total)}
      </td>

      {/* Payment */}
      <td className="px-6 py-4">
        <OrderStatusBadge
          status={order.payment_Status}
          type="payment"
        />
      </td>

      {/* Order status */}
      <td className="px-6 py-4">
        <OrderStatusBadge
          status={order.order_Status}
          type="order"
        />
      </td>
    </tr>
  );
}

export default OrderRow;