import { useCallback, useEffect, useMemo, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Package,
  Truck,
  XCircle,
} from "lucide-react";

import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { cancelCustomerOrder, ORDER_STATUS_LABELS } from "../../services/orderServices";
import {
  getCustomerOrderWithItems,
  getCustomerShipment,
} from "../../services/customerOrderServices";

const ORDER_TIMELINE = [
  { status: "pending", label: "Order placed", description: "Your order has been received." },
  { status: "confirmed", label: "Confirmed", description: "The store has confirmed your order." },
  { status: "processing", label: "Processing", description: "Your items are being prepared." },
  { status: "shipped", label: "Shipped", description: "Your parcel has left the store." },
  { status: "delivered", label: "Delivered", description: "Your order has been delivered." },
];

function formatPrice(value) {
  return Number(value || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 });
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-BD", { day: "2-digit", month: "long", year: "numeric" });
}

function OrderDetailPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { user, loading, isAuthenticated } = useCustomerAuth();

  const [orderData, setOrderData] = useState(null);
  const [shipment, setShipment] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  const loadOrder = useCallback(async () => {
    if (!user?.$id || !orderId) return;

    setLoadingOrder(true);
    setError("");

    try {
      const result = await getCustomerOrderWithItems(user.$id, orderId);
      if (!result) {
        setOrderData(null);
        setError("This order could not be found.");
        return;
      }
      setOrderData(result);

      const customerShipment = await getCustomerShipment(user.$id, orderId);
      if (!cancelled) {
        setShipment(customerShipment);
      }
    } catch (loadError) {
      console.error("Failed to load customer order:", loadError);
      setError(loadError?.message || "Unable to load this order.");
    } finally {
      setLoadingOrder(false);
    }
  }, [user?.$id, orderId]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/account/login", { replace: true, state: { from: `/account/orders/${orderId}` } });
    }
  }, [loading, isAuthenticated, navigate, orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const timelineState = useMemo(() => {
    const status = orderData?.order?.order_Status;
    if (!status) return [];

    if (status === "cancelled") {
      return ORDER_TIMELINE.map((step) => ({ ...step, state: "cancelled" }));
    }

    const currentIndex = ORDER_TIMELINE.findIndex((step) => step.status === status);
    return ORDER_TIMELINE.map((step, index) => ({
      ...step,
      state: index < currentIndex ? "complete" : index === currentIndex ? "current" : "upcoming",
    }));
  }, [orderData?.order?.order_Status]);

  async function handleCancelOrder() {
    if (!orderData?.order) return;

    const confirmed = window.confirm("Cancel this order? Your reserved stock will be released and the order cannot be restored.");
    if (!confirmed) return;

    setCancelling(true);
    setError("");

    try {
      const updatedOrder = await cancelCustomerOrder(orderData.order.$id);
      setOrderData((current) => current ? { ...current, order: updatedOrder } : current);
    } catch (cancelError) {
      console.error("Failed to cancel customer order:", cancelError);
      setError(cancelError?.message || "Unable to cancel this order. Please try again.");
    } finally {
      setCancelling(false);
    }
  }

  if (loading || !isAuthenticated) return null;

  if (loadingOrder) {
    return <main className="account-page"><div className="account-page__container"><div className="customer-order-detail__loading">Loading order...</div></div></main>;
  }

  if (!orderData) {
    return (
      <main className="account-page">
        <div className="account-page__container">
          <div className="customer-order-detail__empty">
            <Package size={34} />
            <h1>Order not found.</h1>
            <p>{error || "This order is unavailable."}</p>
            <Link to="/account/orders">Back to Orders</Link>
          </div>
        </div>
      </main>
    );
  }

  const { order, items } = orderData;
  const status = order.order_Status || "pending";
  const canCancel = ["pending", "confirmed"].includes(status) && (order.payment_Status || "pending") === "pending";

  return (
    <main className="account-page">
      <div className="account-page__container">
        <section className="customer-order-detail">
          <Link to="/account/orders" className="customer-order-detail__back"><ArrowLeft size={16} />Back to Orders</Link>

          <header className="customer-order-detail__header">
            <div>
              <p>Order</p>
              <h1>{order.order_Number || order.$id}</h1>
              <span>Placed {formatDate(order.$createdAt)}</span>
            </div>
            <span className={`customer-order-status customer-order-status--${status}`}>{ORDER_STATUS_LABELS[status] || status}</span>
          </header>

          {error && <div className="customer-order-detail__error" role="alert"><AlertCircle size={17} /><span>{error}</span></div>}

          <section className="customer-order-timeline" aria-label="Order progress">
            <div className="customer-order-detail__section-heading"><Clock3 size={18} /><div><span>Progress</span><h2>Order timeline</h2></div></div>

            {status === "cancelled" && <div className="customer-order-cancelled-banner"><XCircle size={18} /><div><strong>Order cancelled</strong><span>This order will not be prepared or delivered.</span></div></div>}

            <ol className="customer-order-timeline__list">
              {timelineState.map((step) => (
                <li key={step.status} className={`customer-order-timeline__item customer-order-timeline__item--${step.state}`}>
                  <span className="customer-order-timeline__marker" aria-hidden="true">{step.state === "complete" || step.state === "current" ? <CheckCircle2 size={16} /> : <span />}</span>
                  <div><strong>{step.label}</strong><span>{step.description}</span></div>
                </li>
              ))}
            </ol>
          </section>

          <div className="customer-order-detail__layout">
            <div className="customer-order-detail__main">
              <section className="customer-order-detail__section">
                <div className="customer-order-detail__section-heading"><Package size={18} /><div><span>Items</span><h2>Your order</h2></div></div>
                <div className="customer-order-items">
                  {items.map((item) => (
                    <article key={item.$id} className="customer-order-item">
                      <div><strong>{item.product_Name}</strong>{item.product_SKU && <span>SKU {item.product_SKU}</span>}{item.product_Color && <span>Color {item.product_Color}</span>}</div>
                      <div><span>× {item.quantity}</span><strong>৳{formatPrice(item.line_Total)}</strong></div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="customer-order-detail__section">
                <div className="customer-order-detail__section-heading"><Truck size={18} /><div><span>Delivery</span><h2>Shipping information</h2></div></div>
                <div className="customer-order-address"><strong>{order.customer_Name}</strong><span>{order.customer_Phone}</span><span>{order.shipping_Address}</span><span>{order.shipping_City}{order.shipping_Postal_Code ? `, ${order.shipping_Postal_Code}` : ""}</span></div>
              </section>
            </div>

            <aside className="customer-order-detail__summary">
              <div><span>Order summary</span><h2>Payment</h2></div>
              <div className="customer-order-summary__rows">
                <div><span>Subtotal</span><strong>৳{formatPrice(order.subtotal)}</strong></div>
                <div><span>Delivery</span><strong>৳{formatPrice(order.shipping_Cost)}</strong></div>
                {Number(order.discount || 0) > 0 && <div><span>Discount</span><strong>−৳{formatPrice(order.discount)}</strong></div>}
                <div className="customer-order-summary__total"><span>Total</span><strong>৳{formatPrice(order.total)}</strong></div>
              </div>

              <div className="customer-order-summary__payment">
                <div><span>Payment method</span><strong>{order.payment_Method === "cod" ? "Cash on Delivery" : order.payment_Method || "—"}</strong></div>
                <div><span>Payment status</span><strong>{order.payment_Status || "pending"}</strong></div>
              </div>

              {canCancel && <button type="button" className="customer-order-cancel-button" onClick={handleCancelOrder} disabled={cancelling}><XCircle size={17} />{cancelling ? "Cancelling..." : "Cancel order"}</button>}

              {shipment?.consignment_ID && (
                <div className="customer-order-summary__shipment">
                  <div><span>Courier</span><strong>{shipment.provider === "pathao" ? "Pathao" : shipment.provider}</strong></div>
                  <div><span>Consignment</span><strong>{shipment.consignment_ID}</strong></div>
                  {shipment.tracking_URL && (
                    <a href={shipment.tracking_URL} target="_blank" rel="noreferrer">Track shipment</a>
                  )}
                </div>
              )}

              {status === "delivered" && (
                <>
                  <Link to={`/account/orders/${orderId}/return`} className="customer-order-return-button">Return or exchange</Link>
                  <div className="customer-order-summary__complete"><CheckCircle2 size={18} /><span>Your order has been delivered.</span></div>
                </>
              )}
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

export default OrderDetailPage;
