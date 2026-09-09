import { Link } from "react-router-dom";

import {
  getCustomerInitials,
  getCustomerName,
} from "../../../services/customerServices";

function formatPrice(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD")}`;
}

function formatDate(value) {
  if (!value) {
    return "Never";
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

function getTierClasses(tier) {
  if (tier === "vip") {
    return "bg-black text-white";
  }

  if (tier === "premium") {
    return "bg-black/8 text-black";
  }

  return "bg-black/5 text-black/55";
}

function CustomerRow({ customer }) {
  const name =
    getCustomerName(customer) || "Unnamed customer";

  const initials =
    getCustomerInitials(customer);

  return (
    <tr className="border-b border-black/6 last:border-b-0 transition hover:bg-black/1.5">
      {/* Customer */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {customer.profile_Image_File_ID ? (
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-black/5">
              {/* Image URL will be connected when we add
                  the Appwrite Storage image helper. */}
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold">
                {initials}
              </div>
            </div>
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/8 text-sm font-semibold">
              {initials}
            </div>
          )}

          <div className="min-w-0">
            <Link
              to={`/admin/customers/${customer.$id}`}
              className="font-medium text-black hover:underline"
            >
              {name}
            </Link>

            <p className="mt-0.5 truncate text-xs text-black/40">
              {customer.email || "No email"}
            </p>
          </div>
        </div>
      </td>

      {/* Phone */}
      <td className="px-6 py-4 text-sm text-black/65">
        {customer.phone || "—"}
      </td>

      {/* Orders */}
      <td className="px-6 py-4 text-sm text-black/65">
        {Number(customer.total_Orders || 0)}
      </td>

      {/* Spending */}
      <td className="px-6 py-4 text-sm font-semibold text-black">
        {formatPrice(customer.total_Spent)}
      </td>

      {/* Tier */}
      <td className="px-6 py-4">
        <span
          className={[
            "inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize",
            getTierClasses(customer.customer_Tire),
          ].join(" ")}
        >
          {customer.customer_Tire || "regular"}
        </span>
      </td>

      {/* Last order */}
      <td className="px-6 py-4 text-sm text-black/55">
        {formatDate(customer.last_Order_At)}
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <span
          className={[
            "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
            customer.is_Active
              ? "bg-black/8 text-black"
              : "bg-black/5 text-black/40",
          ].join(" ")}
        >
          {customer.is_Active
            ? "Active"
            : "Inactive"}
        </span>
      </td>
    </tr>
  );
}

export default CustomerRow;