import { useEffect, useState } from "react";

import {
  getOrders,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
} from "../../../services/orderServices";

import OrderTable from "./OrderTable";

const ORDERS_PER_PAGE = 10;

function OrdersPage() {
  const [orders, setOrders] = useState([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  const [orderStatus, setOrderStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOrders() {
    try {
      setIsLoading(true);
      setError("");

      const result = await getOrders({
        page,
        limit: ORDERS_PER_PAGE,
      });

      let filteredOrders = result.orders;

      if (orderStatus !== "all") {
        filteredOrders = filteredOrders.filter(
          (order) => order.order_Status === orderStatus
        );
      }

      if (paymentStatus !== "all") {
        filteredOrders = filteredOrders.filter(
          (order) =>
            order.payment_Status === paymentStatus
        );
      }

      setOrders(filteredOrders);
      setTotalPages(result.totalPages);
      setTotalOrders(result.total);
    } catch (error) {
      console.error("Failed to load orders:", error);
      setError("Failed to load orders.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [page, orderStatus, paymentStatus]);

  // useEffect(() => {
  //   setPage(1);
  // }, [orderStatus, paymentStatus]);

  return (
    <div className="space-y-6 py-2 sm:py-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-black/45">
            Sales
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Orders
          </h1>

          <p className="mt-1 text-sm text-black/50">
            Manage customer orders, payments and fulfillment.
          </p>
        </div>

        <button
          type="button"
          onClick={loadOrders}
          className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-black/5"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-black/8 bg-white p-4 sm:flex-row">
        <select
          value={orderStatus}
          onChange={(event) =>
            setOrderStatus(event.target.value)
          }
          className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none"
        >
          <option value="all">All order statuses</option>

          {Object.values(ORDER_STATUSES).map(
            (status) => (
              <option
                key={status}
                value={status}
              >
                {status}
              </option>
            )
          )}
        </select>

        <select
          value={paymentStatus}
          onChange={(event) =>
            setPaymentStatus(event.target.value)
          }
          className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none"
        >
          <option value="all">
            All payment statuses
          </option>

          {Object.values(PAYMENT_STATUSES).map(
            (status) => (
              <option
                key={status}
                value={status}
              >
                {status}
              </option>
            )
          )}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Table */}
      <OrderTable
        orders={orders}
        isLoading={isLoading}
      />

      {/* Footer / Pagination */}
      {!isLoading && (
        <div className="flex flex-col gap-3 text-sm text-black/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {totalOrders} total orders
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() =>
                setPage((current) => current - 1)
              }
              className="rounded-lg border border-black/10 bg-white px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="px-2">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() =>
                setPage((current) => current + 1)
              }
              className="rounded-lg border border-black/10 bg-white px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrdersPage;