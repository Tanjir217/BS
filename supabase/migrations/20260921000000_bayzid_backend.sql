-- Bayzid Shoes — Supabase backend foundation
-- Migration branch: feature/supabase-backend-migration
--
-- IMPORTANT:
-- This migration creates an empty Supabase backend. It does NOT import
-- Appwrite data, users, or Storage objects.
--
-- The React application is intentionally not changed by this migration.
-- Frontend service adapters will be migrated separately after this schema,
-- RLS, and database business logic are verified.
--
-- The schema below is derived from the current Appwrite-backed test branch:
-- products, product_images, categories, home_sections,
-- home_sections_products, category_promotions, customers,
-- customer_tier_rules, customer_addresses, orders, order_items,
-- return_requests, delivery_shipments, and the new server-side wishlists.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- Shared trigger helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Management authorization
-- ---------------------------------------------------------------------------

create table public.management_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index management_memberships_role_idx
  on public.management_memberships(role);

create or replace function private.has_management_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.management_memberships mm
    where mm.user_id = (select auth.uid())
      and (
        mm.role = 'owner'
        or mm.role = required_role
      )
  );
$$;

create or replace function private.is_management_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.management_memberships mm
    where mm.user_id = (select auth.uid())
  );
$$;

create or replace function private.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.management_memberships mm
    where mm.user_id = (select auth.uid())
      and mm.role = 'owner'
  );
$$;

revoke execute on function private.has_management_role(text) from public;
revoke execute on function private.is_management_member() from public;
revoke execute on function private.is_owner() from public;

grant usage on schema private to anon, authenticated;
grant execute on function private.has_management_role(text) to anon, authenticated;
grant execute on function private.is_management_member() to anon, authenticated;
grant execute on function private.is_owner() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Customers / Auth profile
-- ---------------------------------------------------------------------------

create table public.customers (
  id uuid primary key references auth.users(id) on delete cascade,
  account_id uuid not null unique references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  email text not null default '',
  phone text not null default '',
  profile_image_file_id text not null default '',
  address text not null default '',
  city text not null default '',
  postal_code text not null default '',
  whatsapp_number text not null default '',
  customer_tier text not null default 'regular'
    check (customer_tier in ('regular', 'premium', 'vip')),
  is_active boolean not null default true,
  total_orders integer not null default 0 check (total_orders >= 0),
  total_spent numeric(12,2) not null default 0 check (total_spent >= 0),
  last_order_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_created_at_idx
  on public.customers(created_at desc);

create index customers_tier_idx
  on public.customers(customer_tier);

create index customers_active_idx
  on public.customers(is_active);

create index customers_email_idx
  on public.customers(lower(email));

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  full_name text;
  first_name_value text;
  last_name_value text;
begin
  full_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    ''
  );

  first_name_value := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
    case
      when full_name <> '' then split_part(full_name, ' ', 1)
      else 'Customer'
    end,
    'Customer'
  );

  last_name_value := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'last_name'), ''),
    case
      when full_name <> '' and position(' ' in full_name) > 0
        then trim(substr(full_name, position(' ' in full_name) + 1))
      else ''
    end,
    ''
  );

  insert into public.customers (
    id,
    account_id,
    first_name,
    last_name,
    email
  )
  values (
    new.id,
    new.id,
    first_name_value,
    last_name_value,
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.sync_auth_user_to_customer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  full_name text;
  first_name_value text;
  last_name_value text;
begin
  full_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    ''
  );

  first_name_value := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
    case
      when full_name <> '' then split_part(full_name, ' ', 1)
      else 'Customer'
    end,
    'Customer'
  );

  last_name_value := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'last_name'), ''),
    case
      when full_name <> '' and position(' ' in full_name) > 0
        then trim(substr(full_name, position(' ' in full_name) + 1))
      else ''
    end,
    ''
  );

  update public.customers
  set
    first_name = first_name_value,
    last_name = last_name_value,
    email = coalesce(new.email, ''),
    updated_at = now()
  where id = new.id;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

create trigger on_auth_user_updated
after update of email, raw_user_meta_data on auth.users
for each row
execute function public.sync_auth_user_to_customer();

-- These are trigger entry points, not client-callable APIs.
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
revoke execute on function public.sync_auth_user_to_customer() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  image_url text not null default '',
  parent_category_id uuid references public.categories(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index categories_parent_idx
  on public.categories(parent_category_id);

create index categories_active_name_idx
  on public.categories(is_active, name);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sku text not null,
  description text not null default '',
  price numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2)
    check (compare_at_price is null or compare_at_price >= 0),
  category_id uuid references public.categories(id) on delete set null,
  color text not null default '',
  color_hex text not null default '',
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index products_sku_unique_idx
  on public.products(lower(sku));

create index products_category_idx
  on public.products(category_id);

create index products_active_created_idx
  on public.products(is_active, created_at desc);

create index products_active_price_idx
  on public.products(is_active, price);

create index products_active_color_idx
  on public.products(is_active, color);

create index products_low_stock_idx
  on public.products(stock_quantity)
  where is_active = true;

create index products_name_trgm_idx
  on public.products using gin (lower(name) gin_trgm_ops);

create index products_slug_trgm_idx
  on public.products using gin (lower(slug) gin_trgm_ops);

create index products_sku_trgm_idx
  on public.products using gin (lower(sku) gin_trgm_ops);

create index products_color_trgm_idx
  on public.products using gin (lower(color) gin_trgm_ops);

create index products_description_trgm_idx
  on public.products using gin (lower(description) gin_trgm_ops);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  file_id text not null,
  alt text not null default '',
  sort_order integer not null default 0 check (sort_order >= 0),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index product_images_product_sort_idx
  on public.product_images(product_id, sort_order);

create unique index product_images_one_primary_idx
  on public.product_images(product_id)
  where is_primary = true;

-- ---------------------------------------------------------------------------
-- Homepage editorial content
-- ---------------------------------------------------------------------------

create table public.home_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  type text not null default 'editorial-section',
  title text not null default '',
  sub_title text not null default '',
  editorial_file_id text not null default '',
  editorial_alt text not null default '',
  cta_label text not null default '',
  cta_href text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index home_sections_active_sort_idx
  on public.home_sections(is_active, sort_order);

create table public.home_sections_products (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.home_sections(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  scene numeric,
  image_id uuid references public.product_images(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(section_id, product_id)
);

create index home_sections_products_section_sort_idx
  on public.home_sections_products(section_id, is_active, sort_order);

create index home_sections_products_product_idx
  on public.home_sections_products(product_id);

-- ---------------------------------------------------------------------------
-- Category promotions
-- ---------------------------------------------------------------------------

create table public.category_promotions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete cascade,
  promotion_key text,
  title text not null,
  sub_title text not null default '',
  image_file_id text not null default '',
  image_alt text not null default '',
  cta_label text not null default '',
  cta_href text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (category_id is not null and promotion_key is null)
    or
    (category_id is null and promotion_key = 'all-products')
  )
);

create unique index category_promotions_category_unique_idx
  on public.category_promotions(category_id)
  where category_id is not null;

create unique index category_promotions_key_unique_idx
  on public.category_promotions(promotion_key)
  where promotion_key is not null;

create index category_promotions_active_sort_idx
  on public.category_promotions(is_active, sort_order);

-- ---------------------------------------------------------------------------
-- Customer tiers
-- ---------------------------------------------------------------------------

