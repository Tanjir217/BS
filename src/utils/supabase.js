import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.");
}

export const supabase = createClient(url || "https://invalid.local", key || "invalid", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export function appwriteId() {
  return crypto.randomUUID();
}

const FIELD_ALIASES = {
  id: "$id",
  created_at: "$createdAt",
  updated_at: "$updatedAt",
  first_name: "first_Name",
  last_name: "last_Name",
  account_id: "account_ID",
  profile_image_file_id: "profile_Image_File_ID",
  postal_code: "postal_Code",
  whatsapp_number: "whatsapp_Number",
  customer_tier: "customer_Tire",
  is_active: "isActive",
  total_orders: "total_Orders",
  total_spent: "total_Spent",
  last_order_at: "last_Order_At",
  parent_category_id: "parentCategoryID",
  image_url: "imageUrl",
  category_id: "categoryID",
  color_hex: "colorHEX",
  stock_quantity: "stockQuantity",
  is_featured: "isFeatured",
  compare_at_price: "compareAtPrice",
  product_id: "product_ID",
  file_id: "fileID",
  is_primary: "isPrimary",
  section_key: "section_key",
  tier_name: "tier_name",
  minimum_spent: "minimum_spent",
  section_id: "section_ID",
  sub_title: "sub_title",
  product_name: "product_Name",
  product_sku: "product_SKU",
  product_color: "product_Color",
  unit_price: "unit_Price",
  line_total: "line_Total",
  payment_method: "payment_Method",
  payment_status: "payment_Status",
  order_status: "order_Status",
  customer_id: "customer_ID",
  order_id: "order_ID",
  shipping_address: "shipping_Address",
  shipping_city: "shipping_City",
  shipping_postal_code: "shipping_Postal_Code",
  shipping_cost: "shipping_Cost",
  order_number: "order_Number",
  customer_name: "customer_Name",
  customer_email: "customer_Email",
  customer_phone: "customer_Phone",
  idempotency_key: "idempotency_Key",
  cancelled_at: "cancelled_At",
  cancelled_by: "cancelled_By",
  home_section_id: "section_ID",
  sub_title: "sub_title",
  editorial_file_id: "editorial_File_ID",
  editorial_alt: "editorial_Alt",
  cta_label: "cta_Label",
  cta_href: "cta_Href",
  sort_order: "sortOrder",
  image_file_id: "image_File_ID",
  image_id: "image_ID",
  image_alt: "image_Alt",
  promotion_key: "promotion_Key",
  request_type: "request_Type",
  return_number: "return_Number",
  requested_item_ids: "requested_Item_Ids",
  exchange_note: "exchange_Note",
  management_note: "management_Note",
  refund_amount: "refund_Amount",
  delivery_shipments: "deliveryShipments",
  consignment_id: "consignment_ID",
  tracking_url: "tracking_URL",
};

const REVERSE_ALIASES = Object.fromEntries(
  Object.entries(FIELD_ALIASES).map(([db, appwrite]) => [appwrite, db]),
);

function toCamelKey(key) {
  if (FIELD_ALIASES[key]) return FIELD_ALIASES[key];
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function toSnakeKey(key) {
  if (key === "is_Active" || key === "isActive") return "is_active";
  if (REVERSE_ALIASES[key]) return REVERSE_ALIASES[key];
  if (key === "$id") return "id";
  if (key === "$createdAt") return "created_at";
  if (key === "$updatedAt") return "updated_at";
  return key.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
}

export function fromSupabaseRow(value) {
  if (Array.isArray(value)) return value.map(fromSupabaseRow);
  if (!value || typeof value !== "object") return value;

  const output = {};
  for (const [key, val] of Object.entries(value)) {
    output[toCamelKey(key)] = fromSupabaseRow(val);
  }
  return output;
}

function toDb(value) {
  if (Array.isArray(value)) return value.map(toDb);
  if (!value || typeof value !== "object" || typeof File !== "undefined" && value instanceof File) return value;

  const output = {};
  for (const [key, val] of Object.entries(value)) {
    output[toSnakeKey(key)] = toDb(val);
  }
  return output;
}

function splitQueryArgs(source) {
  const args = [];
  let current = "";
  let quote = null;
  let depth = 0;

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      current += ch;
      if (ch === quote && source[i - 1] !== "\\") quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === "[" || ch === "(" || ch === "{") depth += 1;
    if (ch === "]" || ch === ")" || ch === "}") depth -= 1;
    if (ch === "," && depth === 0) {
      args.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) args.push(current.trim());
  return args;
}

function parseQuery(query) {
  if (typeof query !== "string") return null;

  const trimmed = query.trim();

  // Appwrite SDKs emit compact query strings. Accept the JSON query
  // representation too so valid queries are never silently discarded.
  try {
    const jsonQuery = JSON.parse(trimmed);
    if (jsonQuery && typeof jsonQuery === "object" && !Array.isArray(jsonQuery)) {
      const op = jsonQuery.method || jsonQuery.op;
      const field = jsonQuery.attribute ?? jsonQuery.column;
      const values = jsonQuery.values ?? jsonQuery.value ?? [];
      if (op) {
        return {
          op,
          args:
            field === undefined
              ? [values]
              : [
                  field,
                  Array.isArray(values) && values.length === 1
                    ? values[0]
                    : values,
                ],
        };
      }
    }
  } catch {
    // Fall through to Appwrite's compact query syntax.
  }

  const match = trimmed.match(/^([a-zA-Z]+)\\((.*)\\)$/);
  if (!match) return null;

  const [, op, body] = match;
  const args = splitQueryArgs(body).map((arg) => {
    try { return JSON.parse(arg); } catch {}
    return arg.replace(/^\"(.*)\"$/, "$1");
  });

  return { op, args };
}

function queryFilterParts(queries = []) {
  return queries.map(parseQuery).filter(Boolean);
}

function applyQuery(builder, parsed) {
  let result = builder;
  let selected = null;
  let offset = null;
  let limit = null;

  for (const q of parsed) {
    const [fieldRaw, valueRaw] = q.args;
    const field = toSnakeKey(String(fieldRaw ?? ""));

    switch (q.op) {
      case "equal": {
        const values = Array.isArray(valueRaw) ? valueRaw : [valueRaw];
        result = values.length > 1 ? result.in(field, values) : result.eq(field, values[0]);
        break;
      }
      case "notEqual": result = result.neq(field, valueRaw); break;
      case "lessThan": result = result.lt(field, valueRaw); break;
      case "lessThanEqual": result = result.lte(field, valueRaw); break;
      case "greaterThan": result = result.gt(field, valueRaw); break;
      case "greaterThanEqual": result = result.gte(field, valueRaw); break;
      case "isNull": result = result.is(field, null); break;
      case "isNotNull": result = result.not(field, "is", null); break;
      case "contains":
        result = result.ilike(field, "%" + String(valueRaw ?? "") + "%");
        break;
      case "startsWith":
        result = result.ilike(field, String(valueRaw ?? "") + "%");
        break;
      case "endsWith":
        result = result.ilike(field, "%" + String(valueRaw ?? ""));
        break;
      case "orderAsc": result = result.order(field, { ascending: true }); break;
      case "orderDesc": result = result.order(field, { ascending: false }); break;
      case "limit": limit = Number(valueRaw); break;
      case "offset": offset = Number(valueRaw); break;
      case "select": {
        const fields = Array.isArray(valueRaw) ? valueRaw.map(toSnakeKey) : ["*"];
        selected = fields.join(",");
        break;
      }
      case "or":
      case "and": {
        const nested = Array.isArray(valueRaw) ? valueRaw.map(parseQuery).filter(Boolean) : [];
        const clauses = nested.map((n) => {
          const f = toSnakeKey(String(n.args[0] ?? ""));
          const v = n.args[1];
          const values = Array.isArray(v) ? v : [v];

          if (n.op === "contains") return f + ".ilike.%" + String(v) + "%";
          if (n.op === "startsWith") return f + ".ilike." + String(v) + "%";
          if (n.op === "endsWith") return f + ".ilike.%" + String(v);
          if (n.op === "equal") {
            if (values.length > 1) {
              return f + ".in.(" + values.map((value) => encodeURIComponent(String(value))).join(",") + ")";
            }
            return f + ".eq." + encodeURIComponent(String(values[0]));
          }
          if (n.op === "notEqual") return f + ".neq." + encodeURIComponent(String(values[0]));
          if (n.op === "greaterThan") return f + ".gt." + encodeURIComponent(String(values[0]));
          if (n.op === "greaterThanEqual") return f + ".gte." + encodeURIComponent(String(values[0]));
          if (n.op === "lessThan") return f + ".lt." + encodeURIComponent(String(values[0]));
          if (n.op === "lessThanEqual") return f + ".lte." + encodeURIComponent(String(values[0]));
          if (n.op === "isNull") return f + ".is.null";
          if (n.op === "isNotNull") return f + ".not.is.null";
          return null;
        }).filter(Boolean);

        if (clauses.length) {
          result = q.op === "or"
            ? result.or(clauses.join(","))
            : result.or(clauses.map((clause) => "and(" + clause + ")").join(","));
        }
        break;
      }
      default:
        throw new Error("Unsupported Appwrite query in Supabase adapter: " + q.op);
    }
  }

  if (offset !== null) {
    const end = offset + Math.max(0, (limit ?? 1000) - 1);
    result = result.range(offset, end);
  } else if (limit !== null) {
    result = result.limit(limit);
  }

  return { result, selected };
}

function resolveTableName(tableId) {
  if (!tableId) throw new Error("Supabase table name is required.");
  return String(tableId);
}

function makeResponse(data, count = null) {
  return { rows: (data || []).map(fromSupabaseRow), total: count ?? (data || []).length };
}

export const tablesDB = {
  async listRows({ tableId, queries = [], total = true }) {
    const parsed = queryFilterParts(queries);
    const selectQuery = parsed.find((q) => q.op === "select");
    let builder = supabase.from(resolveTableName(tableId)).select(
      selectQuery ? (Array.isArray(selectQuery.args[0]) ? selectQuery.args[0].map(toSnakeKey).join(",") : "*") : "*",
      { count: total === false ? undefined : "exact" },
    );
    const { result } = applyQuery(builder, parsed);
    const response = await result;
    if (response.error) throw response.error;
    return makeResponse(response.data, response.count);
  },

  async getRow({ tableId, rowId }) {
    const response = await supabase.from(resolveTableName(tableId)).select("*").eq("id", rowId).single();
    if (response.error) {
      if (response.status === 406 || response.code === "PGRST116") {
        const error = new Error("Row not found");
        error.code = 404;
        throw error;
      }
      throw response.error;
    }
    return fromSupabaseRow(response.data);
  },

  async createRow({ tableId, rowId, data }) {
    const payload = toDb(data);
    if (rowId && rowId !== "unique()" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(rowId))) payload.id = rowId;
    const response = await supabase.from(resolveTableName(tableId)).insert(payload).select("*").single();
    if (response.error) throw response.error;
    return fromSupabaseRow(response.data);
  },

  async updateRow({ tableId, rowId, data }) {
    const response = await supabase.from(resolveTableName(tableId)).update(toDb(data)).eq("id", rowId).select("*").single();
    if (response.error) throw response.error;
    return fromSupabaseRow(response.data);
  },

  async deleteRow({ tableId, rowId }) {
    const response = await supabase.from(resolveTableName(tableId)).delete().eq("id", rowId);
    if (response.error) throw response.error;
    return true;
  },
};

export const account = {
  async get() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      const e = new Error("Not authenticated");
      e.code = 401;
      throw e;
    }
    return {
      $id: data.user.id,
      name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || "",
      email: data.user.email || "",
    };
  },

  async create({ userId, email, password, name }) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
  },

  async createEmailPasswordSession({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.session;
  },

  async deleteSession() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  },

  async updateName({ name }) {
    const { data, error } = await supabase.auth.updateUser({ data: { name } });
    if (error) throw error;
    return {
      $id: data.user.id,
      name: data.user.user_metadata?.name || name,
      email: data.user.email || "",
    };
  },
};

