import { useEffect, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import { ArrowLeft, CheckCircle2, Package, Truck } from "lucide-react";

import { useCustomerAuth } from "../../context/CustomerAuthContext";

import {
  getCustomerOrderWithItems,
  ORDER_STATUS_LABELS,
} from "../../services/customerOrderServices";

function formatPrice(value) {
  return Number(value || 0).toLocaleString("en-BD", {
    maximumFractionDigits: 0,
  });
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
    month: "long",
    year: "numeric",
  });
}

function OrderDetailPage() {
  const navigate = useNavigate();

  const { orderId } = useParams();

  const { user, loading, isAuthenticated } = useCustomerAuth();

  const [orderData, setOrderData] = useState(null);

  const [loadingOrder, setLoadingOrder] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/account/login", {
        replace: true,
        state: {
          from: `/account/orders/${orderId}`,
        },
      });
    }
  }, [loading, isAuthenticated, navigate, orderId]);

  useEffect(() => {
    if (!user?.$id || !orderId) {
      return;
    }

    let cancelled = false;

    async function loadOrder() {
      setLoadingOrder(true);
      setError("");

      try {
        const result = await getCustomerOrderWithItems(user.$id, orderId);

        if (cancelled) {
          return;
        }

        if (!result) {
          setOrderData(null);

          setError("This order could not be found.");

          return;
        }

        setOrderData(result);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Failed to load customer order:", error);

        setError(error?.message || "Unable to load this order.");
      } finally {
        if (!cancelled) {
          setLoadingOrder(false);
        }
      }
    }

    loadOrder();

    return () => {
      cancelled = true;
    };
  }, [user?.$id, orderId]);

  if (loading || !isAuthenticated) {
    return null;
  }

  if (loadingOrder) {
    return (
      <main className="account-page">
        <div className="account-page__container">
          <div className="customer-order-detail__loading">Loading order...</div>
        </div>
      </main>
    );
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

  return (
    <main className="account-page">
      <div className="account-page__container">
        <section className="customer-order-detail">
          <Link to="/account/orders" className="customer-order-detail__back">
            <ArrowLeft size={16} />
            Back to Orders
          </Link>

          <header className="customer-order-detail__header">
            <div>
              <p>Order</p>

              <h1>{order.order_Number || order.$id}</h1>

              <span>Placed {formatDate(order.$createdAt)}</span>
            </div>

            <span
              className={`customer-order-status customer-order-status--${status}`}
            >
              {ORDER_STATUS_LABELS[status] || status}
            </span>
          </header>

          <div className="customer-order-detail__layout">
            <div className="customer-order-detail__main">
              <section className="customer-order-detail__section">
                <div className="customer-order-detail__section-heading">
                  <Package size={18} />

                  <div>
                    <span>Items</span>

                    <h2>Your order</h2>
                  </div>
                </div>

                <div className="customer-order-items">
                  {items.map((item) => (
                    <article key={item.$id} className="customer-order-item">
                      <div>
                        <strong>{item.product_Name}</strong>

                        {item.product_SKU && (
                          <span>SKU {item.product_SKU}</span>
                        )}

                        {item.product_Color && (
                          <span>Color {item.product_Color}</span>
                        )}
                      </div>

                      <div>
                        <span>× {item.quantity}</span>

                        <strong>৳{formatPrice(item.line_Total)}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="customer-order-detail__section">
                <div className="customer-order-detail__section-heading">
                  <Truck size={18} />

                  <div>
                    <span>Delivery</span>

                    <h2>Shipping information</h2>
                  </div>
                </div>

                <div className="customer-order-address">
                  <strong>{order.customer_Name}</strong>

                  <span>{order.customer_Phone}</span>

                  <span>{order.shipping_Address}</span>

                  <span>
                    {order.shipping_City}
                    {order.shipping_Postal_Code
                      ? `, ${order.shipping_Postal_Code}`
                      : ""}
                  </span>
                </div>
              </section>
            </div>

            <aside className="customer-order-detail__summary">
              <div>
                <span>Order summary</span>

                <h2>Payment</h2>
              </div>

              <div className="customer-order-summary__rows">
                <div>
                  <span>Subtotal</span>

                  <strong>৳{formatPrice(order.subtotal)}</strong>
                </div>

                <div>
                  <span>Delivery</span>

                  <strong>৳{formatPrice(order.shipping_Cost)}</strong>
                </div>

                {Number(order.discount || 0) > 0 && (
                  <div>
                    <span>Discount</span>

                    <strong>
                      −৳
                      {formatPrice(order.discount)}
                    </strong>
                  </div>
                )}

                <div className="customer-order-summary__total">
                  <span>Total</span>

                  <strong>৳{formatPrice(order.total)}</strong>
                </div>
              </div>

              <div className="customer-order-summary__payment">
                <div>
                  <span>Payment method</span>

                  <strong>{order.payment_Method || "—"}</strong>
                </div>

                <div>
                  <span>Payment status</span>

                  <strong>{order.payment_Status || "pending"}</strong>
                </div>
              </div>

              {status === "delivered" && (
                <div className="customer-order-summary__complete">
                  <CheckCircle2 size={18} />

                  <span>Your order has been delivered.</span>
                </div>
              )}
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

export default OrderDetailPage;