create table public.customer_tier_rules (
  id uuid primary key default gen_random_uuid(),
  tier_name text not null,
  minimum_spent numeric(12,2) not null default 0 check (minimum_spent >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tier_name)
);

create index customer_tier_rules_active_sort_idx
  on public.customer_tier_rules(is_active, sort_order);

create index customer_tier_rules_minimum_spent_idx
  on public.customer_tier_rules(minimum_spent);

-- ---------------------------------------------------------------------------
-- Customer addresses
-- ---------------------------------------------------------------------------

create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  label text not null check (label in ('home', 'office', 'other')),
  recipient_name text not null,
  phone text not null,
  address_line_1 text not null,
  address_line_2 text not null default '',
  city text not null,
  postal_code text not null,
  country text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customer_addresses_customer_created_idx
  on public.customer_addresses(customer_id, created_at desc);

create unique index customer_addresses_one_default_idx
  on public.customer_addresses(customer_id)
  where is_default = true;

create or replace function public.normalize_customer_address_default()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.is_default then
    update public.customer_addresses
    set is_default = false,
        updated_at = now()
    where customer_id = new.customer_id
      and id <> coalesce(new.id, gen_random_uuid())
      and is_default = true;
  end if;

  return new;
end;
$$;

create trigger customer_addresses_default_trigger
before insert or update of customer_id, is_default
on public.customer_addresses
for each row
execute function public.normalize_customer_address_default();

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  customer_email text not null default '',
  customer_phone text not null,
  shipping_address text not null,
  shipping_city text not null,
  shipping_postal_code text not null default '',
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  shipping_cost numeric(12,2) not null default 0 check (shipping_cost >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  payment_method text not null check (payment_method in ('cod', 'online')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  order_status text not null default 'pending'
    check (order_status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  notes text not null default '',
  idempotency_key text not null unique,
  cancelled_at timestamptz,
  cancelled_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_customer_created_idx
  on public.orders(customer_id, created_at desc);

create index orders_status_created_idx
  on public.orders(order_status, created_at desc);

create index orders_payment_status_idx
  on public.orders(payment_status);

create index orders_created_idx
  on public.orders(created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_sku text not null default '',
  product_color text not null default '',
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create index order_items_order_created_idx
  on public.order_items(order_id, created_at);

create index order_items_product_idx
  on public.order_items(product_id);

-- ---------------------------------------------------------------------------
-- Returns
-- ---------------------------------------------------------------------------

create table public.return_requests (
  id uuid primary key references public.orders(id) on delete cascade,
  return_number text not null unique,
  order_id uuid not null unique references public.orders(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  request_type text not null check (request_type in ('return', 'exchange')),
  reason text not null,
  details text not null default '',
  requested_item_ids jsonb not null default '[]'::jsonb
    check (jsonb_typeof(requested_item_ids) = 'array'),
  exchange_note text not null default '',
  status text not null default 'requested'
    check (status in ('requested', 'approved', 'rejected', 'pickup', 'received', 'completed', 'cancelled')),
  resolution text not null default 'pending'
    check (resolution in ('pending', 'refund', 'exchange', 'replacement')),
  refund_amount numeric(12,2) not null default 0 check (refund_amount >= 0),
  management_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index return_requests_customer_created_idx
  on public.return_requests(customer_id, created_at desc);

create index return_requests_status_created_idx
  on public.return_requests(status, created_at desc);

-- ---------------------------------------------------------------------------
-- Delivery / courier
-- ---------------------------------------------------------------------------

create table public.delivery_shipments (
  id uuid primary key references public.orders(id) on delete cascade,
  provider text not null default 'pathao',
  consignment_id text,
  tracking_url text,
  status text not null default 'created',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, consignment_id)
);

create index delivery_shipments_provider_status_idx
  on public.delivery_shipments(provider, status);

-- ---------------------------------------------------------------------------
-- Server-side wishlist
-- ---------------------------------------------------------------------------

create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(customer_id, product_id)
);

create index wishlists_customer_created_idx
  on public.wishlists(customer_id, created_at desc);

create index wishlists_product_idx
  on public.wishlists(product_id);

-- ---------------------------------------------------------------------------
-- Updated-at triggers
-- ---------------------------------------------------------------------------

create or replace function public.protect_customer_system_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $protect_customer_system_fields$
begin
  if current_user in ('postgres', 'service_role') then
    return new;
  end if;

  if (select private.has_management_role('manager')) then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.account_id is distinct from old.account_id
     or new.customer_tier is distinct from old.customer_tier
     or new.total_orders is distinct from old.total_orders
     or new.total_spent is distinct from old.total_spent
     or new.last_order_at is distinct from old.last_order_at
     or new.is_active is distinct from old.is_active
  then
    raise exception 'Customer system fields cannot be changed by this role';
  end if;

  return new;
end;
$protect_customer_system_fields$;

create trigger customers_protect_system_fields
before update on public.customers
for each row execute function public.protect_customer_system_fields();

create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

create trigger management_memberships_set_updated_at
before update on public.management_memberships
for each row execute function public.set_updated_at();

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger product_images_set_updated_at
before update on public.product_images
for each row execute function public.set_updated_at();

create trigger home_sections_set_updated_at
before update on public.home_sections
for each row execute function public.set_updated_at();

create trigger home_sections_products_set_updated_at
before update on public.home_sections_products
for each row execute function public.set_updated_at();

create trigger category_promotions_set_updated_at
before update on public.category_promotions
for each row execute function public.set_updated_at();

create trigger customer_tier_rules_set_updated_at
before update on public.customer_tier_rules
for each row execute function public.set_updated_at();

create trigger customer_addresses_set_updated_at
before update on public.customer_addresses
for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create trigger return_requests_set_updated_at
before update on public.return_requests
for each row execute function public.set_updated_at();

create trigger delivery_shipments_set_updated_at
before update on public.delivery_shipments
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Atomic order creation
-- ---------------------------------------------------------------------------
--
-- This is intentionally a database function because order creation must:
--   1. derive the authenticated customer from auth.uid()
--   2. validate products/prices/stock
--   3. lock inventory rows
--   4. create the order and snapshots
--   5. decrement stock
--   6. calculate the subtotal/total
--   7. enforce idempotency
-- in one transaction.
--
-- The browser must never be trusted with the final price or stock decision.

create or replace function public.create_order_atomic(
  p_idempotency_key text,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_shipping_address text,
  p_shipping_city text,
  p_shipping_postal_code text,
  p_shipping_cost numeric,
  p_discount numeric,
  p_payment_method text,
  p_notes text,
  p_items jsonb
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_customer public.customers%rowtype;
  v_existing public.orders%rowtype;
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric(12,2) := 0;
  v_total numeric(12,2);
  v_item record;
  v_product public.products%rowtype;
begin
  if v_user_id is null then
    raise exception 'Customer authentication is required';
  end if;

  if p_idempotency_key is null or length(trim(p_idempotency_key)) < 8 then
    raise exception 'A valid idempotency key is required';
  end if;

  if p_customer_name is null or trim(p_customer_name) = '' then
    raise exception 'Customer name is required';
  end if;

  if p_customer_phone is null or trim(p_customer_phone) = '' then
    raise exception 'Customer phone is required';
  end if;

  if p_shipping_address is null or trim(p_shipping_address) = '' then
    raise exception 'Shipping address is required';
  end if;

  if p_shipping_city is null or trim(p_shipping_city) = '' then
    raise exception 'Shipping city is required';
  end if;

  if coalesce(p_shipping_cost, 0) not in (100, 150) then
    raise exception 'Unsupported delivery charge';
  end if;

  if coalesce(p_discount, 0) <> 0 then
    raise exception 'Discounts are not enabled in the current Supabase migration';
  end if;

  if p_payment_method <> 'cod' then
    raise exception 'Only Cash on Delivery is enabled in the current Supabase migration';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'At least one order item is required';
  end if;

  select *
  into v_customer
  from public.customers
  where id = v_user_id;

  if not found then
    raise exception 'Customer profile is not available';
  end if;

  select *
  into v_existing
  from public.orders
  where idempotency_key = trim(p_idempotency_key)
  limit 1;

  if found then
    if v_existing.customer_id is distinct from v_user_id then
      raise exception 'Idempotency key is already associated with another order';
    end if;

    return jsonb_build_object(
      'order_id', v_existing.id,
      'order_number', v_existing.order_number,
      'subtotal', v_existing.subtotal,
      'shipping_cost', v_existing.shipping_cost,
      'discount', v_existing.discount,
      'total', v_existing.total,
      'payment_method', v_existing.payment_method,
      'payment_status', v_existing.payment_status,
      'order_status', v_existing.order_status,
      'replayed', true
    );
  end if;

  v_order_id := gen_random_uuid();
  v_order_number :=
    'BS-' ||
    to_char(now(), 'YYYYMMDDHH24MISSMS') ||
    '-' ||
    upper(substr(gen_random_uuid()::text, 1, 6));

  insert into public.orders (
    id,
    order_number,
    customer_id,
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    shipping_city,
    shipping_postal_code,
    subtotal,
    shipping_cost,
    discount,
    total,
    payment_method,
    payment_status,
    order_status,
    notes,
    idempotency_key
  )
  values (
    v_order_id,
    v_order_number,
    v_user_id,
    trim(p_customer_name),
    coalesce(trim(p_customer_email), ''),
    trim(p_customer_phone),
    trim(p_shipping_address),
    trim(p_shipping_city),
    coalesce(trim(p_shipping_postal_code), ''),
    0,
    coalesce(p_shipping_cost, 0),
    coalesce(p_discount, 0),
    0,
    p_payment_method,
    'pending',
    'pending',
    coalesce(trim(p_notes), ''),
    trim(p_idempotency_key)
  )
  on conflict (idempotency_key) do nothing
  returning id into v_order_id;

  if v_order_id is null then
    select *
    into v_existing
    from public.orders
    where idempotency_key = trim(p_idempotency_key)
    limit 1;

    if not found then
      raise exception 'Unable to resolve the idempotent order';
    end if;

    if v_existing.customer_id is distinct from v_user_id then
      raise exception 'Idempotency key is already associated with another order';
    end if;

    return jsonb_build_object(
      'order_id', v_existing.id,
      'order_number', v_existing.order_number,
      'subtotal', v_existing.subtotal,
      'shipping_cost', v_existing.shipping_cost,
      'discount', v_existing.discount,
      'total', v_existing.total,
      'payment_method', v_existing.payment_method,
      'payment_status', v_existing.payment_status,
      'order_status', v_existing.order_status,
      'replayed', true
    );
  end if;

  for v_item in
    select
      product_id,
      sum(quantity)::integer as quantity,
      max(expected_price)::numeric as expected_price
    from jsonb_to_recordset(p_items) as x(
      product_id uuid,
      quantity integer,
      expected_price numeric
    )
    group by product_id
  loop
    if v_item.product_id is null or v_item.quantity is null or v_item.quantity <= 0 then
      raise exception 'Invalid order item';
    end if;

    select *
    into v_product
    from public.products
    where id = v_item.product_id
      and is_active = true
    for update;

    if not found then
      raise exception 'Product is unavailable';
    end if;

    if v_product.stock_quantity < v_item.quantity then
      raise exception 'Insufficient stock for %', v_product.name;
    end if;

    if v_item.expected_price is not null
       and v_item.expected_price <> v_product.price then
      raise exception 'Product price changed for %', v_product.name;
    end if;

    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      product_sku,
      product_color,
      unit_price,
      quantity,
      line_total
    )
    values (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.sku,
      v_product.color,
      v_product.price,
      v_item.quantity,
      round(v_product.price * v_item.quantity, 2)
    );

    update public.products
    set stock_quantity = stock_quantity - v_item.quantity,
        updated_at = now()
    where id = v_product.id;

    v_subtotal :=
      v_subtotal +
      round(v_product.price * v_item.quantity, 2);
  end loop;

  v_total :=
    round(
      v_subtotal +
      coalesce(p_shipping_cost, 0) -
      coalesce(p_discount, 0),
      2
    );

  if v_total < 0 then
    raise exception 'Order total cannot be negative';
  end if;

  update public.orders
  set subtotal = v_subtotal,
      total = v_total,
      updated_at = now()
  where id = v_order_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'shipping_cost', coalesce(p_shipping_cost, 0),
    'discount', coalesce(p_discount, 0),
    'total', v_total,
    'payment_method', p_payment_method,
    'payment_status', 'pending',
    'order_status', 'pending',
    'replayed', false
  );
end;
$$;

revoke execute on function public.create_order_atomic(
  text, text, text, text, text, text, text, numeric, numeric, text, text, jsonb
) from public, anon;

grant execute on function public.create_order_atomic(
  text, text, text, text, text, text, text, numeric, numeric, text, text, jsonb
) to authenticated;

-- ---------------------------------------------------------------------------
-- Customer order cancellation
-- ---------------------------------------------------------------------------

create or replace function public.cancel_customer_order(p_order_id uuid)
returns public.orders
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_order public.orders%rowtype;
  v_item record;
begin
  if v_user_id is null then
    raise exception 'Customer authentication is required';
  end if;

  select *
  into v_order
  from public.orders
  where id = p_order_id
    and customer_id = v_user_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if v_order.order_status not in ('pending', 'confirmed') then
    raise exception 'This order can no longer be cancelled';
  end if;

  for v_item in
    select product_id, quantity
    from public.order_items
    where order_id = p_order_id
      and product_id is not null
  loop
    update public.products
    set stock_quantity = stock_quantity + v_item.quantity,
        updated_at = now()
    where id = v_item.product_id;
  end loop;

  update public.orders
  set order_status = 'cancelled',
      cancelled_at = now(),
      cancelled_by = v_user_id,
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

revoke execute on function public.cancel_customer_order(uuid) from public, anon;
grant execute on function public.cancel_customer_order(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Management order status / payment operations
-- ---------------------------------------------------------------------------

create or replace function public.update_order_status(
  p_order_id uuid,
  p_next_status text
)
returns public.orders
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_user_id uuid := (select auth.uid());
  v_allowed boolean := false;
begin
  if v_user_id is null or not (select private.is_management_member()) then
    raise exception 'Management authentication is required';
  end if;

  if p_next_status not in (
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled'
  ) then
    raise exception 'Invalid order status';
  end if;

  select *
  into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  v_allowed :=
    case v_order.order_status
      when 'pending' then p_next_status in ('pending', 'confirmed', 'cancelled')
      when 'confirmed' then p_next_status in ('confirmed', 'processing', 'cancelled')
      when 'processing' then p_next_status in ('processing', 'shipped')
      when 'shipped' then p_next_status in ('shipped', 'delivered')
      when 'delivered' then p_next_status = 'delivered'
      when 'cancelled' then p_next_status = 'cancelled'
      else false
    end;

  if not v_allowed then
    raise exception 'Cannot change order status from % to %',
      v_order.order_status,
      p_next_status;
  end if;

  if v_order.order_status <> 'cancelled'
     and p_next_status = 'cancelled'
  then
    for v_item in
      select product_id, quantity
      from public.order_items
      where order_id = p_order_id
        and product_id is not null
    loop
      update public.products
      set stock_quantity = stock_quantity + v_item.quantity,
          updated_at = now()
      where id = v_item.product_id;
    end loop;

    update public.orders
    set order_status = 'cancelled',
        cancelled_at = now(),
        cancelled_by = v_user_id,
        updated_at = now()
    where id = p_order_id
    returning * into v_order;
  else
    update public.orders
    set order_status = p_next_status,
        updated_at = now()
    where id = p_order_id
    returning * into v_order;
  end if;

  return v_order;
end;
$$;

revoke execute on function public.update_order_status(uuid, text) from public, anon;
grant execute on function public.update_order_status(uuid, text) to authenticated;

create or replace function public.update_payment_status(
  p_order_id uuid,
  p_payment_status text
)
returns public.orders
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  if (select auth.uid()) is null
     or not (select private.is_management_member()) then
    raise exception 'Management authentication is required';
  end if;

  if p_payment_status not in ('pending', 'paid', 'failed', 'refunded') then
    raise exception 'Invalid payment status';
  end if;

  update public.orders
  set payment_status = p_payment_status,
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  if not found then
    raise exception 'Order not found';
  end if;

  return v_order;
end;
$$;

revoke execute on function public.update_payment_status(uuid, text) from public, anon;
grant execute on function public.update_payment_status(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Customer return request creation
-- ---------------------------------------------------------------------------

create or replace function public.create_customer_return_request(
  p_order_id uuid,
  p_request_type text,
  p_reason text,
  p_details text,
  p_item_ids jsonb,
  p_exchange_note text
)
returns public.return_requests
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_order public.orders%rowtype;
  v_return public.return_requests%rowtype;
  v_number text;
begin
  if v_user_id is null then
    raise exception 'Customer authentication is required';
  end if;

  if p_request_type not in ('return', 'exchange') then
    raise exception 'Invalid return request type';
  end if;

  if p_item_ids is null or jsonb_typeof(p_item_ids) <> 'array' then
    raise exception 'Invalid return item list';
  end if;

  select *
  into v_order
  from public.orders
  where id = p_order_id
    and customer_id = v_user_id;

  if not found then
    raise exception 'Order not found';
  end if;

  if v_order.order_status <> 'delivered' then
    raise exception 'Only delivered orders can be returned or exchanged';
  end if;

  if jsonb_array_length(p_item_ids) > 0 then
    if (
      select count(*)
      from jsonb_array_elements_text(p_item_ids)
    ) <> (
      select count(distinct requested_item.item_id::uuid)
      from jsonb_array_elements_text(p_item_ids) as requested_item(item_id)
    ) then
      raise exception 'Duplicate return item IDs are not allowed';
    end if;

    if exists (
      select 1
      from jsonb_array_elements_text(p_item_ids) as requested_item(item_id)
      where not exists (
        select 1
        from public.order_items oi
        where oi.id = requested_item.item_id::uuid
          and oi.order_id = p_order_id
      )
    ) then
      raise exception 'Every return item must belong to the selected order';
    end if;
  end if;

  if exists (
    select 1
    from public.return_requests
    where order_id = p_order_id
      and status not in ('rejected', 'cancelled')
  ) then
    raise exception 'A return request already exists for this order';
  end if;

  v_number :=
    'RET-' ||
    to_char(now(), 'YYYYMMDDHH24MISSMS') ||
    '-' ||
    upper(substr(gen_random_uuid()::text, 1, 6));

  insert into public.return_requests (
    id,
    return_number,
    order_id,
    customer_id,
    request_type,
    reason,
    details,
    requested_item_ids,
    exchange_note,
    status,
    resolution
  )
  values (
    p_order_id,
    v_number,
    p_order_id,
    v_user_id,
    p_request_type,
    trim(coalesce(p_reason, '')),
    trim(coalesce(p_details, '')),
    p_item_ids,
    trim(coalesce(p_exchange_note, '')),
    'requested',
    'pending'
  )
  returning * into v_return;

  return v_return;
end;
$$;

revoke execute on function public.create_customer_return_request(
  uuid, text, text, text, jsonb, text
) from public, anon;

grant execute on function public.create_customer_return_request(
  uuid, text, text, text, jsonb, text
) to authenticated;

-- ---------------------------------------------------------------------------
-- Management return request updates
-- ---------------------------------------------------------------------------

create or replace function public.update_return_request(
  p_order_id uuid,
  p_status text,
  p_resolution text,
  p_refund_amount numeric,
  p_management_note text
)
returns public.return_requests
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_return public.return_requests%rowtype;
  v_allowed boolean := false;
  v_max_refund numeric(12,2) := 0;
begin
  if (select auth.uid()) is null
     or not (select private.is_management_member()) then
    raise exception 'Management authentication is required';
  end if;

  if p_status not in (
    'requested',
    'approved',
    'rejected',
    'pickup',
    'received',
    'completed',
    'cancelled'
  ) then
    raise exception 'Invalid return status';
  end if;

  select *
  into v_return
  from public.return_requests
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Return request not found';
  end if;

  v_allowed :=
    case v_return.status
      when 'requested' then p_status in ('requested', 'approved', 'rejected', 'cancelled')
      when 'approved' then p_status in ('approved', 'pickup', 'rejected', 'cancelled')
      when 'pickup' then p_status in ('pickup', 'received', 'cancelled')
      when 'received' then p_status in ('received', 'completed', 'rejected')
      when 'completed' then p_status = 'completed'
      when 'rejected' then p_status = 'rejected'
      when 'cancelled' then p_status = 'cancelled'
      else false
    end;

  if not v_allowed then
    raise exception 'Cannot change return status from % to %',
      v_return.status,
      p_status;
  end if;

  if p_refund_amount is not null then
    if p_refund_amount < 0 then
      raise exception 'Refund amount cannot be negative';
    end if;

    if jsonb_array_length(v_return.requested_item_ids) > 0 then
      select coalesce(sum(oi.line_total), 0)
      into v_max_refund
      from public.order_items oi
      where oi.order_id = v_return.order_id
        and oi.id in (
          select requested_item.item_id::uuid
          from jsonb_array_elements_text(v_return.requested_item_ids) as requested_item(item_id)
        );
    else
      select coalesce(total, 0)
      into v_max_refund
      from public.orders
      where id = v_return.order_id;
    end if;

    if p_refund_amount > v_max_refund then
      raise exception 'Refund amount cannot exceed the eligible return amount';
    end if;
  end if;

  if p_resolution = 'refund' and coalesce(p_refund_amount, v_return.refund_amount) <= 0 then
    raise exception 'A refund resolution requires a positive refund amount';
  end if;

  update public.return_requests
  set status = p_status,
      resolution = coalesce(p_resolution, resolution),
      refund_amount = coalesce(p_refund_amount, refund_amount),
      management_note = coalesce(trim(p_management_note), management_note),
      updated_at = now()
  where id = p_order_id
  returning * into v_return;

  return v_return;
end;
$$;

revoke execute on function public.update_return_request(
  uuid, text, text, numeric, text
) from public, anon;

grant execute on function public.update_return_request(
  uuid, text, text, numeric, text
) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.management_memberships enable row level security;
alter table public.customers enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.home_sections enable row level security;
alter table public.home_sections_products enable row level security;
alter table public.category_promotions enable row level security;
alter table public.customer_tier_rules enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.return_requests enable row level security;
alter table public.delivery_shipments enable row level security;
alter table public.wishlists enable row level security;

-- Start from a closed Data API surface.
revoke all on table
  public.management_memberships,
  public.customers,
  public.categories,
  public.products,
  public.product_images,
  public.home_sections,
  public.home_sections_products,
  public.category_promotions,
  public.customer_tier_rules,
  public.customer_addresses,
  public.orders,
  public.order_items,
  public.return_requests,
  public.delivery_shipments,
  public.wishlists
from anon, authenticated;

-- Public storefront reads.
grant select on table
  public.categories,
  public.products,
  public.product_images,
  public.home_sections,
  public.home_sections_products,
  public.category_promotions
to anon, authenticated;

-- Customer reads/writes.
grant select on table public.customers to authenticated;
grant select, insert, update, delete on table public.customer_addresses to authenticated;
grant select, insert, delete on table public.wishlists to authenticated;

-- Customer order/return/shipment reads.
grant select on table
  public.orders,
  public.order_items,
  public.return_requests,
  public.delivery_shipments
to authenticated;

-- Management reads.
grant select on table
  public.management_memberships,
  public.customers,
  public.categories,
  public.products,
  public.product_images,
  public.home_sections,
  public.home_sections_products,
  public.category_promotions,
  public.customer_tier_rules,
  public.customer_addresses,
  public.orders,
  public.order_items,
  public.return_requests,
  public.delivery_shipments,
  public.wishlists
to authenticated;

-- Management writes.
grant insert, update, delete on table
  public.categories,
  public.products,
  public.product_images,
  public.home_sections,
  public.home_sections_products,
  public.category_promotions,
  public.customer_tier_rules
to authenticated;

grant update on table public.customers to authenticated;
grant update, delete on table public.customer_addresses to authenticated;
-- Order, return, and shipment mutations are performed through
-- authenticated database functions / Edge Functions, not direct table updates.
-- This prevents a browser client from changing financial or courier state
-- by writing rows directly.
revoke update on table public.orders from authenticated;
revoke update on table public.return_requests from authenticated;
revoke update on table public.delivery_shipments from authenticated;

-- Owner-only membership management.
grant insert, update, delete on table public.management_memberships to authenticated;

-- ---------------------------------------------------------------------------
-- Management membership policies
-- ---------------------------------------------------------------------------

create policy management_read_own_membership
on public.management_memberships
for select to authenticated
using ((select auth.uid()) = user_id);

create policy management_owner_insert
on public.management_memberships
for insert to authenticated
with check ((select private.is_owner()));

create policy management_owner_update
on public.management_memberships
for update to authenticated
using ((select private.is_owner()))
with check ((select private.is_owner()));

create policy management_owner_delete
on public.management_memberships
for delete to authenticated
using ((select private.is_owner()));

-- ---------------------------------------------------------------------------
-- Customer policies
-- ---------------------------------------------------------------------------

create policy customers_read_own_or_management
on public.customers
for select to authenticated
using (
  (select auth.uid()) = id
  or (select private.is_management_member())
);

create policy customers_management_update
on public.customers
for update to authenticated
using ((select private.is_management_member()))
with check ((select private.is_management_member()));

-- No public INSERT/DELETE policy. Customer rows are created by the
-- auth.users trigger and removed by ON DELETE CASCADE.

-- ---------------------------------------------------------------------------
-- Public catalog policies
-- ---------------------------------------------------------------------------

create policy categories_public_read_active
on public.categories
for select to anon, authenticated
using (
  is_active = true
  or (select private.is_management_member())
);

create policy categories_management_insert
on public.categories
for insert to authenticated
with check ((select private.has_management_role('manager')));

create policy categories_management_update
on public.categories
for update to authenticated
using ((select private.has_management_role('manager')))
with check ((select private.has_management_role('manager')));

create policy categories_management_delete
on public.categories
for delete to authenticated
using ((select private.has_management_role('manager')));

create policy products_public_read_active
on public.products
for select to anon, authenticated
using (
  is_active = true
  or (select private.is_management_member())
);

create policy products_management_insert
on public.products
for insert to authenticated
with check ((select private.has_management_role('manager')));

create policy products_management_update
on public.products
for update to authenticated
using ((select private.has_management_role('manager')))
with check ((select private.has_management_role('manager')));

create policy products_management_delete
on public.products
for delete to authenticated
using ((select private.has_management_role('manager')));

create policy product_images_public_read_active
on public.product_images
for select to anon, authenticated
using (
  exists (
    select 1
    from public.products p
    where p.id = product_id
      and (
        p.is_active = true
        or (select private.is_management_member())
      )
  )
);

create policy product_images_management_insert
on public.product_images
for insert to authenticated
with check ((select private.has_management_role('manager')));

create policy product_images_management_update
on public.product_images
for update to authenticated
using ((select private.has_management_role('manager')))
with check ((select private.has_management_role('manager')));

create policy product_images_management_delete
on public.product_images
for delete to authenticated
using ((select private.has_management_role('manager')));

-- ---------------------------------------------------------------------------
-- Homepage / promotion policies
-- ---------------------------------------------------------------------------

create policy home_sections_public_read_active
on public.home_sections
for select to anon, authenticated
using (
  is_active = true
  or (select private.is_management_member())
);

create policy home_sections_management_insert
on public.home_sections
for insert to authenticated
with check ((select private.has_management_role('manager')));

create policy home_sections_management_update
on public.home_sections
for update to authenticated
using ((select private.has_management_role('manager')))
with check ((select private.has_management_role('manager')));

create policy home_sections_management_delete
on public.home_sections
for delete to authenticated
using ((select private.has_management_role('manager')));

create policy home_section_products_public_read_active
on public.home_sections_products
for select to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.home_sections hs
    where hs.id = section_id
      and hs.is_active = true
  )
  and exists (
    select 1
    from public.products p
    where p.id = product_id
      and p.is_active = true
  )
  or (select private.is_management_member())
);

create policy home_section_products_management_insert
on public.home_sections_products
for insert to authenticated
with check ((select private.has_management_role('manager')));

create policy home_section_products_management_update
on public.home_sections_products
for update to authenticated
using ((select private.has_management_role('manager')))
with check ((select private.has_management_role('manager')));

create policy home_section_products_management_delete
on public.home_sections_products
for delete to authenticated
using ((select private.has_management_role('manager')));

create policy category_promotions_public_read_active
on public.category_promotions
for select to anon, authenticated
using (
  is_active = true
  or (select private.is_management_member())
);

create policy category_promotions_management_insert
on public.category_promotions
for insert to authenticated
with check ((select private.has_management_role('manager')));

create policy category_promotions_management_update
on public.category_promotions
for update to authenticated
using ((select private.has_management_role('manager')))
with check ((select private.has_management_role('manager')));

create policy category_promotions_management_delete
on public.category_promotions
for delete to authenticated
using ((select private.has_management_role('manager')));

create policy tier_rules_management_read
on public.customer_tier_rules
for select to authenticated
using ((select private.is_management_member()));

create policy tier_rules_management_insert
on public.customer_tier_rules
for insert to authenticated
with check ((select private.has_management_role('manager')));

create policy tier_rules_management_update
on public.customer_tier_rules
for update to authenticated
using ((select private.has_management_role('manager')))
with check ((select private.has_management_role('manager')));

create policy tier_rules_management_delete
on public.customer_tier_rules
for delete to authenticated
using ((select private.has_management_role('manager')));

-- ---------------------------------------------------------------------------
-- Address policies
-- ---------------------------------------------------------------------------

create policy addresses_read_own
on public.customer_addresses
for select to authenticated
using ((select auth.uid()) = customer_id);

create policy addresses_management_read
on public.customer_addresses
for select to authenticated
using ((select private.is_management_member()));

create policy addresses_insert_own
on public.customer_addresses
for insert to authenticated
with check ((select auth.uid()) = customer_id);

create policy addresses_update_own
on public.customer_addresses
for update to authenticated
using (
  (select auth.uid()) = customer_id
  or (select private.is_management_member())
)
with check (
  customer_id = (select auth.uid())
  or (select private.is_management_member())
);

create policy addresses_delete_own
on public.customer_addresses
for delete to authenticated
using (
  (select auth.uid()) = customer_id
  or (select private.is_management_member())
);

-- ---------------------------------------------------------------------------
-- Order policies
-- ---------------------------------------------------------------------------

create policy orders_read_own_or_management
on public.orders
for select to authenticated
using (
  customer_id = (select auth.uid())
  or (select private.is_management_member())
);

create policy orders_management_update
on public.orders
for update to authenticated
using ((select private.is_management_member()))
with check ((select private.is_management_member()));

create policy order_items_read_own_or_management
on public.order_items
for select to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_id
      and (
        o.customer_id = (select auth.uid())
        or (select private.is_management_member())
      )
  )
);

create policy returns_read_own_or_management
on public.return_requests
for select to authenticated
using (
  customer_id = (select auth.uid())
  or (select private.is_management_member())
);

create policy returns_management_update
on public.return_requests
for update to authenticated
using ((select private.is_management_member()))
with check ((select private.is_management_member()));

create policy shipments_read_own_or_management
on public.delivery_shipments
for select to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = delivery_shipments.id
      and (
        o.customer_id = (select auth.uid())
        or (select private.is_management_member())
      )
  )
);

