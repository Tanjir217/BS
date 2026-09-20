# Bayzid Shoes — Supabase backend migration

This branch contains the **new backend only**. The current Appwrite backend on `test` is not imported, copied, or modified by this migration.

## Canonical migration

Run:

`supabase/migrations/20260921000000_bayzid_backend.sql`

in a **fresh Supabase project** for the migration test.

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
- delivery shipments
- **server-side wishlists**
- RLS policies and explicit Data API grants
- Storage buckets and Storage RLS
- atomic order creation
- customer/admin cancellation
- order status transitions
- payment status updates
- return request creation and management
- search indexes for product contains-style search

## Important

This migration contains **schema and backend logic only**.

It does **not**:

- import Appwrite rows
- import Appwrite users
- copy Appwrite Storage files
- change the React frontend
- change the `test` branch
- replace the currently working Appwrite backend

The frontend service layer will be migrated only after this database/security layer has been tested.

## First management user

After creating the first management account in Supabase Auth, bootstrap the owner:

```sql
insert into public.management_memberships (user_id, role)
values ('YOUR_AUTH_USER_UUID', 'owner');
```

Do this from a trusted SQL/admin environment, not from the browser.

## Security model

The browser will eventually use only the Supabase publishable key. All exposed public tables have RLS and explicit grants. Customer-owned records are scoped with `auth.uid()`. Management authorization is enforced in PostgreSQL rather than only by hiding frontend routes.

Privileged order/courier operations will be kept in database functions and Supabase Edge Functions. Pathao credentials must never be placed in Vite/browser environment variables.

## Verification sequence

1. Create a fresh Supabase test project.
2. Apply the migration.
3. Create one customer Auth user.
4. Confirm the customer profile trigger creates `public.customers`.
5. Create one management Auth user and bootstrap it as `owner`.
6. Test anonymous catalog reads.
7. Test customer-only addresses/orders/wishlist access.
8. Test cross-user denial cases.
9. Test owner/manager/staff authorization.
10. Test atomic order creation, idempotency, price validation, stock locking and cancellation.
11. Add pgTAP RLS tests.
12. Only after those pass, migrate the frontend service implementations.

