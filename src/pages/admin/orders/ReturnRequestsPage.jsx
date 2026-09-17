import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  ADMIN_RETURN_STATUS_TRANSITIONS,
  getAdminReturnRequests,
  updateAdminReturnRequest,
} from "../../../services/adminReturnRequestServices";

const RESOLUTIONS = ["pending", "refund", "exchange", "replacement"];

function ReturnRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  async function loadRequests() {
    setLoading(true);
    setError("");
    try {
      setRequests(await getAdminReturnRequests({ status: statusFilter }));
    } catch (loadError) {
      setError(loadError?.message || "Unable to load return requests.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  async function handleStatusChange(request, event) {
    const nextStatus = event.target.value;
    if (!nextStatus || nextStatus === request.status) return;

    setSavingId(request.$id);
    setError("");

    try {
      const updated = await updateAdminReturnRequest(
        request.$id,
        request.status,
        nextStatus,
        {
          resolution: request.resolution,
          refundAmount: request.refund_Amount,
          managementNote: request.management_Note,
        },
      );
      setRequests((current) => current.map((item) => item.$id === updated.$id ? updated : item));
    } catch (saveError) {
      setError(saveError?.message || "Unable to update return request.");
    } finally {
      setSavingId("");
    }
  }

  async function handleResolutionChange(request, event) {
    setSavingId(request.$id);
    setError("");

    try {
      const updated = await updateAdminReturnRequest(
        request.$id,
        request.status,
        request.status,
        {
          resolution: event.target.value,
          refundAmount: request.refund_Amount,
          managementNote: request.management_Note,
        },
      );
      setRequests((current) => current.map((item) => item.$id === updated.$id ? updated : item));
    } catch (saveError) {
      setError(saveError?.message || "Unable to update resolution.");
    } finally {
      setSavingId("");
    }
  }

  async function handleRefundAmountChange(request, event) {
    const value = event.target.value;
    if (value === "") return;

    setSavingId(request.$id);
    setError("");

    try {
      const updated = await updateAdminReturnRequest(
        request.$id,
        request.status,
        request.status,
        {
          resolution: request.resolution,
          refundAmount: value,
          managementNote: request.management_Note,
        },
      );
      setRequests((current) => current.map((item) => item.$id === updated.$id ? updated : item));
    } catch (saveError) {
      setError(saveError?.message || "Unable to update refund amount.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link to="/admin/orders" className="text-sm font-medium underline underline-offset-2">← Orders</Link>
          <h1 className="mt-3 text-2xl font-bold">Returns & exchanges</h1>
          <p className="mt-1 text-sm text-black/50">Review customer requests and move them through the return workflow.</p>
        </div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm">
          <option value="all">All requests</option>
          {Object.keys(ADMIN_RETURN_STATUS_TRANSITIONS).map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </div>

      {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="rounded-lg border border-black/8 bg-white p-8 text-sm text-black/50">Loading return requests...</div>
      ) : requests.length === 0 ? (
        <div className="rounded-lg border border-black/8 bg-white p-8 text-sm text-black/50">No return or exchange requests found.</div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const allowedStatuses = ADMIN_RETURN_STATUS_TRANSITIONS[request.status] || [request.status];
            const disabled = savingId === request.$id;

            return (
              <article key={request.$id} className="rounded-lg border border-black/8 bg-white p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-black/40">{request.request_Type}</p>
                    <h2 className="mt-1 text-lg font-semibold">{request.return_Number}</h2>
                    <p className="mt-1 text-sm text-black/50">Order: {request.order_ID}</p>
                  </div>

                  <select value={request.status} disabled={disabled} onChange={(event) => handleStatusChange(request, event)} className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm">
                    {allowedStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div><p className="text-xs text-black/40">Reason</p><p className="mt-1 text-sm">{request.reason || "—"}</p></div>
                  <div><p className="text-xs text-black/40">Selected items</p><p className="mt-1 text-sm break-words">{request.requested_Item_IDs || "—"}</p></div>
                  <label><span className="text-xs text-black/40">Resolution</span><select value={request.resolution || "pending"} disabled={disabled} onChange={(event) => handleResolutionChange(request, event)} className="mt-1 w-full rounded-md border border-black/10 bg-white px-2 py-2 text-sm">{RESOLUTIONS.map((value) => <option key={value}>{value}</option>)}</select></label>
                  <label><span className="text-xs text-black/40">Refund amount</span><input type="number" min="0" step="1" defaultValue={request.refund_Amount || 0} disabled={disabled} onBlur={(event) => handleRefundAmountChange(request, event)} className="mt-1 w-full rounded-md border border-black/10 px-2 py-2 text-sm" /></label>
                </div>

                {request.details && <div className="mt-4 border-t border-black/6 pt-4"><p className="text-xs text-black/40">Customer details</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-black/70">{request.details}</p></div>}
                {request.exchange_Note && <div className="mt-4 border-t border-black/6 pt-4"><p className="text-xs text-black/40">Exchange request</p><p className="mt-1 text-sm text-black/70">{request.exchange_Note}</p></div>}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ReturnRequestsPage;