create policy shipments_management_update
on public.delivery_shipments
for update to authenticated
using ((select private.is_management_member()))
with check ((select private.is_management_member()));

-- ---------------------------------------------------------------------------
-- Wishlist policies
-- ---------------------------------------------------------------------------

create policy wishlist_read_own
on public.wishlists
for select to authenticated
using ((select auth.uid()) = customer_id);

create policy wishlist_insert_own
on public.wishlists
for insert to authenticated
with check (
  (select auth.uid()) = customer_id
  and exists (
    select 1
    from public.products p
    where p.id = product_id
      and p.is_active = true
  )
);

create policy wishlist_delete_own
on public.wishlists
for delete to authenticated
using ((select auth.uid()) = customer_id);

-- Management can inspect wishlists for analytics/customer insight.
create policy wishlist_management_read
on public.wishlists
for select to authenticated
using ((select private.is_management_member()));

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------
--
-- Storage metadata is managed by Supabase Storage. We only create buckets
-- and policies; we do not modify storage.objects rows directly.
--
-- Public storefront assets are intentionally separate from customer-private
-- assets. Product/editorial/promotion images can be public; profile images
-- can remain private.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'storefront-media',
    'storefront-media',
    true,
    10485760,
    array['image/*']::text[]
  ),
  (
    'customer-media',
    'customer-media',
    false,
    5242880,
    array['image/*']::text[]
  )
