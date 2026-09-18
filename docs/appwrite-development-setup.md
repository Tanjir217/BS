# Bayzid Shoes — Appwrite development database setup

The current development branch uses Appwrite. Supabase is the production checkpoint and must not be selected until the Supabase migration/RLS/function verification is complete.

## 1. Appwrite project

Create/select one Appwrite project and record:

- Project ID
- API endpoint: `https://sgp.cloud.appwrite.io/v1`
- One database ID
- One product-image storage bucket ID
- One management team ID

Put the public IDs in the Vite environment file. Never put Function API keys, Pathao access tokens, payment secrets, or Supabase service-role keys in `VITE_*` variables.

## 2. Required Appwrite TablesDB tables

### products

Required columns:

| Column         | Type             | Required |
| -------------- | ---------------- | -------- |
| name           | varchar          | yes      |
| slug           | varchar          | yes      |
| sku            | varchar          | yes      |
| description    | string/long text | no       |
| price          | integer/double   | yes      |
| compareAtPrice | double           | no       |
| categoryID     | varchar          | yes      |
| color          | varchar          | no       |
| colorHEX       | varchar          | no       |
| stockQuantity  | integer          | yes      |
| isFeatured     | boolean          | yes      |
| isActive       | boolean          | yes      |

Customers must have read access to active product rows. Management users need the permissions required by the existing admin product UI.

### product_images

Required columns:

| Column     | Type    | Required |
| ---------- | ------- | -------- |
| product_ID | varchar | yes      |
| fileID     | varchar | yes      |
| alt        | varchar | no       |
| sortOrder  | integer | yes      |
| isPrimary  | boolean | yes      |

Customers need read access. The storage bucket must allow the storefront to view product images.

### categories

Required columns:

| Column           | Type    | Required |
| ---------------- | ------- | -------- |
| name             | varchar | yes      |
| slug             | varchar | yes      |
| description      | string  | no       |
| imageUrl         | varchar | no       |
| parentCategoryID | varchar | no       |
| isActive         | boolean | yes      |

### home_sections

The current homepage service expects fields including:

- `section_key`
- `type`
- `title`
- `sub_title`
- `is_Active`
- `sort_Order`
- `editorial_File_ID`
- `editorial_Alt`
- `cta_Label`
- `cta_Href`

### home_sections_products

Required fields:

- `section_ID`
- `product_ID`
- `scene`
- `sort_Order`
- `is_Active`
- `image_ID` (optional selected product-image row ID for editorial sliders)

### category_promotions

Create one row per storefront category that needs an independent banner. The project currently uses the special `all-products` key plus normal root category IDs such as the Men and Women category IDs.

Required fields:

| Column | Type | Required |
| --- | --- | --- |
| `category_ID` | varchar | yes |
| `title` | varchar | yes |
| `sub_title` | text | no |
| `image_File_ID` | varchar | no |
| `image_Alt` | varchar | no |
| `cta_Label` | varchar | no |
| `cta_Href` | varchar | no |
| `is_Active` | boolean | yes |
| `sort_Order` | integer | yes |

Create a unique index on `category_ID` so each category has at most one banner configuration. The `image_File_ID` points to a file in the existing editorial/product Storage bucket.

The frontend reads this table for the current category; it does not use localStorage.
### customers

The existing management/customer analytics code expects:

- `first_Name`
- `last_Name`
- `email`
- `phone`
- `account_ID`
- `profile_Image_File_ID`
- `address`
- `city`
- `postal_Code`
- `whatsapp_Number`
- `customer_Tire`
- `is_Active`
- `total_Orders`
- `total_Spent`
- `last_Order_At`

Recommended `customer_Tire` values: `regular`, `premium`, `vip`.

### customer_tier_rules

The current service expects:

- `is_Active`
- `sort_Order`

Plus the tier/rule fields used by your existing admin UI.

### customer_addresses

Required fields:

- `customer_ID`
- `label`
- `recipient_Name`
- `phone`
- `address_Line_1`
- `address_Line_2`
- `city`
- `postal_Code`
- `country`
- `is_Default`

Customer address reads/writes now go through the existing `manage-order` Function so the browser never needs table-wide read permission. The Function scopes every operation to the authenticated Appwrite user ID.

Recommended table security:

- Enable Row Security.
- Do **not** grant customers table-wide read/update/delete access.
- Management/server access is provided through the Function's server integration.
- Address rows may retain row-level permissions for the owning customer as defense in depth.

This avoids exposing other customers' addresses through a client-side `listRows` query.

### orders

Required fields:

- `order_Number`
- `idempotency_Key`
- `customer_ID`
- `customer_Name`
- `customer_Email`
- `customer_Phone`
- `shipping_Address`
- `shipping_City`
- `shipping_Postal_Code`
- `subtotal`
- `shipping_Cost`
- `discount`
- `total`
- `payment_Method`
- `payment_Status`
- `order_Status`
- `notes`

Recommended values:

- payment method: `cod`
- payment status: `pending`, `paid`, `failed`, `refunded`
- order status: `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`

`idempotency_Key` must be unique.

Do not grant customers table-wide arbitrary create/update/delete access. Order creation is performed by the `create-order` Function.

### order_items

Required fields:

- `order_ID`
- `product_ID`
- `product_Name`
- `product_SKU`
- `product_Color`
- `unit_Price`
- `quantity`
- `line_Total`

Customers should only be able to read their own order items.

### return_requests

Required fields:

- `return_Number`
- `order_ID`
- `customer_ID`
- `request_Type`
- `reason`
- `details`
- `requested_Item_IDs`
- `exchange_Note`
- `status`
- `resolution`
- `refund_Amount`
- `management_Note`