export const teams = {
  async get() { return { $id: "supabase-management" }; },
  async listMemberships({ queries = [] }) {
    const userQuery = queries.find((q) => String(q).includes("userId"));
    const rawUserId = parseQuery(userQuery)?.args?.[1];
    const userId = (Array.isArray(rawUserId) ? rawUserId[0] : rawUserId) || (await supabase.auth.getUser()).data.user?.id;
    const response = await supabase.from("management_memberships").select("*").eq("user_id", userId).maybeSingle();
    if (response.error) throw response.error;
    if (!response.data) return { memberships: [] };
    return { memberships: [{ ...fromSupabaseRow(response.data), roles: [response.data.role], confirm: true }] };
  },
};

export const storage = {
  getFileView({ bucketId, fileId }) {
    return supabase.storage.from(bucketId || "storefront-media").getPublicUrl(fileId).data.publicUrl;
  },
  async createFile({ bucketId, fileId, file }) {
    const bucket = bucketId || "storefront-media";
    const path = fileId;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false, contentType: file?.type });
    if (error) throw error;
    return { $id: path };
  },
  async deleteFile({ bucketId, fileId }) {
    const { error } = await supabase.storage.from(bucketId || "storefront-media").remove([fileId]);
    if (error) throw error;
    return true;
  },
};

export const functions = {
  async createExecution({ functionId, body }) {
    const mapping = {
      "create-order": "create-order",
      "manage-order": "manage-order",
    };
    const name = mapping[functionId] || functionId;
    const payload = body ? JSON.parse(body) : {};
    const { data, error } = await supabase.functions.invoke(name, { body: payload });
    const responseBody = error ? (error.context ? await error.context.text().catch(() => "") : "") : JSON.stringify(data ?? {});
    return {
      responseStatusCode: error ? (error.context?.status || 500) : 200,
      responseBody: responseBody || JSON.stringify(data ?? {}),
    };
  },
};