on conflict (id) do nothing;

-- Public bucket reads are handled by the bucket's public access model.
-- Upload/update/delete are still protected by storage.objects RLS.

create policy storefront_media_management_insert
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'storefront-media'
  and (select private.has_management_role('manager'))
);

create policy storefront_media_management_update
on storage.objects
for update to authenticated
using (
  bucket_id = 'storefront-media'
  and (select private.has_management_role('manager'))
)
with check (
  bucket_id = 'storefront-media'
  and (select private.has_management_role('manager'))
);

create policy storefront_media_management_delete
on storage.objects
for delete to authenticated
using (
  bucket_id = 'storefront-media'
  and (select private.has_management_role('manager'))
);

create policy customer_media_owner_insert
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'customer-media'
  and owner_id = auth.uid()::text
);

create policy customer_media_owner_update
on storage.objects
for update to authenticated
using (
  bucket_id = 'customer-media'
  and owner_id = auth.uid()::text
)
with check (
  bucket_id = 'customer-media'
  and owner_id = auth.uid()::text
);

create policy customer_media_owner_delete
on storage.objects
for delete to authenticated
using (
  bucket_id = 'customer-media'
  and owner_id = auth.uid()::text
);

create policy customer_media_management_read
on storage.objects
for select to authenticated
using (
  bucket_id = 'customer-media'
  and (select private.is_management_member())
);

