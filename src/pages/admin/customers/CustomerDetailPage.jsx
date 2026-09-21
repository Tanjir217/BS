import {
    useCallback,
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import {
    Link,
    useNavigate,
    useParams,
  } from "react-router-dom";
  
  import {
    CUSTOMER_TIERS,
    getCustomerById,
    getCustomerInitials,
    getCustomerName,
    getCustomerOrders,
    getCustomerTierRules,
  } from "../../../services/customerServices";
  
  import {
    ORDER_STATUS_LABELS,
    PAYMENT_STATUS_LABELS,
  } from "../../../services/orderServices";
  
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
  
    return date.toLocaleDateString("en-BD", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  
  function formatDateTime(value) {
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
  
  function getTierClasses(tier) {
    if (tier === CUSTOMER_TIERS.VIP) {
      return "bg-black text-white";
    }
  
    if (tier === CUSTOMER_TIERS.PREMIUM) {
      return "bg-black/8 text-black";
    }
  
    return "bg-black/5 text-black/60";
  }
  
  function getStatusClasses(status) {
    switch (status) {
      case "delivered":
      case "paid":
        return "bg-black/8 text-black";
  
      case "cancelled":
      case "failed":
        return "bg-black/5 text-black/40";
  
      default:
        return "bg-black/5 text-black/60";
    }
  }
  
  function CustomerDetailPage() {
    const { customerId } = useParams();
    const navigate = useNavigate();
  
    const [customer, setCustomer] = useState(null);
    const [tierRules, setTierRules] = useState([]);
    const [orders, setOrders] = useState([]);
  
    const [ordersPage, setOrdersPage] = useState(1);
    const [ordersTotalPages, setOrdersTotalPages] =
      useState(1);
  
    const [loading, setLoading] = useState(true);
    const [ordersLoading, setOrdersLoading] =
      useState(true);
  
    const [error, setError] = useState("");
    const [ordersError, setOrdersError] =
      useState("");
  
    const loadCustomer = useCallback(async () => {
      setLoading(true);
      setError("");
  
      try {
        const result = await getCustomerById(
          customerId
        );
  
        if (!result) {
          setCustomer(null);
          setError("Customer not found.");
          return;
        }
  
        setCustomer(result);
      } catch (err) {
        console.error(
          "Failed to load customer:",
          err
        );
  
        setCustomer(null);
        setError(
          err.message ||
            "Failed to load customer."
        );
      } finally {
        setLoading(false);
      }
    }, [customerId]);
  
    const loadTierRules = useCallback(async () => {
      try {
        const result =
          await getCustomerTierRules();
  
        setTierRules(result);
      } catch (err) {
        console.error(
          "Failed to load customer tier rules:",
          err
        );
      }
    }, []);
  
    const loadOrders = useCallback(async () => {
      if (!customerId) {
        return;
      }
  
      setOrdersLoading(true);
      setOrdersError("");
  
      try {
        const result =
          await getCustomerOrders({
            customerId,
            page: ordersPage,
            limit: 10,
          });
  
        setOrders(result.orders);
        setOrdersTotalPages(
          result.totalPages
        );
      } catch (err) {
        console.error(
          "Failed to load customer orders:",
          err
        );
  
        setOrders([]);
        setOrdersError(
          err.message ||
            "Failed to load customer orders."
        );
      } finally {
        setOrdersLoading(false);
      }
    }, [customerId, ordersPage]);
  
    useEffect(() => {
      loadCustomer();
      loadTierRules();
    }, [loadCustomer, loadTierRules]);
  
    useEffect(() => {
      loadOrders();
    }, [loadOrders]);
  
    const tierProgress = useMemo(() => {
      if (!customer) {
        return null;
      }
  
      if (!tierRules.length) {
        return null;
      }
  
      const sortedRules = [...tierRules].sort(
        (a, b) =>
          Number(a.minimum_Spent || 0) -
          Number(b.minimum_Spent || 0)
      );
  
      const spent = Number(
        customer.total_Spent || 0
      );
  
      const currentRule =
        sortedRules
          .filter(
            (rule) =>
              spent >=
              Number(rule.minimum_Spent || 0)
          )
          .at(-1) || sortedRules[0];
  
      const nextRule =
        sortedRules.find(
          (rule) =>
            Number(rule.minimum_Spent || 0) >
            spent
        ) || null;
  
      if (!nextRule) {
        return {
          currentRule,
          nextRule: null,
          progress: 100,
          remaining: 0,
        };
      }
  
      const currentMinimum = Number(
        currentRule.minimum_Spent || 0
      );
  
      const nextMinimum = Number(
        nextRule.minimum_Spent || 0
      );
  
      const range =
        nextMinimum - currentMinimum;
  
      const progress =
        range <= 0
          ? 100
          : Math.min(
              100,
              Math.max(
                0,
                ((spent - currentMinimum) /
                  range) *
                  100
              )
            );
  
      return {
        currentRule,
        nextRule,
        progress,
        remaining: Math.max(
          0,
          nextMinimum - spent
        ),
      };
    }, [customer, tierRules]);
  
    if (loading) {
      return (
        <div className="p-6">
          <p className="text-sm text-black/50">
            Loading customer...
          </p>
        </div>
      );
    }
  
    if (error && !customer) {
      return (
        <div className="p-6">
          <button
            type="button"
            onClick={() =>
              navigate("/admin/customers")
            }
            className="mb-6 text-sm font-medium underline underline-offset-2"
          >
            ← Back to customers
          </button>
  
          <div className="rounded-lg border border-red-200 bg-red-50 p-5">
            <h1 className="font-semibold text-red-800">
              Unable to load customer
            </h1>
  
            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>
  
            <button
              type="button"
              onClick={loadCustomer}
              className="mt-4 rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-800"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
  
    if (!customer) {
      return null;
    }
  
    const customerName =
      getCustomerName(customer) ||
      "Unnamed customer";
  
    const initials =
      getCustomerInitials(customer);
  
    return (
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/admin/customers"
            className="text-sm font-medium underline underline-offset-2"
          >
            ← Back to customers
          </Link>
  
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-black/8 text-lg font-semibold">
                {initials}
              </div>
  
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-black">
                    {customerName}
                  </h1>
  
                  <span
                    className={[
                      "inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                      getTierClasses(
                        customer.customer_Tire
                      ),
                    ].join(" ")}
                  >
                    {customer.customer_Tire ||
                      "regular"}
                  </span>
                </div>
  
                <p className="mt-1 text-sm text-black/45">
                  Customer since{" "}
                  {formatDate(
                    customer.$createdAt
                  )}
                </p>
              </div>
            </div>
  
            <span
              className={[
                "inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-medium",
                customer.is_Active
                  ? "bg-black/8 text-black"
                  : "bg-black/5 text-black/40",
              ].join(" ")}
            >
              {customer.is_Active
                ? "Active customer"
                : "Inactive customer"}
            </span>
          </div>
        </div>
  
        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
  
        {/* Statistics */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total orders"
            value={Number(
              customer.total_Orders || 0
            ).toLocaleString("en-BD")}
          />
  
          <StatCard
            label="Lifetime spent"
            value={formatPrice(
              customer.total_Spent
            )}
          />
  
          <StatCard
            label="Last order"
            value={
              customer.last_Order_At
                ? formatDate(
                    customer.last_Order_At
                  )
                : "Never"
            }
          />
  
          <StatCard
            label="Account"
            value={
              customer.account_ID
                ? "Linked"
                : "Guest"
            }
          />
        </div>
  
        <div className="grid gap-6 xl:grid-cols-3">
          {/* Profile */}
          <section className="rounded-lg border border-black/8 bg-white p-5">
            <h2 className="mb-5 text-base font-semibold">
              Profile information
            </h2>
  
            <InfoRow
              label="First name"
              value={customer.first_Name}
            />
  
            <InfoRow
              label="Last name"
              value={
                customer.last_Name || "—"
              }
            />
  
            <InfoRow
              label="Email"
              value={
                customer.email || "—"
              }
            />
  
            <InfoRow
              label="Phone"
              value={
                customer.phone || "—"
              }
            />
  
            <InfoRow
              label="WhatsApp"
              value={
                customer.whatsapp_Number ||
                "—"
              }
            />
          </section>
  
          {/* Address */}
          <section className="rounded-lg border border-black/8 bg-white p-5">
            <h2 className="mb-5 text-base font-semibold">
              Address
            </h2>
  
            <InfoRow
              label="Address"
              value={
                customer.address || "—"
              }
            />
  
            <InfoRow
              label="City"
              value={
                customer.city || "—"
              }
            />
  
            <InfoRow
              label="Postal code"
              value={
                customer.postal_Code || "—"
              }
            />
          </section>
  
          {/* Account */}
          <section className="rounded-lg border border-black/8 bg-white p-5">
            <h2 className="mb-5 text-base font-semibold">
              Account
            </h2>
  
            <InfoRow
              label="Account ID"
              value={
                customer.account_ID || "Not linked"
              }
            />
  
            <InfoRow
              label="Customer ID"
              value={customer.$id}
            />
  
            <InfoRow
              label="Created"
              value={formatDateTime(
                customer.$createdAt
              )}
            />
  
            <InfoRow
              label="Updated"
              value={formatDateTime(
                customer.$updatedAt
              )}
            />
          </section>
        </div>
  
        {/* Tier progress */}
        <section className="mt-6 rounded-lg border border-black/8 bg-white p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">
                Customer tier
              </h2>
  
              <p className="mt-1 text-sm text-black/45">
                Tier is based on lifetime spending.
              </p>
            </div>
  
            <span
              className={[
                "inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-medium capitalize",
                getTierClasses(
                  customer.customer_Tire
                ),
              ].join(" ")}
            >
              {customer.customer_Tire ||
                "regular"}
            </span>
          </div>
  
          {tierProgress ? (
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-black/55">
                  {tierProgress.currentRule
                    ?.tier_Name ||
                    customer.customer_Tire}
                </span>
  
                {tierProgress.nextRule ? (
                  <span className="text-black/55">
                    Next:{" "}
                    {
                      tierProgress.nextRule
                        .tier_Name
                    }
                  </span>
                ) : (
                  <span className="font-medium">
                    Highest tier
                  </span>
                )}
              </div>
  
              <div className="h-2 overflow-hidden rounded-full bg-black/6">
                <div
                  className="h-full rounded-full bg-black transition-all"
                  style={{
                    width: `${tierProgress.progress}%`,
                  }}
                />
              </div>
  
              <div className="mt-2 flex justify-between text-xs text-black/45">
                <span>
                  {formatPrice(
                    customer.total_Spent
                  )}
                </span>
  
                {tierProgress.nextRule ? (
                  <span>
                    {formatPrice(
                      tierProgress.nextRule
                        .minimum_Spent
                    )}
                  </span>
                ) : (
                  <span>Maximum tier reached</span>
                )}
              </div>
  
              {tierProgress.nextRule && (
                <p className="mt-4 text-sm text-black/60">
                  Spend{" "}
                  <span className="font-semibold text-black">
                    {formatPrice(
                      tierProgress.remaining
                    )}
                  </span>{" "}
                  more to reach{" "}
                  <span className="font-semibold text-black">
                    {tierProgress.nextRule
                      .tier_Name}
                  </span>
                  .
                </p>
              )}
            </div>
          ) : (
            <p className="mt-5 text-sm text-black/45">
              No active tier rules are configured
              yet.
            </p>
          )}
        </section>
  
        {/* Order history */}
        <section className="mt-6 overflow-hidden rounded-lg border border-black/8 bg-white">
          <div className="border-b border-black/6 px-5 py-4">
            <h2 className="text-base font-semibold">
              Order history
            </h2>
  
            <p className="mt-1 text-sm text-black/45">
              Orders associated with this customer.
            </p>
          </div>
  
          {ordersError && (
            <div className="m-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {ordersError}
            </div>
          )}
  
          {ordersLoading ? (
            <div className="px-5 py-10 text-center text-sm text-black/45">
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="font-medium text-black">
                No orders yet
              </p>
  
              <p className="mt-1 text-sm text-black/40">
                This customer has not made a purchase.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-212.5 text-left">
                  <thead>
                    <tr className="border-b border-black/6 text-xs text-black/45">
                      <th className="px-5 py-3 font-medium">
                        Order
                      </th>
  
                      <th className="px-5 py-3 font-medium">
                        Date
                      </th>
  
                      <th className="px-5 py-3 font-medium">
                        Total
                      </th>
  
                      <th className="px-5 py-3 font-medium">
                        Payment
                      </th>
  
                      <th className="px-5 py-3 font-medium">
                        Status
                      </th>
  
                      <th className="px-5 py-3 text-right font-medium">
                        Action
                      </th>
                    </tr>
                  </thead>
  
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order.$id}
                        className="border-b border-black/5 last:border-b-0"
                      >
                        <td className="px-5 py-4">
                          <span className="font-medium">
                            {order.order_Number}
                          </span>
                        </td>
  
                        <td className="px-5 py-4 text-sm text-black/55">
                          {formatDate(
                            order.$createdAt
                          )}
                        </td>
  
                        <td className="px-5 py-4 text-sm font-semibold">
                          {formatPrice(
                            order.total
                          )}
                        </td>
  
                        <td className="px-5 py-4">
                          <span
                            className={[
                              "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                              getStatusClasses(
                                order.payment_Status
                              ),
                            ].join(" ")}
                          >
                            {PAYMENT_STATUS_LABELS[
                              order.payment_Status
                            ] ||
                              order.payment_Status}
                          </span>
                        </td>
  
                        <td className="px-5 py-4">
                          <span
                            className={[
                              "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                              getStatusClasses(
                                order.order_Status
                              ),
                            ].join(" ")}
                          >
                            {ORDER_STATUS_LABELS[
                              order.order_Status
                            ] ||
                              order.order_Status}
                          </span>
                        </td>
  
                        <td className="px-5 py-4 text-right">
                          <Link
                            to={`/admin/orders/${order.$id}`}
                            className="text-sm font-medium underline underline-offset-2"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
  
              {ordersTotalPages > 1 && (
                <div className="flex items-center justify-between border-t border-black/6 px-5 py-4">
                  <p className="text-sm text-black/45">
                    Page {ordersPage} of{" "}
                    {ordersTotalPages}
                  </p>
  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setOrdersPage(
                          (current) =>
                            Math.max(
                              1,
                              current - 1
                            )
                        )
                      }
                      disabled={ordersPage === 1}
                      className="rounded-md border border-black/10 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>
  
                    <button
                      type="button"
                      onClick={() =>
                        setOrdersPage(
                          (current) =>
                            Math.min(
                              ordersTotalPages,
                              current + 1
                            )
                        )
                      }
                      disabled={
                        ordersPage ===
                        ordersTotalPages
                      }
                      className="rounded-md border border-black/10 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    );
  }
  
  function StatCard({ label, value }) {
    return (
      <div className="rounded-lg border border-black/8 bg-white p-5">
        <p className="text-xs font-medium text-black/45">
          {label}
        </p>
  
        <p className="mt-2 text-xl font-semibold text-black">
          {value}
        </p>
      </div>
    );
  }
  
  function InfoRow({ label, value }) {
    return (
      <div className="border-b border-black/5 py-3 last:border-b-0">
        <p className="text-xs text-black/40">
          {label}
        </p>
  
        <p className="mt-1 wrap-break-words text-sm font-medium text-black">
          {value || "—"}
        </p>
      </div>
    );
  }
  
  export default CustomerDetailPage;