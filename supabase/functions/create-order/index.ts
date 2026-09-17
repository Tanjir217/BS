import { withSupabase } from "npm:@supabase/server";

Deno.serve(
  withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") return Response.json({ success: false, error: "Only POST requests are allowed." }, { status: 405 });

    try {
      const body = await req.json();
      const customerId = String(ctx.userClaims?.sub || "").trim();
      if (!customerId) return Response.json({ success: false, error: "Customer authentication is required." }, { status: 401 });

      const items = Array.isArray(body.items)
        ? body.items.map((item: Record<string, unknown>) => ({ product_id: String(item.product_ID || item.productId || "").trim(), quantity: Number(item.quantity || 0) }))
        : [];

      const { data, error } = await ctx.supabase.rpc("create_order_atomic", {
        p_idempotency_key: String(body.idempotencyKey || "").trim(),
        p_customer_id: customerId,
        p_customer_name: String(body.customer_Name || "").trim(),
        p_customer_email: String(body.customer_Email || "").trim(),
        p_customer_phone: String(body.customer_Phone || "").trim(),
        p_shipping_address: String(body.shipping_Address || "").trim(),
        p_shipping_city: String(body.shipping_City || "").trim(),
        p_shipping_postal_code: String(body.shipping_Postal_Code || "").trim(),
        p_shipping_cost: Number(body.shipping_Cost || 0),
        p_discount: Number(body.discount || 0),
        p_payment_method: String(body.payment_Method || "cod").trim(),
        p_notes: String(body.notes || "").trim(),
        p_items: items,
      });

      if (error) {
        console.error("create_order_atomic failed", error);
        return Response.json({ success: false, error: error.message || "Unable to create order." }, { status: 400 });
      }

      return Response.json({ success: true, order: data });
    } catch (error) {
      console.error("create-order failed", error);
      return Response.json({ success: false, error: error instanceof Error ? error.message : "Unable to create order." }, { status: 400 });
    }
  }),
);