-- ---------------------------------------------------------------------------
-- Initial configuration only — no business/customer/product data.
-- ---------------------------------------------------------------------------
--
-- No management member is inserted here because the correct Supabase Auth
-- user UUID does not exist until you create the first management account.
--
-- After creating the first management user in Supabase Auth, run:
--
--   insert into public.management_memberships (user_id, role)
--   values ('THE_AUTH_USER_UUID', 'owner');
--
-- This is the only bootstrap step required for the management authorization
-- table. Do not put the UUID in source control unless it is intentionally
-- public/non-sensitive configuration.

-- ---------------------------------------------------------------------------
-- End of migration
-- ---------------------------------------------------------------------------

    ) then
      raise exception 'Return item IDs must be valid UUIDs';
    end if;

    if (
      select count(*)
      from jsonb_array_elements_text(p_item_ids)
    ) <> (
      select count(distinct requested_item.item_id::uuid)
      from jsonb_array_elements_text(p_item_ids) as requested_item(item_id)
    ) then
      raise exception 'Duplicate return item IDs are not allowed';
    end if;

    if exists (
      select 1
      from jsonb_array_elements_text(p_item_ids) as requested_item(item_id)
      where not exists (
        select 1
        from public.order_items oi
        where oi.id = requested_item.item_id::uuid
          and oi.order_id = p_order_id
      )
    ) then
      raise exception 'Every return item must belong to the selected order';
    end if;
  end if;

  if exists (
    select 1
    from public.return_requests
    where order_id = p_order_id
      and status not in ('rejected', 'cancelled')
  ) then
    raise exception 'A return request already exists for this order';
  end if;

  v_number :=
    'RET-' ||
    to_char(now(), 'YYYYMMDDHH24MISSMS') ||
    '-' ||
    upper(substr(gen_random_uuid()::text, 1, 6));

  insert into public.return_requests (
    id,
    return_number,
    order_id,
    customer_id,
    request_type,
    reason,
    details,
    requested_item_ids,
    exchange_note,
    status,
    resolution
  )
  values (
    p_order_id,
    v_number,
    p_order_id,
    v_user_id,
    p_request_type,
    trim(coalesce(p_reason, '')),
    trim(coalesce(p_details, '')),
    p_item_ids,
    trim(coalesce(p_exchange_note, '')),
    'requested',
    'pending'
  )
  returning * into v_return;

  return v_return;
