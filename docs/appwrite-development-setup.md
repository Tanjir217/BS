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

| Column | Type | Required |
|---|---|---|
| name | varchar | yes |
| slug | varchar | yes |
| sku | varchar | yes |
| description | string/long text | no |
| price | integer/double | yes |
| compareAtPrice | double | no |
| categoryID | varchar | yes |
| color | varchar | no |
| colorHEX | varchar | no |
| stockQuantity | integer | yes |
| isFeatured | boolean | yes |
| isActive | boolean | yes |

Customers must have read access to active product rows. Management users need the permissions required by the existing admin product UI.

### product_images

Required columns:

| Column | Type | Required |
|---|---|---|
| product_ID | varchar | yes |
| fileID | varchar | yes |
| alt | varchar | no |
| sortOrder | integer | yes |
| isPrimary | boolean | yes |

Customers need read access. The storage bucket must allow the storefront to view product images.

### categories

Required columns:

| Column | Type | Required |
|---|---|---|
| name | varchar | yes |
| slug | varchar | yes |
| description | string | no |
| imageUrl | varchar | no |
| parentCategoryID | varchar | no |
| isActive | boolean | yes |

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

Customer rows should use row-level permissions:

- read → owning customer
- update → owning customer
- delete → owning customer

Table-level create permission must allow authenticated customers to create their own rows; the service always writes the authenticated user's ID.

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

> The current courier implementation still stores the Pathao consignment marker on the order while the Appwrite shipment table is being connected. Do not remove the marker until the shipment table integration is verified.

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
VITE_APPWRITE_CUSTOMERS_TABLE_ID=...
VITE_APPWRITE_CUSTOMER_TIER_RULES_TABLE_ID=...
VITE_APPWRITE_CUSTOMER_ADDRESSES_TABLE_ID=...
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
