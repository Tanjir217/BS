
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  getAllowedOrderStatuses,
  getOrderWithItems,
  updateOrderStatus,
  updatePaymentStatus,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUSES,
  ORDER_STATUS_LABELS,
} from "../../../services/orderServices";

import OrderStatusBadge from "./OrderStatusBadge";

function formatPrice(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD")}`;
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false);
  const [updatingPaymentStatus, setUpdatingPaymentStatus] = useState(false);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getOrderWithItems(orderId);

      if (!result) {
        setOrder(null);
        setItems([]);
        setError("Order not found.");
        return;
      }

      setOrder(result.order);
      setItems(result.items);
    } catch (err) {
      console.error("Failed to load order:", err);

      setOrder(null);
      setItems([]);
      setError(err.message || "Failed to load order.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleOrderStatusChange = async (event) => {
    const nextStatus = event.target.value;

    if (!nextStatus || nextStatus === order.order_Status) {
      return;
    }

    setUpdatingOrderStatus(true);
    setError("");

    try {
      const updatedOrder = await updateOrderStatus(
        orderId,
        nextStatus
      );

      setOrder(updatedOrder);
    } catch (err) {
      console.error("Failed to update order status:", err);

      setError(
        err.message || "Failed to update order status."
      );
    } finally {
      setUpdatingOrderStatus(false);
    }
  };

  const handlePaymentStatusChange = async (event) => {
    const nextStatus = event.target.value;

    if (!nextStatus || nextStatus === order.payment_Status) {
      return;
    }

    setUpdatingPaymentStatus(true);
    setError("");

    try {
      const updatedOrder = await updatePaymentStatus(
        orderId,
        nextStatus
      );

      setOrder(updatedOrder);
    } catch (err) {
      console.error("Failed to update payment status:", err);

      setError(
        err.message || "Failed to update payment status."
      );
    } finally {
      setUpdatingPaymentStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-black/60">
          Loading order...
        </p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="p-6">
        <button
          type="button"
          onClick={() => navigate("/admin/orders")}
          className="mb-6 text-sm font-medium underline underline-offset-2"
        >
          ← Back to orders
        </button>

        <div className="rounded-lg border border-red-200 bg-red-50 p-5">
          <h1 className="text-lg font-semibold text-red-800">
            Unable to load order
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={loadOrder}
            className="mt-4 rounded-md border px-4 py-2 text-sm font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const allowedStatuses = getAllowedOrderStatuses(
    order.order_Status
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/admin/orders"
            className="text-sm font-medium underline underline-offset-2"
          >
            ← Back to orders
          </Link>

          <h1 className="mt-3 text-2xl font-bold text-black">
            Order {order.order_Number}
          </h1>

          <p className="mt-1 text-sm text-black/45">
            Placed on {formatDate(order.$createdAt)}
          </p>
        </div>

        <OrderStatusBadge
          status={order.order_Status}
          type="order"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Status controls */}
      <section className="mb-6 rounded-lg border border-black/8 bg-white p-5">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Order status */}
          <div>
            <h2 className="mb-2 text-sm font-semibold text-black">
              Order status
            </h2>

            <select
              value={order.order_Status}
              onChange={handleOrderStatusChange}
              disabled={
                updatingOrderStatus ||
                allowedStatuses.length <= 1
              }
              className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none"
            >
              {allowedStatuses.map((status) => (
                <option key={status} value={status}>
                  {ORDER_STATUS_LABELS[status] || status}
                </option>
              ))}
            </select>

            {updatingOrderStatus && (
              <p className="mt-2 text-xs text-black/45">
                Updating order status...
              </p>
            )}
          </div>

          {/* Payment status */}
          <div>
            <h2 className="mb-2 text-sm font-semibold text-black">
              Payment status
            </h2>

            <select
              value={order.payment_Status}
              onChange={handlePaymentStatusChange}
              disabled={updatingPaymentStatus}
              className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none"
            >
              {Object.values(PAYMENT_STATUSES).map((status) => (
                <option key={status} value={status}>
                  {PAYMENT_STATUS_LABELS[status] || status}
                </option>
              ))}
            </select>

            {updatingPaymentStatus && (
              <p className="mt-2 text-xs text-black/45">
                Updating payment status...
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Customer / Shipping / Payment */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Customer */}
        <section className="rounded-lg border border-black/8 bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-black">
            Customer
          </h2>

          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-black/40">Name</p>
              <p className="mt-0.5 font-medium">
                {order.customer_Name || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-black/40">Phone</p>
              <p className="mt-0.5">
                {order.customer_Phone || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-black/40">Email</p>
              <p className="mt-0.5 break-words">
                {order.customer_Email || "—"}
              </p>
            </div>
          </div>
        </section>

        {/* Shipping */}
        <section className="rounded-lg border border-black/8 bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-black">
            Shipping
          </h2>

          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-black/40">Address</p>
              <p className="mt-0.5">
                {order.shipping_Address || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-black/40">City</p>
              <p className="mt-0.5">
                {order.shipping_City || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-black/40">
                Postal code
              </p>
              <p className="mt-0.5">
                {order.shipping_Postal_Code || "—"}
              </p>
            </div>
          </div>
        </section>

        {/* Payment */}
        <section className="rounded-lg border border-black/8 bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-black">
            Payment
          </h2>

          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-black/40">
                Payment method
              </p>
              <p className="mt-0.5 font-medium">
                {order.payment_Method || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-black/40">
                Payment status
              </p>

              <div className="mt-1">
                <OrderStatusBadge
                  status={order.payment_Status}
                  type="payment"
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Products */}
      <section className="mt-6 rounded-lg border border-black/8 bg-white">
        <div className="border-b border-black/6 px-5 py-4">
          <h2 className="text-base font-semibold text-black">
            Ordered products
          </h2>

          <p className="mt-1 text-sm text-black/45">
            {items.length}{" "}
            {items.length === 1 ? "item" : "items"}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-black/45">
            No products found for this order.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/6 text-xs text-black/45">
                  <th className="px-5 py-3 font-medium">
                    Product
                  </th>

                  <th className="px-5 py-3 font-medium">
                    SKU
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Color
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Unit price
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Qty
                  </th>

                  <th className="px-5 py-3 text-right font-medium">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.$id}
                    className="border-b border-black/5 last:border-b-0"
                  >
                    <td className="px-5 py-4 font-medium text-black">
                      {item.product_Name || "—"}
                    </td>

                    <td className="px-5 py-4 text-black/60">
                      {item.product_SKU || "—"}
                    </td>

                    <td className="px-5 py-4 text-black/60">
                      {item.product_Color || "—"}
                    </td>

                    <td className="px-5 py-4">
                      {formatPrice(item.unit_Price)}
                    </td>

                    <td className="px-5 py-4">
                      {item.quantity}
                    </td>

                    <td className="px-5 py-4 text-right font-medium">
                      {formatPrice(item.line_Total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Order summary */}
      <section className="mt-6 flex justify-end">
        <div className="w-full max-w-md rounded-lg border border-black/8 bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-black">
            Order summary
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-black/55">
                Subtotal
              </span>

              <span>
                {formatPrice(order.subtotal)}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-black/55">
                Shipping
              </span>

              <span>
                {formatPrice(order.shipping_Cost)}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-black/55">
                Discount
              </span>

              <span>
                -{formatPrice(order.discount)}
              </span>
            </div>

            <div className="flex justify-between gap-4 border-t border-black/8 pt-3 text-base font-bold">
              <span>Total</span>

              <span>
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Notes */}
      {order.notes && (
        <section className="mt-6 rounded-lg border border-black/8 bg-white p-5">
          <h2 className="mb-3 text-base font-semibold text-black">
            Notes
          </h2>

          <p className="whitespace-pre-wrap text-sm leading-6 text-black/65">
            {order.notes}
          </p>
        </section>
      )}
    </div>
  );
}

export default OrderDetailPage;