end;
$$;

revoke execute on function public.create_customer_return_request(
  uuid, text, text, text, jsonb, text
) from public, anon;

grant execute on function public.create_customer_return_request(
  uuid, text, text, text, jsonb, text
) to authenticated;

-- ---------------------------------------------------------------------------
-- Management return request updates
-- ---------------------------------------------------------------------------

create or replace function public.update_return_request(
  p_order_id uuid,
  p_status text,
  p_resolution text,
  p_refund_amount numeric,
  p_management_note text
)
returns public.return_requests
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_return public.return_requests%rowtype;
  v_allowed boolean := false;
begin
  if (select auth.uid()) is null
     or not (select private.is_management_member()) then
    raise exception 'Management authentication is required';
  end if;

  if p_status not in (
    'requested',
    'approved',
    'rejected',
    'pickup',
    'received',
    'completed',
    'cancelled'
  ) then
    raise exception 'Invalid return status';
  end if;

  select *
  into v_return
  from public.return_requests
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Return request not found';
  end if;

  v_allowed :=
    case v_return.status
      when 'requested' then p_status in ('requested', 'approved', 'rejected', 'cancelled')
      when 'approved' then p_status in ('approved', 'pickup', 'rejected', 'cancelled')
      when 'pickup' then p_status in ('pickup', 'received', 'cancelled')
      when 'received' then p_status in ('received', 'completed', 'rejected')
      when 'completed' then p_status = 'completed'
      when 'rejected' then p_status = 'rejected'
      when 'cancelled' then p_status = 'cancelled'
      else false
    end;

  if not v_allowed then
    raise exception 'Cannot change return status from % to %',
      v_return.status,
      p_status;
  end if;

  update public.return_requests
  set status = p_status,
      resolution = coalesce(p_resolution, resolution),
      refund_amount = coalesce(p_refund_amount, refund_amount),
      management_note = coalesce(trim(p_management_note), management_note),
      updated_at = now()
  where id = p_order_id
  returning * into v_return;

  return v_return;
