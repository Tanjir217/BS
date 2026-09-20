import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

function getSecretKey() {
  const direct = Deno.env.get("SUPABASE_SECRET_KEY");
  if (direct) return direct;
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  const keys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (keys) {
    try {
      const parsed = JSON.parse(keys);
      if (parsed.default) return parsed.default;
    } catch {}
  }
  throw new Error("Supabase secret key is not configured.");
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

async function createPathaoToken() {
  const baseUrl = Deno.env.get("PATHAO_BASE_URL") || "https://api-hermes.pathao.com";
  const clientId = Deno.env.get("PATHAO_CLIENT_ID");
  const clientSecret = Deno.env.get("PATHAO_CLIENT_SECRET");
  const username = Deno.env.get("PATHAO_USERNAME");
  const password = Deno.env.get("PATHAO_PASSWORD");

  if (!clientId || !clientSecret || !username || !password) {
    throw new Error("Pathao credentials are not configured.");
  }

  const response = await fetch(`${baseUrl}/aladdin/api/v1/issue-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      username,
      password,
      grant_type: "password",
    }),
  });

  const body = await response.json();

  if (!response.ok || !body?.access_token) {
    console.error("Pathao token request failed:", { status: response.status, body });
    throw new Error("Unable to authenticate with Pathao.");
  }

  return { baseUrl, accessToken: body.access_token };
}

async function createPathaoOrder(order: any, items: any[]) {
  const storeId = Deno.env.get("PATHAO_STORE_ID");
  if (!storeId) throw new Error("PATHAO_STORE_ID is not configured.");

  const { baseUrl, accessToken } = await createPathaoToken();

  const quantity = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );

  const itemDescriptions = items
    .map((item) => `${item.product_name} x${item.quantity}`)
    .join(", ");

  const payload = {
    store_id: Number(storeId),
    merchant_order_id: order.order_number,
    recipient_name: order.customer_name,
    recipient_phone: order.customer_phone,
    recipient_address: order.shipping_address,
    delivery_type: 48,
    item_type: 2,
    special_instruction: order.notes || "",
    item_quantity: Math.max(quantity, 1),
    item_weight: Number(Deno.env.get("PATHAO_DEFAULT_ITEM_WEIGHT_KG") || "0.5"),
    item_description: itemDescriptions || "Bayzid Shoes order",
    amount_to_collect:
      order.payment_method === "cod" ? Math.round(Number(order.total)) : 0,
  };

  const response = await fetch(`${baseUrl}/aladdin/api/v1/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json();

  if (!response.ok) {
    console.error("Pathao order creation failed:", {
      status: response.status,
      body,
    });
    throw new Error(body?.message || "Pathao rejected the delivery order.");
  }

  const data = body?.data ?? body;
  const consignmentId =
    data?.consignment_id ??
    data?.consignmentId ??
    data?.data?.consignment_id ??
    data?.data?.consignmentId;

  if (!consignmentId) {
    console.error("Pathao returned no consignment ID:", body);
    throw new Error("Pathao created a response without a consignment ID.");
  }

  return {
    consignmentId: String(consignmentId),
    response: body,
    request: payload,
  };
}

async function handleCourierOrder(supabase: any, orderId: string) {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    throw new Error("Order not found or access denied.");
  }

  const { data: existingShipment, error: shipmentReadError } = await supabase
    .from("delivery_shipments")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (shipmentReadError) throw shipmentReadError;

  if (existingShipment?.consignment_id) {
    return { order, shipment: existingShipment, alreadyCreated: true };
  }

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (itemsError) throw itemsError;

  const pathao = await createPathaoOrder(order, items ?? []);

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    getSecretKey(),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const trackingTemplate = Deno.env.get("PATHAO_TRACKING_URL_TEMPLATE");
  const trackingUrl = trackingTemplate
    ? trackingTemplate.replace(
        "{consignment_id}",
        encodeURIComponent(pathao.consignmentId),
      )
    : null;

  const { data: shipment, error: shipmentError } = await supabaseAdmin
    .from("delivery_shipments")
    .upsert(
      {
        id: orderId,
        provider: "pathao",
        consignment_id: pathao.consignmentId,
        tracking_url: trackingUrl,
        status: "created",
        payload: pathao.response,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  if (shipmentError) {
    console.error(
      "Pathao order created but shipment could not be stored:",
      shipmentError,
    );
    throw new Error(
      "Pathao order was created, but shipment data could not be saved.",
    );
  }

  return { order, shipment, alreadyCreated: false };
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
        "create_courier_order",
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

    if (action === "create_courier_order") {
      const result = await handleCourierOrder(supabase, orderId!);

      return jsonResponse({
        success: true,
        order: result.order,
        shipment: result.shipment,
        alreadyCreated: result.alreadyCreated,
      });
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
