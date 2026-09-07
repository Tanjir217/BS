import {
    useCallback,
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import CustomerRow from "./CustomerRow";
  
  import {
    CUSTOMER_TIERS,
    getCustomers,
    getCustomerStats,
  } from "../../../services/customerServices";
  
  const PAGE_SIZE = 10;
  
  function CustomersPage() {
    const [customers, setCustomers] = useState([]);
  
    const [stats, setStats] = useState({
      total: 0,
      active: 0,
      premium: 0,
      vip: 0,
      noPurchase: 0,
    });
  
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
  
    const [tier, setTier] = useState("all");
    const [active, setActive] = useState("all");
    const [search, setSearch] = useState("");
  
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] =
      useState(true);
  
    const [error, setError] = useState("");
  
    const loadCustomers = useCallback(async () => {
      setLoading(true);
      setError("");
  
      try {
        const result = await getCustomers({
          page,
          limit: PAGE_SIZE,
          tier,
          active,
        });
  
        setCustomers(result.customers);
        setTotalPages(result.totalPages);
      } catch (err) {
        console.error(
          "Failed to load customers:",
          err
        );
  
        setError(
          err.message || "Failed to load customers."
        );
  
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    }, [page, tier, active]);
  
    const loadStats = useCallback(async () => {
      setStatsLoading(true);
  
      try {
        const result = await getCustomerStats();
        setStats(result);
      } catch (err) {
        console.error(
          "Failed to load customer stats:",
          err
        );
      } finally {
        setStatsLoading(false);
      }
    }, []);
  
    useEffect(() => {
      loadCustomers();
    }, [loadCustomers]);
  
    useEffect(() => {
      loadStats();
    }, [loadStats]);
  
    const filteredCustomers = useMemo(() => {
      const query = search.trim().toLowerCase();
  
      if (!query) {
        return customers;
      }
  
      return customers.filter((customer) => {
        const name = [
          customer.first_Name,
          customer.last_Name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
  
        return (
          name.includes(query) ||
          String(customer.email || "")
            .toLowerCase()
            .includes(query) ||
          String(customer.phone || "")
            .toLowerCase()
            .includes(query)
        );
      });
    }, [customers, search]);
  
    const handleTierChange = (event) => {
      setTier(event.target.value);
      setPage(1);
    };
  
    const handleActiveChange = (event) => {
      setActive(event.target.value);
      setPage(1);
    };
  
    const handleRefresh = async () => {
      await Promise.all([
        loadCustomers(),
        loadStats(),
      ]);
    };
  
    const handlePreviousPage = () => {
      setPage((currentPage) =>
        Math.max(1, currentPage - 1)
      );
    };
  
    const handleNextPage = () => {
      setPage((currentPage) =>
        Math.min(totalPages, currentPage + 1)
      );
    };
  
    return (
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black">
            Customers
          </h1>
  
          <p className="mt-1 text-sm text-black/45">
            Manage customer profiles, loyalty tiers
            and purchase activity.
          </p>
        </div>
  
        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Total customers"
            value={stats.total}
            loading={statsLoading}
          />
  
          <StatCard
            label="Active"
            value={stats.active}
            loading={statsLoading}
          />
  
          <StatCard
            label="Premium"
            value={stats.premium}
            loading={statsLoading}
          />
  
          <StatCard
            label="VIP"
            value={stats.vip}
            loading={statsLoading}
          />
  
          <StatCard
            label="No purchase"
            value={stats.noPurchase}
            loading={statsLoading}
          />
        </div>
  
        {/* Controls */}
        <div className="mb-6 rounded-lg border border-black/8 bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Search */}
            <div className="flex-1">
              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search current customers..."
                className="w-full rounded-md border border-black/10 px-3 py-2 text-sm outline-none placeholder:text-black/35 focus:border-black/25"
              />
            </div>
  
            {/* Tier */}
            <select
              value={tier}
              onChange={handleTierChange}
              className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none"
            >
              <option value="all">
                All tiers
              </option>
  
              <option value={CUSTOMER_TIERS.REGULAR}>
                Regular
              </option>
  
              <option value={CUSTOMER_TIERS.PREMIUM}>
                Premium
              </option>
  
              <option value={CUSTOMER_TIERS.VIP}>
                VIP
              </option>
            </select>
  
            {/* Active */}
            <select
              value={active}
              onChange={handleActiveChange}
              className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none"
            >
              <option value="all">
                All customers
              </option>
  
              <option value="active">
                Active
              </option>
  
              <option value="inactive">
                Inactive
              </option>
            </select>
  
            {/* Refresh */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || statsLoading}
              className="rounded-md border border-black/10 px-4 py-2 text-sm font-medium transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>
  
        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">
              {error}
            </p>
  
            <button
              type="button"
              onClick={loadCustomers}
              className="shrink-0 text-sm font-medium text-red-800 underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        )}
  
        {/* Table */}
        <section className="overflow-hidden rounded-lg border border-black/8 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead>
                <tr className="border-b border-black/6 text-xs text-black/45">
                  <th className="px-6 py-3 font-medium">
                    Customer
                  </th>
  
                  <th className="px-6 py-3 font-medium">
                    Phone
                  </th>
  
                  <th className="px-6 py-3 font-medium">
                    Orders
                  </th>
  
                  <th className="px-6 py-3 font-medium">
                    Spent
                  </th>
  
                  <th className="px-6 py-3 font-medium">
                    Tier
                  </th>
  
                  <th className="px-6 py-3 font-medium">
                    Last order
                  </th>
  
                  <th className="px-6 py-3 font-medium">
                    Status
                  </th>
                </tr>
              </thead>
  
              <tbody>
                {loading ? (
                  <CustomerTableSkeleton />
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-12 text-center"
                    >
                      <p className="font-medium text-black">
                        {search
                          ? "No matching customers"
                          : "No customers yet"}
                      </p>
  
                      <p className="mt-1 text-sm text-black/40">
                        {search
                          ? "Try a different name, email or phone number."
                          : "Customer accounts will appear here."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map(
                    (customer) => (
                      <CustomerRow
                        key={customer.$id}
                        customer={customer}
                      />
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
  
          {/* Pagination */}
          {!loading &&
            customers.length > 0 && (
              <div className="flex items-center justify-between border-t border-black/6 px-6 py-4">
                <p className="text-sm text-black/45">
                  Page {page} of {totalPages}
                </p>
  
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handlePreviousPage}
                    disabled={page === 1}
                    className="rounded-md border border-black/10 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
  
                  <button
                    type="button"
                    onClick={handleNextPage}
                    disabled={page === totalPages}
                    className="rounded-md border border-black/10 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
        </section>
      </div>
    );
  }
  
  function StatCard({
    label,
    value,
    loading,
  }) {
    return (
      <div className="rounded-lg border border-black/8 bg-white p-5">
        <p className="text-xs font-medium text-black/45">
          {label}
        </p>
  
        {loading ? (
          <div className="mt-3 h-8 w-16 animate-pulse rounded bg-black/5" />
        ) : (
          <p className="mt-2 text-2xl font-semibold text-black">
            {Number(value || 0).toLocaleString("en-BD")}
          </p>
        )}
      </div>
    );
  }
  
  function CustomerTableSkeleton() {
    return Array.from({ length: 5 }).map(
      (_, index) => (
        <tr
          key={index}
          className="border-b border-black/6 last:border-b-0"
        >
          {Array.from({ length: 7 }).map(
            (_, cellIndex) => (
              <td
                key={cellIndex}
                className="px-6 py-5"
              >
                <div className="h-4 animate-pulse rounded bg-black/5" />
              </td>
            )
          )}
        </tr>
      )
    );
  }
  
  export default CustomersPage;