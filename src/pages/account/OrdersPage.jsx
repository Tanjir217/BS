import { useEffect, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { ChevronLeft, ChevronRight, Package } from "lucide-react";

import { useCustomerAuth } from "../../context/CustomerAuthContext";

import {
  getCustomerOrders,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
} from "../../services/customerOrderServices";

const PAGE_SIZE = 10;

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
    month: "short",
    year: "numeric",
  });
}

function getStatusClass(status) {
  return `customer-order-status customer-order-status--${String(
    status || "pending",
  ).toLowerCase()}`;
}

function OrdersPage() {
  const navigate = useNavigate();

  const { user, loading, isAuthenticated } = useCustomerAuth();

  const [orders, setOrders] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  const [totalOrders, setTotalOrders] = useState(0);

  const [statusFilter, setStatusFilter] = useState("all");

  const [loadingOrders, setLoadingOrders] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/account/login", {
        replace: true,
        state: {
          from: "/account/orders",
        },
      });
    }
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!user?.$id) {
      return;
    }

    let cancelled = false;

    async function loadOrders() {
      setLoadingOrders(true);
      setError("");

      try {
        const result = await getCustomerOrders(user.$id, {
          page: currentPage,
          limit: PAGE_SIZE,
          orderStatus: statusFilter,
        });

        if (cancelled) {
          return;
        }

        setOrders(result.orders);

        setTotalOrders(result.total);

        setTotalPages(result.totalPages);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Failed to load customer orders:", error);

        setOrders([]);

        setError(error?.message || "Unable to load your orders.");
      } finally {
        if (!cancelled) {
          setLoadingOrders(false);
        }
      }
    }

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, [user?.$id, currentPage, statusFilter]);

  function handleStatusChange(event) {
    setStatusFilter(event.target.value);

    setCurrentPage(1);
  }

  if (loading || !isAuthenticated) {
    return null;
  }

  return (
    <main className="account-page">
      <div className="account-page__container">
        <section className="customer-orders">
          <header className="customer-orders__header">
            <div className="account-page__intro">
              <p>My Account / Orders</p>

              <h1>Your orders.</h1>

              <span>
                View your purchases, order status and delivery information.
              </span>
            </div>

            <Link to="/account" className="customer-orders__back">
              Back to Account
            </Link>
          </header>

          <div className="customer-orders__toolbar">
            <span>
              {totalOrders} {totalOrders === 1 ? "order" : "orders"}
            </span>

            <label>
              <span>Filter</span>

              <select value={statusFilter} onChange={handleStatusChange}>
                <option value="all">All orders</option>

                {Object.values(ORDER_STATUSES).map((status) => (
                  <option key={status} value={status}>
                    {ORDER_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && (
            <div className="customer-orders__message customer-orders__message--error">
              {error}
            </div>
          )}

          {loadingOrders ? (
            <div className="customer-orders__loading">
              Loading your orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="customer-orders__empty">
              <Package size={34} />

              <h2>No orders yet.</h2>

              <p>When you place an order, it will appear here.</p>

              <Link to="/all-products">Start shopping</Link>
            </div>
          ) : (
            <>
              <div className="customer-orders__list">
                {orders.map((order) => (
                  <Link
                    key={order.$id}
                    to={`/account/orders/${order.$id}`}
                    className="customer-order-card"
                  >
                    <div className="customer-order-card__main">
                      <div>
                        <span className="customer-order-card__eyebrow">
                          Order
                        </span>

                        <strong>{order.order_Number || order.$id}</strong>
                      </div>

                      <span className="customer-order-card__date">
                        {formatDate(order.$createdAt)}
                      </span>
                    </div>

                    <div className="customer-order-card__meta">
                      <span className={getStatusClass(order.order_Status)}>
                        {ORDER_STATUS_LABELS[order.order_Status] ||
                          order.order_Status}
                      </span>

                      <span>{order.payment_Status || "pending"}</span>

                      <strong>৳{formatPrice(order.total)}</strong>
                    </div>

                    <ChevronRight
                      size={18}
                      className="customer-order-card__arrow"
                    />
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="customer-orders__pagination">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <span>
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default OrdersPage;