end;
$$;

revoke execute on function public.update_return_request(
  uuid, text, text, numeric, text
) from public, anon;

grant execute on function public.update_return_request(
  uuid, text, text, numeric, text
) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.management_memberships enable row level security;
alter table public.customers enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.home_sections enable row level security;
alter table public.home_sections_products enable row level security;
alter table public.category_promotions enable row level security;
alter table public.customer_tier_rules enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.return_requests enable row level security;
alter table public.delivery_shipments enable row level security;
alter table public.wishlists enable row level security;

-- Start from a closed Data API surface.
revoke all on table
  public.management_memberships,
  public.customers,
  public.categories,
  public.products,
  public.product_images,
  public.home_sections,
  public.home_sections_products,
  public.category_promotions,
  public.customer_tier_rules,
  public.customer_addresses,
  public.orders,
  public.order_items,
  public.return_requests,
  public.delivery_shipments,
  public.wishlists
from anon, authenticated;

-- Public storefront reads.
grant select on table
  public.categories,
  public.products,
  public.product_images,
  public.home_sections,
  public.home_sections_products,
  public.category_promotions
to anon, authenticated;

-- Customer reads/writes.
grant select on table public.customers to authenticated;
grant select, insert, update, delete on table public.customer_addresses to authenticated;
grant select, insert, delete on table public.wishlists to authenticated;

-- Customer order/return/shipment reads.
grant select on table
  public.orders,
  public.order_items,
  public.return_requests,
  public.delivery_shipments
to authenticated;

-- Management reads.
grant select on table
  public.management_memberships,
  public.customers,
  public.categories,
  public.products,
  public.product_images,
  public.home_sections,
  public.home_sections_products,
  public.category_promotions,
  public.customer_tier_rules,
  public.customer_addresses,
  public.orders,
  public.order_items,
  public.return_requests,
  public.delivery_shipments,
  public.wishlists
to authenticated;

-- Management writes.
grant insert, update, delete on table
  public.categories,
  public.products,
  public.product_images,
  public.home_sections,
  public.home_sections_products,
  public.category_promotions,
  public.customer_tier_rules
to authenticated;

grant update on table public.customers to authenticated;
grant update, delete on table public.customer_addresses to authenticated;
-- Order, return, and shipment mutations are performed through
-- authenticated database functions / Edge Functions, not direct table updates.
-- This prevents a browser client from changing financial or courier state
-- by writing rows directly.
revoke update on table public.orders from authenticated;
revoke update on table public.return_requests from authenticated;
revoke update on table public.delivery_shipments from authenticated;

-- Owner-only membership management.
grant insert, update, delete on table public.management_memberships to authenticated;

-- ---------------------------------------------------------------------------
-- Management membership policies
-- ---------------------------------------------------------------------------

create policy management_read_own_membership
on public.management_memberships
for select to authenticated
using ((select auth.uid()) = user_id);

create policy management_owner_insert
on public.management_memberships
for insert to authenticated
with check ((select private.is_owner()));

create policy management_owner_update
on public.management_memberships
for update to authenticated
using ((select private.is_owner()))
with check ((select private.is_owner()));

create policy management_owner_delete
on public.management_memberships
for delete to authenticated
using ((select private.is_owner()));

-- ---------------------------------------------------------------------------
-- Customer policies
-- ---------------------------------------------------------------------------

create policy customers_read_own_or_management
on public.customers
for select to authenticated
using (
  (select auth.uid()) = id
  or (select private.is_management_member())
);

create policy customers_management_update
on public.customers
for update to authenticated
using ((select private.is_management_member()))
with check ((select private.is_management_member()));

-- No public INSERT/DELETE policy. Customer rows are created by the
-- auth.users trigger and removed by ON DELETE CASCADE.

-- ---------------------------------------------------------------------------
-- Public catalog policies
-- ---------------------------------------------------------------------------

create policy categories_public_read_active
on public.categories
for select to anon, authenticated
using (
  is_active = true
  or (select private.is_management_member())
);

create policy categories_management_insert
on public.categories
for insert to authenticated
with check ((select private.has_management_role('manager')));

create policy categories_management_update
on public.categories
for update to authenticated
using ((select private.has_management_role('manager')))
with check ((select private.has_management_role('manager')));

create policy categories_management_delete
on public.categories
for delete to authenticated
using ((select private.has_management_role('manager')));

create policy products_public_read_active
on public.products
for select to anon, authenticated
using (
  is_active = true
  or (select private.is_management_member())
);

create policy products_management_insert
on public.products
for insert to authenticated
with check ((select private.has_management_role('manager')));

create policy products_management_update
on public.products
for update to authenticated
using ((select private.has_management_role('manager')))
with check ((select private.has_management_role('manager')));

create policy products_management_delete
on public.products
for delete to authenticated
using ((select private.has_management_role('manager')));

create policy product_images_public_read_active
on public.product_images
for select to anon, authenticated
using (
  exists (
    select 1
    from public.products p
    where p.id = product_id
      and (
        p.is_active = true
        or (select private.is_management_member())
      )
  )
);

create policy product_images_management_insert
on public.product_images
for insert to authenticated
with check ((select private.has_management_role('manager')));

create policy product_images_management_update
on public.product_images
for update to authenticated
using ((select private.has_management_role('manager')))
with check ((select private.has_management_role('manager')));

create policy product_images_management_delete
on public.product_images
for delete to authenticated
using ((select private.has_management_role('manager')));

-- ---------------------------------------------------------------------------
-- Homepage / promotion policies
-- ---------------------------------------------------------------------------

create policy home_sections_public_read_active
on public.home_sections
for select to anon, authenticated
using (
  is_active = true
  or (select private.is_management_member())
);

create policy home_sections_management_insert
on public.home_sections
for insert to authenticated
with check ((select private.has_management_role('manager')));

