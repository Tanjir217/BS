# Bayzid Shoes — Supabase backend migration

This branch is the **isolated Supabase migration test branch**. It does not import, move, or modify Appwrite data, and it does not modify 'test'.

## Current target

The migration is being completed in this order:
1. Supabase Auth
2. Catalog and storefront reads
3. Customer profile and addresses
4. Homepage/editorial/promotions
5. Server-side order creation
6. COD checkout
7. Customer/admin order lifecycle
8. Returns
9. Storage
10. End-to-end testing
11. **Only after the foundation is stable:** external payment + courier integrations

Payment-provider and courier integrations are intentionally postponed. The current checkout supports **Cash on Delivery only**.

## Database migration

Run: `supabase/migrations/20260921000000_bayzid_backend.sql` in a fresh Supabase test project.

The migration creates:
- Supabase Auth → `public.customers` profile synchronization
- `management_memberships` with owner / manager / staff authorization
- categories
- products
- product images
- homepage sections
- homepage section products
- category promotions
- customer tier rules
- customer addresses
- orders
- order items
- return requests
- delivery shipment schema (no courier integration yet)
- server-side wishlist schema
- RLS policies and explicit Data API grants
- public/private Storage buckets and Storage RLS
- atomic order creation
- customer/admin cancellation
- order status transitions
- payment-status administration
- return request creation/management
- PostgreSQL search indexes for product discovery

There is **no seed/business/customer/product data** in this migration.

## Frontend migration

The migration branch now contains a Supabase frontend adapter at `src/utils/supabase.js`.

`src/utils/appwrite.js` is only a compatibility facade; it makes no Appwrite API calls.

The existing service contracts are intentionally preserved while the backend changes underneath them. Supabase table names default to the names created by the migration, so the old Appwrite table-ID environment variables are no longer required for normal Supabase operation.

Authentication is now handled by Supabase Auth.

Customer addresses use the Supabase table directly with RLS.

Order creation calls the `create-order` Edge Function.

Order lifecycle and returns call the `manage-order` Edge Function.

## Edge Functions

### `create-order`

Responsible for authenticated COD order creation.

It delegates the critical mutation to `public.create_order_atomic(...)`.

The database function:
- derives the customer from `auth.uid()`
- validates the order input
- enforces COD during this migration phase
- enforces the current delivery charges (`100` or `150`)
- rejects client-supplied discounts
- locks product rows
- validates current prices
- validates stock
- creates order-item snapshots
- decrements stock atomically
- enforces idempotency

### `manage-order`

Responsible for:
- customer cancellation
- management order-status changes
- management cancellation
- management payment-status changes
- customer return creation
- management return updates

Courier creation is deliberately not implemented yet.

## First management user

After creating the first management account in Supabase Auth, bootstrap the owner from a trusted SQL/admin environment:

```sql
insert into public.management_memberships (user_id, role)
values ('YOUR_AUTH_USER_UUID', 'owner');
```

Do not put this UUID or any secret key in frontend source code.

## Frontend environment

Required:

```env
VITE_BACKEND_PROVIDER=supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_CREATE_ORDER_FUNCTION_NAME=create-order
VITE_SUPABASE_MANAGE_ORDER_FUNCTION_NAME=manage-order
VITE_SUPABASE_STOREFRONT_BUCKET=storefront-media
```

No Supabase secret/service-role key belongs in Vite environment variables.

## Edge Function deployment

Deploy the two functions from the Supabase Dashboard or CLI:
- `supabase/functions/create-order/index.ts`
- `supabase/functions/manage-order/index.ts`

The current functions require no Pathao credentials because courier integration is postponed.

## Verification sequence

### Database/security
1. Create a fresh Supabase test project.
2. Apply the canonical migration.
3. Confirm all tables and indexes are created.
4. Create one customer Auth account.
5. Confirm the Auth trigger creates its `public.customers` row.
6. Create one management Auth account.
7. Bootstrap it as `owner`.
8. Verify anonymous storefront reads.
9. Verify a customer can only read/write their own addresses and wishlist.
10. Verify a customer cannot read another customer's orders.
11. Verify management roles enforce catalog/order permissions.
12. Verify cross-user access is denied.

### COD order flow
13. Add active products with stock.
14. Sign in as a customer.
15. Add products to cart.
16. Complete checkout with COD.
17. Verify the server-calculated subtotal and total.
18. Verify stock decreases atomically.
19. Repeat the same idempotency request and verify no duplicate order is created.
20. Try a stale product price and verify order creation is rejected.
21. Try insufficient stock and verify order creation is rejected.
22. Try a non-COD payment method and verify it is rejected.
23. Try a manipulated discount and verify it is rejected.
24. Try a manipulated delivery charge and verify it is rejected.
25. Cancel an eligible order and verify stock is restored exactly once.

### Admin/order lifecycle
26. Sign in as owner/manager/staff.
27. Verify allowed order-status transitions.
28. Verify cancellation rules.
29. Verify manual payment-status administration.
30. Verify customer order history and order detail.
31. Verify return creation and management transitions.

### Storefront/content
32. Catalog listing/filter/sort/search.
33. Product detail and product images.
34. Homepage editorial sections.
35. Category promotions.
36. Admin product/category/content management.
37. Storage upload/replace/delete.
38. Customer addresses.
39. Wishlist behavior.
40. Responsive/mobile flows.

### Final validation
41. Run the production build.
42. Run lint.
43. Test the deployed Supabase functions.
44. Test the frontend against the Supabase test project.
45. Record all failures before considering the branch merge-ready.

## Important scope boundary

This branch is not considered production-ready merely because the SQL and frontend adapter are committed.

The migration must be **deployed and tested against a real Supabase test project** before it is considered stable.

Only after that testing passes should this branch be merged into another branch.

No Appwrite data migration is part of this phase.