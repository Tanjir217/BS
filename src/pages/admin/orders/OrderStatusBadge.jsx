import {
    ORDER_STATUSES,
    PAYMENT_STATUSES,
  } from "../../../services/orderServices";
  
  function OrderStatusBadge({ status, type = "order" }) {
    const isOrderStatus = type === "order";
  
    const labels = isOrderStatus
      ? {
          [ORDER_STATUSES.PENDING]: "Pending",
          [ORDER_STATUSES.CONFIRMED]: "Confirmed",
          [ORDER_STATUSES.PROCESSING]: "Processing",
          [ORDER_STATUSES.SHIPPED]: "Shipped",
          [ORDER_STATUSES.DELIVERED]: "Delivered",
          [ORDER_STATUSES.CANCELLED]: "Cancelled",
        }
      : {
          [PAYMENT_STATUSES.PENDING]: "Pending",
          [PAYMENT_STATUSES.PAID]: "Paid",
          [PAYMENT_STATUSES.FAILED]: "Failed",
          [PAYMENT_STATUSES.REFUNDED]: "Refunded",
        };
  
    return (
      <span className="inline-flex rounded-full border border-black/10 bg-black/[0.03] px-2.5 py-1 text-xs font-medium text-black/65">
        {labels[status] || status}
      </span>
    );
  }
  
  export default OrderStatusBadge;