create policy home_sections_management_update
on public.home_sections
for update to authenticated
using ((select private.has_management_role('manager')))
with check ((select private.has_management_role('manager')));

create policy home_sections_management_delete
on public.home_sections
for delete to authenticated
using ((select private.has_management_role('manager')));

create policy home_section_products_public_read_active
on public.home_sections_products
for select to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.home_sections hs
    where hs.id = section_id
      and hs.is_active = true
  )
  and exists (
    select 1
    from public.products p
    where p.id = product_id
      and p.is_active = true
  )
  or (select private.is_management_member())
);

create policy home_section_products_management_insert
on public.home_sections_products
for insert to authenticated
with check ((select private.has_management_role('manager')));

create policy home_section_products_management_update
on public.home_sections_products
for update to authenticated
using ((select private.has_management_role('manager')))
with check ((select private.has_management_role('manager')));

create policy home_section_products_management_delete
on public.home_sections_products
for delete to authenticated
using ((select private.has_management_role('manager')));

create policy category_promotions_public_read_active
on public.category_promotions
for select to anon, authenticated
using (
  is_active = true
  or (select private.is_management_member())
);

create policy category_promotions_management_insert
on public.category_promotions
for insert to authenticated
with check ((select private.has_management_role('manager')));

create policy category_promotions_management_update
on public.category_promotions
for update to authenticated
using ((select private.has_management_role('manager')))
with check ((select private.has_management_role('manager')));

create policy category_promotions_management_delete
on public.category_promotions
for delete to authenticated
using ((select private.has_management_role('manager')));

create policy tier_rules_management_read
on public.customer_tier_rules
for select to authenticated
using ((select private.is_management_member()));

create policy tier_rules_management_insert
on public.customer_tier_rules
for insert to authenticated
with check ((select private.has_management_role('manager')));

create policy tier_rules_management_update
on public.customer_tier_rules
for update to authenticated
using ((select private.has_management_role('manager')))
with check ((select private.has_management_role('manager')));

create policy tier_rules_management_delete
on public.customer_tier_rules
for delete to authenticated
using ((select private.has_management_role('manager')));

-- ---------------------------------------------------------------------------
-- Address policies
-- ---------------------------------------------------------------------------

create policy addresses_read_own
on public.customer_addresses
for select to authenticated
using ((select auth.uid()) = customer_id);

create policy addresses_management_read
on public.customer_addresses
for select to authenticated
using ((select private.is_management_member()));

create policy addresses_insert_own
on public.customer_addresses
for insert to authenticated
with check ((select auth.uid()) = customer_id);

create policy addresses_update_own
on public.customer_addresses
for update to authenticated
using (
  (select auth.uid()) = customer_id
  or (select private.is_management_member())
)
with check (
  customer_id = (select auth.uid())
  or (select private.is_management_member())
);

create policy addresses_delete_own
on public.customer_addresses
for delete to authenticated
using (
  (select auth.uid()) = customer_id
  or (select private.is_management_member())
);

-- ---------------------------------------------------------------------------
-- Order policies
-- ---------------------------------------------------------------------------

create policy orders_read_own_or_management
on public.orders
for select to authenticated
using (
  customer_id = (select auth.uid())
  or (select private.is_management_member())
);

create policy orders_management_update
on public.orders
for update to authenticated
using ((select private.is_management_member()))
with check ((select private.is_management_member()));

create policy order_items_read_own_or_management
on public.order_items
for select to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_id
      and (
        o.customer_id = (select auth.uid())
        or (select private.is_management_member())
      )
  )
);

create policy returns_read_own_or_management
on public.return_requests
for select to authenticated
using (
  customer_id = (select auth.uid())
  or (select private.is_management_member())
);

create policy returns_management_update
on public.return_requests
for update to authenticated
using ((select private.is_management_member()))
with check ((select private.is_management_member()));

create policy shipments_read_own_or_management
on public.delivery_shipments
for select to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = delivery_shipments.id
      and (
        o.customer_id = (select auth.uid())
        or (select private.is_management_member())
      )
  )
);

create policy shipments_management_update
on public.delivery_shipments
for update to authenticated
using ((select private.is_management_member()))
with check ((select private.is_management_member()));

-- ---------------------------------------------------------------------------
-- Wishlist policies
-- ---------------------------------------------------------------------------

create policy wishlist_read_own
on public.wishlists
for select to authenticated
using ((select auth.uid()) = customer_id);

create policy wishlist_insert_own
on public.wishlists
for insert to authenticated
with check (
  (select auth.uid()) = customer_id
  and exists (
    select 1
    from public.products p
    where p.id = product_id
      and p.is_active = true
  )
);

create policy wishlist_delete_own
on public.wishlists
for delete to authenticated
using ((select auth.uid()) = customer_id);

-- Management can inspect wishlists for analytics/customer insight.
create policy wishlist_management_read
on public.wishlists
for select to authenticated
using ((select private.is_management_member()));

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------
--
-- Storage metadata is managed by Supabase Storage. We only create buckets
-- and policies; we do not modify storage.objects rows directly.
--
-- Public storefront assets are intentionally separate from customer-private
-- assets. Product/editorial/promotion images can be public; profile images
-- can remain private.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'storefront-media',
    'storefront-media',
    true,
    10485760,
    array['image/*']::text[]
  ),
  (
    'customer-media',
    'customer-media',
    false,
    5242880,
    array['image/*']::text[]
  )
on conflict (id) do nothing;

-- Public bucket reads are handled by the bucket's public access model.
-- Upload/update/delete are still protected by storage.objects RLS.

create policy storefront_media_management_insert
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'storefront-media'
  and (select private.has_management_role('manager'))
);

create policy storefront_media_management_update
on storage.objects
for update to authenticated
using (
  bucket_id = 'storefront-media'
  and (select private.has_management_role('manager'))
)
with check (
  bucket_id = 'storefront-media'
  and (select private.has_management_role('manager'))
);

create policy storefront_media_management_delete
on storage.objects
for delete to authenticated
using (
  bucket_id = 'storefront-media'
  and (select private.has_management_role('manager'))
);

create policy customer_media_owner_insert
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'customer-media'
  and owner_id = auth.uid()::text
);

create policy customer_media_owner_update
on storage.objects
for update to authenticated
using (
  bucket_id = 'customer-media'
  and owner_id = auth.uid()::text
)
with check (
  bucket_id = 'customer-media'
  and owner_id = auth.uid()::text
);

create policy customer_media_owner_delete
on storage.objects
for delete to authenticated
using (
  bucket_id = 'customer-media'
  and owner_id = auth.uid()::text
);

create policy customer_media_management_read
on storage.objects
for select to authenticated
using (
  bucket_id = 'customer-media'
  and (select private.is_management_member())
);

-- ---------------------------------------------------------------------------
-- Initial configuration only — no business/customer/product data.
-- ---------------------------------------------------------------------------
--
-- No management member is inserted here because the correct Supabase Auth
-- user UUID does not exist until you create the first management account.
--
-- After creating the first management user in Supabase Auth, run:
--
--   insert into public.management_memberships (user_id, role)
--   values ('THE_AUTH_USER_UUID', 'owner');
--
-- This is the only bootstrap step required for the management authorization
-- table. Do not put the UUID in source control unless it is intentionally
-- public/non-sensitive configuration.

-- ---------------------------------------------------------------------------
-- End of migration
-- ---------------------------------------------------------------------------
