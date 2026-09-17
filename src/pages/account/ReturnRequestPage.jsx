import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Package } from "lucide-react";

import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { getCustomerOrderWithItems } from "../../services/customerOrderServices";
import {
  createCustomerReturnRequest,
  getCustomerReturnRequest,
  RETURN_REQUEST_TYPES,
} from "../../services/returnRequestServices";

const REASONS = [
  "Wrong size",
  "Wrong product or color",
  "Damaged on delivery",
  "Defective product",
  "Missing item",
  "Other",
];

function ReturnRequestPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user, loading, isAuthenticated } = useCustomerAuth();

  const [orderData, setOrderData] = useState(null);
  const [existingRequest, setExistingRequest] = useState(null);
  const [requestType, setRequestType] = useState(RETURN_REQUEST_TYPES.RETURN);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [exchangeNote, setExchangeNote] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/account/login", { replace: true, state: { from: `/account/orders/${orderId}/return` } });
    }
  }, [loading, isAuthenticated, navigate, orderId]);

  useEffect(() => {
    if (!user?.$id || !orderId) return;
    let cancelled = false;

    async function load() {
      setLoadingPage(true);
      setError("");

      try {
        const [order, request] = await Promise.all([
          getCustomerOrderWithItems(user.$id, orderId),
          getCustomerReturnRequest(user.$id, orderId),
        ]);

        if (cancelled) return;
        setOrderData(order);
        setExistingRequest(request);
        if (order?.items?.length) setSelectedItems(order.items.map((item) => item.$id));
      } catch (loadError) {
        if (!cancelled) setError(loadError?.message || "Unable to load this request.");
      } finally {
        if (!cancelled) setLoadingPage(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user?.$id, orderId]);

  const activeRequest = useMemo(() => {
    const request = submitted || existingRequest;
    return request && ["requested", "approved", "pickup", "received"].includes(request.status) ? request : null;
  }, [submitted, existingRequest]);

  function toggleItem(itemId) {
    setSelectedItems((current) => current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const result = await createCustomerReturnRequest(user.$id, orderId, {
        requestType,
        reason,
        details,
        itemIds: selectedItems,
        exchangeNote,
      });
      setSubmitted(result);
      setExistingRequest(result);
    } catch (submitError) {
      setError(submitError?.message || "Unable to submit the request.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !isAuthenticated) return null;
  if (loadingPage) return <main className="account-page"><div className="account-page__container"><div className="return-request__loading">Loading return options...</div></div></main>;

  if (!orderData) {
    return <main className="account-page"><div className="account-page__container"><div className="return-request__empty"><Package size={32} /><h1>Order not found.</h1><Link to="/account/orders">Back to orders</Link></div></div></main>;
  }

  if (orderData.order.order_Status !== "delivered") {
    return <main className="account-page"><div className="account-page__container"><div className="return-request__empty"><Package size={32} /><h1>Return is not available yet.</h1><p>Return and exchange requests are available after the order is marked delivered.</p><Link to={`/account/orders/${orderId}`}>Back to order</Link></div></div></main>;
  }

  if (activeRequest) {
    return (
      <main className="account-page">
        <div className="account-page__container">
          <section className="return-request__card">
            <Link to={`/account/orders/${orderId}`} className="return-request__back"><ArrowLeft size={16} />Back to order</Link>
            <div className="return-request__success">
              <CheckCircle2 size={34} />
              <span>Request submitted</span>
              <h1>{activeRequest.return_Number}</h1>
              <p>Your {activeRequest.request_Type} request is now under store review.</p>
              <strong>Status: {activeRequest.status}</strong>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="account-page">
      <div className="account-page__container">
        <section className="return-request__card">
          <Link to={`/account/orders/${orderId}`} className="return-request__back"><ArrowLeft size={16} />Back to order</Link>
          <header className="return-request__header">
            <span>Order {orderData.order.order_Number || orderId}</span>
            <h1>Return or exchange.</h1>
            <p>Select the affected item(s) and tell us what happened. Final eligibility and resolution are handled by the store team.</p>
          </header>
          {error && <div className="return-request__error">{error}</div>}

          <form onSubmit={handleSubmit} className="return-request__form">
            <fieldset>
              <legend>Request type</legend>
              <div className="return-request__choices">
                <label><input type="radio" name="requestType" value="return" checked={requestType === "return"} onChange={(event) => setRequestType(event.target.value)} />Return</label>
                <label><input type="radio" name="requestType" value="exchange" checked={requestType === "exchange"} onChange={(event) => setRequestType(event.target.value)} />Exchange</label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Items</legend>
              <div className="return-request__items">
                {orderData.items.map((item) => (
                  <label key={item.$id}>
                    <input type="checkbox" checked={selectedItems.includes(item.$id)} onChange={() => toggleItem(item.$id)} />
                    <span><strong>{item.product_Name}</strong><small>{item.product_Color ? `Color: ${item.product_Color} · ` : ""}Qty: {item.quantity}</small></span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="return-request__field"><span>Reason</span><select value={reason} onChange={(event) => setReason(event.target.value)}>{REASONS.map((value) => <option key={value}>{value}</option>)}</select></label>
            {requestType === "exchange" && <label className="return-request__field"><span>Exchange details</span><input value={exchangeNote} onChange={(event) => setExchangeNote(event.target.value)} placeholder="For example: exchange to size 42" /></label>}
            <label className="return-request__field"><span>Details</span><textarea value={details} onChange={(event) => setDetails(event.target.value)} rows={5} placeholder="Describe the issue clearly." /></label>
            <button type="submit" disabled={submitting || selectedItems.length === 0}>{submitting ? "Submitting..." : "Submit request"}</button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default ReturnRequestPage;
