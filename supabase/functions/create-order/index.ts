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

function normalizeError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const candidate = error as Record<string, unknown>;
    if (typeof candidate.message === "string") return candidate.message;
    if (typeof candidate.details === "string") return candidate.details;
    if (typeof candidate.hint === "string") return candidate.hint;
  }
  return "Unable to create the order.";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed." }, 405);
  }

  try {
    const token = getBearerToken(req);
    if (!token) {
      return jsonResponse({ success: false, error: "Authentication is required." }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) throw new Error("SUPABASE_URL is not configured.");

    const supabase = createClient(supabaseUrl, getPublishableKey(), {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return jsonResponse(
        { success: false, error: "Invalid or expired authentication token." },
        401,
      );
    }

    let payload: Record<string, unknown>;
    try {
      payload = await req.json();
    } catch {
      return jsonResponse({ success: false, error: "Invalid JSON request body." }, 400);
    }

    const {
      idempotencyKey,
      customer_Name,
      customer_Email = "",
      customer_Phone,
      shipping_Address,
      shipping_City,
      shipping_Postal_Code = "",
      shipping_Cost = 0,
      discount = 0,
      payment_Method = "cod",
      notes = "",
      items = [],
    } = payload;

    if (!idempotencyKey) return jsonResponse({ success: false, error: "Idempotency key is required." }, 400);
    if (!customer_Name) return jsonResponse({ success: false, error: "Customer name is required." }, 400);
    if (!customer_Phone) return jsonResponse({ success: false, error: "Customer phone is required." }, 400);
    if (!shipping_Address) return jsonResponse({ success: false, error: "Shipping address is required." }, 400);
    if (!shipping_City) return jsonResponse({ success: false, error: "Shipping city is required." }, 400);
    if (!Array.isArray(items) || items.length === 0) {
      return jsonResponse({ success: false, error: "At least one order item is required." }, 400);
    }

    const { data: result, error } = await supabase.rpc("create_order_atomic", {
      p_idempotency_key: String(idempotencyKey),
      p_customer_name: String(customer_Name),
      p_customer_email: String(customer_Email ?? ""),
      p_customer_phone: String(customer_Phone),
      p_shipping_address: String(shipping_Address),
      p_shipping_city: String(shipping_City),
      p_shipping_postal_code: String(shipping_Postal_Code ?? ""),
      p_shipping_cost: Number(shipping_Cost ?? 0),
      p_discount: Number(discount ?? 0),
      p_payment_method: String(payment_Method),
      p_notes: String(notes ?? ""),
      p_items: items,
    });

    if (error) {
      console.error("create_order_atomic failed:", error);
      return jsonResponse({ success: false, error: normalizeError(error) }, 400);
    }

    if (!result?.order_id) {
      return jsonResponse(
        { success: false, error: "Order creation completed without an order ID." },
        500,
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", result.order_id)
      .single();

    if (orderError || !order) {
      console.error("Unable to fetch created order:", orderError);
      return jsonResponse(
        { success: false, error: "Order was created but could not be loaded." },
        500,
      );
    }

    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", result.order_id)
      .order("created_at", { ascending: true });

    if (itemsError) {
      console.error("Unable to fetch order items:", itemsError);
      return jsonResponse(
        { success: false, error: "Order was created but its items could not be loaded." },
        500,
      );
    }

    return jsonResponse({
      success: true,
      order,
      items: orderItems ?? [],
      replayed: Boolean(result.replayed),
    });
  } catch (error) {
    console.error("create-order unexpected error:", error);
    return jsonResponse({ success: false, error: normalizeError(error) }, 500);
  }
});
