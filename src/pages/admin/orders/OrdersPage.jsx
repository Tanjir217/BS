import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getOrders,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "../../../services/orderServices";

import OrderTable from "./OrderTable";

const ORDERS_PER_PAGE = 10;

function OrdersPage() {
  const [orders, setOrders] = useState([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  const [orderStatus, setOrderStatus] =
    useState("all");

  const [paymentStatus, setPaymentStatus] =
    useState("all");

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const result = await getOrders({
        page,
        limit: ORDERS_PER_PAGE,
        orderStatus,
        paymentStatus,
      });

      setOrders(result.orders);
      setTotalPages(result.totalPages);
      setTotalOrders(result.total);
    } catch (error) {
      console.error(
        "Failed to load orders:",
        error
      );

      setError(
        "Failed to load orders. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    page,
    orderStatus,
    paymentStatus,
  ]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  function handleOrderStatusChange(event) {
    setOrderStatus(event.target.value);
    setPage(1);
  }

  function handlePaymentStatusChange(event) {
    setPaymentStatus(event.target.value);
    setPage(1);
  }

  const hasActiveFilters =
    orderStatus !== "all" ||
    paymentStatus !== "all";

  return (
    <div className="space-y-6 py-2 sm:py-4">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
          disabled={isLoading}
          className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-black/8 bg-white p-4 sm:flex-row sm:items-center">
        <select
          value={orderStatus}
          onChange={handleOrderStatusChange}
          className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-black outline-none transition focus:border-black/25"
        >
          <option value="all">
            All order statuses
          </option>

          {Object.values(ORDER_STATUSES).map(
            (status) => (
              <option
                key={status}
                value={status}
              >
                {ORDER_STATUS_LABELS[status]}
              </option>
            )
          )}
        </select>

        <select
          value={paymentStatus}
          onChange={handlePaymentStatusChange}
          className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-black outline-none transition focus:border-black/25"
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
                {PAYMENT_STATUS_LABELS[status]}
              </option>
            )
          )}
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setOrderStatus("all");
              setPaymentStatus("all");
              setPage(1);
            }}
            className="self-start rounded-xl px-3 py-2.5 text-sm font-medium text-black/55 transition hover:bg-black/5 hover:text-black sm:self-auto"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <span>{error}</span>

          <button
            type="button"
            onClick={loadOrders}
            className="font-medium underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <OrderTable
        orders={orders}
        isLoading={isLoading}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Pagination */}
      {!isLoading && totalOrders > 0 && (
        <div className="flex flex-col gap-3 text-sm text-black/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {totalOrders}{" "}
            {totalOrders === 1
              ? "order"
              : "orders"}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() =>
                setPage((current) =>
                  Math.max(1, current - 1)
                )
              }
              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-black transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="min-w-24 text-center">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() =>
                setPage((current) =>
                  Math.min(
                    totalPages,
                    current + 1
                  )
                )
              }
              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-black transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
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