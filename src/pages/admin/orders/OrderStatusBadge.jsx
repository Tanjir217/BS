import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "../../../services/orderServices";

function OrderStatusBadge({
  status,
  type = "order",
}) {
  const label =
    type === "payment"
      ? PAYMENT_STATUS_LABELS[status]
      : ORDER_STATUS_LABELS[status];

  return (
    <span className="inline-flex rounded-full border border-black/10 bg-black/[0.03] px-2.5 py-1 text-xs font-medium text-black/65">
      {label || status || "Unknown"}
    </span>
  );
}

export default OrderStatusBadge;