Supported request types:

- `return`
- `exchange`

Supported statuses:

`requested → approved/rejected/cancelled → pickup → received → completed`

The customer can read their own request. Customer creation and management updates are now routed through the `manage-order` Function so the server validates ownership, delivery status, item IDs, transitions, and refund limits.

### delivery_shipments

For the courier phase, create a table with:

- `order_ID`
- `provider`
- `consignment_ID`
- `tracking_URL`
- `status`
- `payload`

Use one shipment row per order/provider. Customer read access should be row-level to the order owner. Management access should be restricted to the management team.

> The courier Function now persists a structured shipment row and keeps the order marker as a backward-compatible fallback.

## Customer registration and order cancellation access

The browser creates a customer profile immediately after an Appwrite Account is created. The `customers` table must therefore support this secure pattern:

- Enable Row Security.
- Table-level **Create** permission: authenticated users (`Users`).
- Table-level **Read/Update/Delete**: management team only.
- New customer rows are created with the Appwrite account ID as the row ID and a row-level **Read** permission for that same user. The customer cannot update business fields such as tier, totals, or active status.

The `manage-order` Function also serves authenticated customer cancellation requests. Its server-side authorization already checks customer ownership, cancellable order status, and pending payment status. Because the browser invokes this Function directly, its **Execute access** must include authenticated users (`Users`) in addition to the management team. Do not remove the server-side management-role checks; management operations remain protected by the Function.

In Appwrite Console:

1. Open **Functions → manage-order → Settings → Execute access**.
2. Add **Users** as an execute role.
3. Keep the management team role available for management users.
4. Redeploy if Appwrite marks the function configuration as needing deployment.

The error `Missing "execute" permission for role "team:..."` means the client session is reaching the Function with a team-only execute permission, so a normal customer session is rejected before `manage-order` can run.

## 3. Storage bucket

Create one bucket for product/editorial images.

The storefront needs file-view/read access. Upload/update/delete should be restricted to management users.

## 4. Management team

Create one Appwrite Team and use its ID as:

`VITE_APPWRITE_MANAGEMENT_TEAM_ID`

Membership roles used by the application:

- owner
- manager
- staff

The `manage-order` Function checks the membership server-side. Frontend role guards are only UI controls.

## 5. Functions

Appwrite Free currently gives this project two Functions, so keep the existing two:

### create-order

Environment variables:

```
APPWRITE_DATABASE_ID
APPWRITE_PRODUCTS_TABLE_ID
APPWRITE_ORDERS_TABLE_ID
APPWRITE_ORDER_ITEMS_TABLE_ID
```

The Function must have database row read/write access required for products, orders and order items.

### manage-order

Environment variables:

```
APPWRITE_DATABASE_ID
APPWRITE_PRODUCTS_TABLE_ID
APPWRITE_ORDERS_TABLE_ID
APPWRITE_ORDER_ITEMS_TABLE_ID
APPWRITE_RETURN_REQUESTS_TABLE_ID
APPWRITE_DELIVERY_SHIPMENTS_TABLE_ID
APPWRITE_CUSTOMER_ADDRESSES_TABLE_ID
APPWRITE_MANAGEMENT_TEAM_ID
```

For courier:

```
PATHAO_API_BASE_URL
PATHAO_ACCESS_TOKEN
PATHAO_STORE_ID
PATHAO_DELIVERY_TYPE=48
PATHAO_ITEM_TYPE=2
PATHAO_DEFAULT_ITEM_WEIGHT=0.5
```

Pathao credentials must stay in the Function environment, never in the browser.

## 6. Frontend environment

Copy `.env.example` to your local `.env` and fill the IDs:

```env
VITE_BACKEND_PROVIDER=appwrite
VITE_APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=...
VITE_APPWRITE_DATABASE_ID=...
VITE_APPWRITE_PRODUCTS_TABLE_ID=...
VITE_APPWRITE_PRODUCT_IMAGES_TABLE_ID=...
VITE_APPWRITE_CATEGORIES_TABLE_ID=...
VITE_APPWRITE_HOME_SECTIONS_TABLE_ID=...
VITE_APPWRITE_HOME_SECTIONS_PRODUCTS_TABLE_ID=...
VITE_APPWRITE_CATEGORY_PROMOTIONS_TABLE_ID=...
VITE_APPWRITE_CUSTOMERS_TABLE_ID=...
VITE_APPWRITE_CUSTOMER_TIER_RULES_TABLE_ID=...
VITE_APPWRITE_ORDERS_TABLE_ID=...
VITE_APPWRITE_ORDER_ITEMS_TABLE_ID=...
VITE_APPWRITE_RETURN_REQUESTS_TABLE_ID=...
VITE_APPWRITE_BUCKET_ID=...
VITE_APPWRITE_CREATE_ORDER_FUNCTION_ID=...
VITE_APPWRITE_MANAGE_ORDER_FUNCTION_ID=...
VITE_APPWRITE_MANAGEMENT_TEAM_ID=...
```

Restart Vite after changing environment variables.

## 7. Supabase production checkpoint

Do not create the Supabase production connection by simply changing the provider variable.

The repository contains the production schema and authenticated `create-order` Edge Function, but the production Supabase project still needs:

1. schema migration
2. data migration
3. Auth identity mapping
4. Storage configuration
5. RLS verification
6. management Edge Functions
7. courier Edge Function
8. return/exchange server actions
9. payment gateway server integration

Only after those are verified should:

```
VITE_BACKEND_PROVIDER=supabase
```

be used in production.
