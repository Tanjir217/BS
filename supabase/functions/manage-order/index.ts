import { createClient } from "npm:@supabase/supabase-js@2";

import { corsHeaders } from "npm:@supabase/supabase-js@^2/cors";

function getPublishableKey() {
  const direct = Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (direct) return direct;
  const legacy = Deno.env.get("SUPABASE_ANON_KEY");
  if (legacy) return legacy;
  const keys = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (keys) {
    try {
      const parsed = JSON.parse(keys);
      if (parsed.default) return parsed.default;
    } catch {}
  }
  throw new Error("Supabase publishable key is not configured.");
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getBearerToken(req: Request) {
  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice("Bearer ".length).trim();
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const candidate = error as Record<string, unknown>;
    if (typeof candidate.message === "string") return candidate.message;
    if (typeof candidate.details === "string") return candidate.details;
    if (typeof candidate.hint === "string") return candidate.hint;
  }
  return "Unable to process the order operation.";
}

async function getAuthenticatedClient(req: Request) {
  const token = getBearerToken(req);
  if (!token) throw new Error("Authentication is required.");

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) throw new Error("SUPABASE_URL is not configured.");

  const supabase = createClient(supabaseUrl, getPublishableKey(), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) throw new Error("Invalid or expired authentication token.");

  return { supabase, user, token };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed." }, 405);
  }

  try {
    const { supabase } = await getAuthenticatedClient(req);

    let payload: Record<string, unknown>;
    try {
      payload = await req.json();
    } catch {
      return jsonResponse({ success: false, error: "Invalid JSON request body." }, 400);
    }

    const action = String(payload.action || "");
    const orderId = payload.orderId ? String(payload.orderId) : null;

    if (!action) {
      return jsonResponse({ success: false, error: "Action is required." }, 400);
    }

    if (
      [
        "update_order_status",
        "cancel_order",
        "update_payment_status",
      ].includes(action) &&
      !orderId
    ) {
      return jsonResponse({ success: false, error: "Order ID is required." }, 400);
    }

    if (action === "cancel_order_customer") {
      const { data: order, error } = await supabase.rpc(
        "cancel_customer_order",
        { p_order_id: orderId },
      );

      if (error) {
        return jsonResponse({ success: false, error: errorMessage(error) }, 400);
      }

      return jsonResponse({ success: true, order });
    }

    if (action === "update_order_status") {
      const status = String(payload.status || "");
      const { data: order, error } = await supabase.rpc(
        "update_order_status",
        { p_order_id: orderId, p_next_status: status },
      );

      if (error) {
        return jsonResponse({ success: false, error: errorMessage(error) }, 400);
      }

      return jsonResponse({ success: true, order });
    }

    if (action === "cancel_order") {
      const { data: order, error } = await supabase.rpc(
        "update_order_status",
        { p_order_id: orderId, p_next_status: "cancelled" },
      );

      if (error) {
        return jsonResponse({ success: false, error: errorMessage(error) }, 400);
      }

      return jsonResponse({ success: true, order });
    }

    if (action === "update_payment_status") {
      const paymentStatus = String(payload.paymentStatus || "");
      const { data: order, error } = await supabase.rpc(
        "update_payment_status",
        { p_order_id: orderId, p_payment_status: paymentStatus },
      );

      if (error) {
        return jsonResponse({ success: false, error: errorMessage(error) }, 400);
      }

      return jsonResponse({ success: true, order });
    }

    if (action === "create_return_request") {
      const { data: returnRequest, error } = await supabase.rpc(
        "create_customer_return_request",
        {
          p_order_id: String(payload.orderId),
          p_request_type: String(payload.requestType || "return"),
          p_reason: String(payload.reason || ""),
          p_details: String(payload.details || ""),
          p_item_ids: payload.itemIds ?? [],
          p_exchange_note: String(payload.exchangeNote || ""),
        },
      );

      if (error) {
        return jsonResponse({ success: false, error: errorMessage(error) }, 400);
      }

      return jsonResponse({ success: true, returnRequest });
    }

    if (action === "update_return_request") {
      const { data: returnRequest, error } = await supabase.rpc(
        "update_return_request",
        {
          p_order_id: String(payload.orderId),
          p_status: String(payload.status || ""),
          p_resolution:
            payload.resolution ? String(payload.resolution) : null,
          p_refund_amount:
            payload.refundAmount !== undefined
              ? Number(payload.refundAmount)
              : null,
          p_management_note:
            payload.managementNote !== undefined
              ? String(payload.managementNote)
              : null,
        },
      );

      if (error) {
        return jsonResponse({ success: false, error: errorMessage(error) }, 400);
      }

      return jsonResponse({ success: true, returnRequest });
    }

    return jsonResponse(
      { success: false, error: `Unsupported action: ${action}` },
      400,
    );
  } catch (error) {
    console.error("manage-order unexpected error:", error);

    const message = errorMessage(error);
    const status = message.includes("authentication") ? 401 : 500;

    return jsonResponse({ success: false, error: message }, status);
  }
});
