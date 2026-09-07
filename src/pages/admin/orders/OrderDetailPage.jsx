import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  getOrderWithItems,
  updateOrderStatus,
  updatePaymentStatus,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
} from "../../../services/orderServices";

import OrderStatusBadge from "./OrderStatusBadge";

function formatPrice(amount) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
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

      setOrder(result.order);
      setItems(result.items);
    } catch (err) {
      console.error("Failed to load order:", err);
      setError(err.message || "Failed to load order.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleOrderStatusChange = async (event) => {
    const newStatus = event.target.value;

    if (!newStatus || newStatus === order.order_Status) {
      return;
    }

    setUpdatingOrderStatus(true);
    setError("");

    try {
      const updatedOrder = await updateOrderStatus(orderId, newStatus);

      setOrder(updatedOrder);
    } catch (err) {
      console.error("Failed to update order status:", err);
      setError(err.message || "Failed to update order status.");
    } finally {
      setUpdatingOrderStatus(false);
    }
  };

  const handlePaymentStatusChange = async (event) => {
    const newStatus = event.target.value;

    if (!newStatus || newStatus === order.payment_Status) {
      return;
    }

    setUpdatingPaymentStatus(true);
    setError("");

    try {
      const updatedOrder = await updatePaymentStatus(orderId, newStatus);

      setOrder(updatedOrder);
    } catch (err) {
      console.error("Failed to update payment status:", err);
      setError(err.message || "Failed to update payment status.");
    } finally {
      setUpdatingPaymentStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p>Loading order...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="p-6">
        <button
          type="button"
          onClick={() => navigate("/admin/orders")}
          className="mb-4"
        >
          ← Back to orders
        </button>

        <div>
          <h1>Unable to load order</h1>
          <p>{error}</p>

          <button type="button" onClick={loadOrder}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to="/admin/orders">← Back to orders</Link>

          <h1 className="mt-2 text-2xl font-bold">
            Order {order.order_Number}
          </h1>

          <p className="text-sm text-gray-500">
            Placed on {formatDate(order.$createdAt)}
          </p>
        </div>

        <OrderStatusBadge status={order.order_Status} />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded border border-red-300 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Order status controls */}
      <section className="mb-6 rounded-lg border bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold">Order status</h2>

        <select
          value={order.order_Status}
          onChange={handleOrderStatusChange}
          disabled={updatingOrderStatus}
          className="rounded border px-3 py-2"
        >
          {Object.values(ORDER_STATUSES).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        {updatingOrderStatus && (
          <span className="ml-3 text-sm text-gray-500">Updating...</span>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Customer */}
        <section className="rounded-lg border bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold">Customer</h2>

          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Name:</span> {order.customer_Name}
            </p>

            <p>
              <span className="font-medium">Phone:</span> {order.customer_Phone}
            </p>

            {order.customer_Email && (
              <p>
                <span className="font-medium">Email:</span>{" "}
                {order.customer_Email}
              </p>
            )}
          </div>
        </section>

        {/* Shipping */}
        <section className="rounded-lg border bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold">Shipping</h2>

          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Address:</span>{" "}
              {order.shipping_Address}
            </p>

            <p>
              <span className="font-medium">City:</span> {order.shipping_City}
            </p>

            {order.shipping_Postal_Code && (
              <p>
                <span className="font-medium">Postal code:</span>{" "}
                {order.shipping_Postal_Code}
              </p>
            )}
          </div>
        </section>

        {/* Payment */}
        <section className="rounded-lg border bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold">Payment</h2>

          <div className="space-y-3 text-sm">
            <p>
              <span className="font-medium">Method:</span>{" "}
              {order.payment_Method}
            </p>

            <div>
              <p className="mb-1 font-medium">Status</p>

              <select
                value={order.payment_Status}
                onChange={handlePaymentStatusChange}
                disabled={updatingPaymentStatus}
                className="rounded border px-3 py-2"
              >
                {Object.values(PAYMENT_STATUSES).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>
      </div>

      {/* Products */}
      <section className="mt-6 rounded-lg border bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold">Products</h2>

        {items.length === 0 ? (
          <p className="text-sm text-gray-500">
            No products found for this order.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-3">Product</th>
                  <th className="px-3 py-3">SKU</th>
                  <th className="px-3 py-3">Color</th>
                  <th className="px-3 py-3">Price</th>
                  <th className="px-3 py-3">Qty</th>
                  <th className="px-3 py-3 text-right">Total</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.$id} className="border-b">
                    <td className="px-3 py-3 font-medium">
                      {item.product_Name}
                    </td>

                    <td className="px-3 py-3">{item.product_SKU || "—"}</td>

                    <td className="px-3 py-3">{item.product_Color || "—"}</td>

                    <td className="px-3 py-3">
                      {formatPrice(item.unit_Price)}
                    </td>

                    <td className="px-3 py-3">{item.quantity}</td>

                    <td className="px-3 py-3 text-right font-medium">
                      {formatPrice(item.line_Total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Summary */}
      <section className="mt-6 flex justify-end">
        <div className="w-full max-w-md rounded-lg border bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold">Order summary</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>

            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{formatPrice(order.shipping_Cost)}</span>
            </div>

            <div className="flex justify-between">
              <span>Discount</span>
              <span>-{formatPrice(order.discount)}</span>
            </div>

            <div className="flex justify-between border-t pt-3 text-lg font-bold">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Notes */}
      {order.notes && (
        <section className="mt-6 rounded-lg border bg-white p-5">
          <h2 className="mb-3 text-lg font-semibold">Notes</h2>

          <p className="text-sm text-gray-600">{order.notes}</p>
        </section>
      )}
    </div>
  );
}

export default OrderDetailPage;
