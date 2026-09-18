-- Bayzid Shoes production schema.
-- Appwrite remains the development backend until this migration is verified.

create extension if not exists pgcrypto;

create table if not exists public.management_memberships (
  user_id text primary key,
  role text not null check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  slug text not null unique,
  description text not null default '',
  image_url text not null default '',
  parent_category_id text references public.categories(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  slug text not null unique,
  sku text not null,
  description text not null default '',
  price integer not null check (price >= 0),
  compare_at_price integer,
  category_id text not null references public.categories(id),
  color text not null default '',
  color_hex text not null default '',
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id text primary key default gen_random_uuid()::text,
  product_id text not null references public.products(id) on delete cascade,
  file_id text not null,
  alt text not null default '',
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists product_images_one_primary on public.product_images(product_id) where is_primary = true;

create table if not exists public.customer_addresses (
  id text primary key default gen_random_uuid()::text,
  customer_id text not null,
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
create unique index if not exists customer_addresses_one_default on public.customer_addresses(customer_id) where is_default = true;

create table if not exists public.orders (
  id text primary key default gen_random_uuid()::text,
  order_number text not null unique,
  customer_id text,
  customer_name text not null,
  customer_email text not null default '',
  customer_phone text not null,
  shipping_address text not null,
  shipping_city text not null,
  shipping_postal_code text not null default '',
  subtotal integer not null check (subtotal >= 0),
  shipping_cost integer not null default 0 check (shipping_cost >= 0),
  discount integer not null default 0 check (discount >= 0),
  total integer not null check (total >= 0),
  payment_method text not null check (payment_method in ('cod', 'online')),
  payment_status text not null check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  order_status text not null check (order_status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  notes text not null default '',
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id text primary key default gen_random_uuid()::text,
  order_id text not null references public.orders(id) on delete cascade,
  product_id text not null references public.products(id),
  product_name text not null,
  product_sku text not null default '',
  product_color text not null default '',
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total integer not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.delivery_shipments (
  id text primary key default gen_random_uuid()::text,
  order_id text not null references public.orders(id) on delete cascade,
  provider text not null,
  consignment_id text,
  tracking_url text,
  status text not null default 'created',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, consignment_id)
);

create table if not exists public.return_requests (
  id text primary key default gen_random_uuid()::text,
  return_number text not null unique,
  order_id text not null references public.orders(id),
  customer_id text not null,
  request_type text not null check (request_type in ('return', 'exchange')),
  reason text not null,
  details text not null default '',
  requested_item_ids text not null,
  exchange_note text not null default '',
  status text not null check (status in ('requested', 'approved', 'rejected', 'pickup', 'received', 'completed', 'cancelled')),
  resolution text not null check (resolution in ('pending', 'refund', 'exchange', 'replacement')),
  refund_amount integer not null default 0 check (refund_amount >= 0),
  management_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_transactions (
  id text primary key default gen_random_uuid()::text,
  order_id text not null references public.orders(id),
  provider text not null,
  transaction_id text not null,
  status text not null,
  amount integer not null check (amount >= 0),
  currency text not null default 'BDT',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, transaction_id)
);

create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_active_idx on public.products(is_active);
create index if not exists product_images_product_idx on public.product_images(product_id, sort_order);
create index if not exists addresses_customer_idx on public.customer_addresses(customer_id);
create index if not exists orders_customer_idx on public.orders(customer_id, created_at desc);
create index if not exists orders_status_idx on public.orders(order_status, created_at desc);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists shipments_order_idx on public.delivery_shipments(order_id);
create index if not exists returns_customer_idx on public.return_requests(customer_id, created_at desc);
create index if not exists returns_order_idx on public.return_requests(order_id);
create index if not exists returns_status_idx on public.return_requests(status, created_at desc);
create index if not exists payment_transactions_order_idx on public.payment_transactions(order_id, created_at desc);

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.delivery_shipments enable row level security;
alter table public.return_requests enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.management_memberships enable row level security;

create policy "public can read active categories" on public.categories for select using (is_active = true);
create policy "public can read active products" on public.products for select using (is_active = true);
create policy "public can read images for active products" on public.product_images for select using (exists (select 1 from public.products p where p.id = product_images.product_id and p.is_active = true));
create policy "customers read own addresses" on public.customer_addresses for select to authenticated using (customer_id = auth.uid()::text);
create policy "customers create own addresses" on public.customer_addresses for insert to authenticated with check (customer_id = auth.uid()::text);
create policy "customers update own addresses" on public.customer_addresses for update to authenticated using (customer_id = auth.uid()::text) with check (customer_id = auth.uid()::text);
create policy "customers delete own addresses" on public.customer_addresses for delete to authenticated using (customer_id = auth.uid()::text);
create policy "customers read own orders" on public.orders for select to authenticated using (customer_id = auth.uid()::text);
create policy "customers read own order items" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_items.order_id and o.customer_id = auth.uid()::text));
create policy "customers read own shipments" on public.delivery_shipments for select to authenticated using (exists (select 1 from public.orders o where o.id = delivery_shipments.order_id and o.customer_id = auth.uid()::text));
create policy "customers read own returns" on public.return_requests for select to authenticated using (customer_id = auth.uid()::text);
create policy "management members read own membership" on public.management_memberships for select to authenticated using (user_id = auth.uid()::text);

create or replace function public.create_order_atomic(
  p_idempotency_key text, p_customer_id text, p_customer_name text, p_customer_email text,
  p_customer_phone text, p_shipping_address text, p_shipping_city text, p_shipping_postal_code text,
  p_shipping_cost integer, p_discount integer, p_payment_method text, p_notes text, p_items jsonb
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_order_id text;
  v_order_number text;
  v_subtotal integer := 0;
  v_total integer;
  v_product public.products%rowtype;
  v_item record;
  v_existing public.orders%rowtype;
begin
  if auth.uid() is null or p_customer_id <> auth.uid()::text then raise exception 'Customer authentication is required'; end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key)) < 8 then raise exception 'A valid idempotency key is required'; end if;
  if p_customer_name is null or trim(p_customer_name) = '' then raise exception 'Customer name is required'; end if;
  if p_customer_phone is null or trim(p_customer_phone) = '' then raise exception 'Customer phone is required'; end if;
  if p_shipping_address is null or trim(p_shipping_address) = '' then raise exception 'Shipping address is required'; end if;
  if p_shipping_city is null or trim(p_shipping_city) = '' then raise exception 'Shipping city is required'; end if;
  if p_shipping_cost < 0 or p_discount < 0 then raise exception 'Invalid shipping or discount value'; end if;
  if p_payment_method not in ('cod', 'online') then raise exception 'Unsupported payment method'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'At least one order item is required'; end if;

  select * into v_existing from public.orders where idempotency_key = p_idempotency_key limit 1;
  if found then return jsonb_build_object('order_id', v_existing.id, 'order_number', v_existing.order_number, 'replayed', true); end if;

  v_order_id := gen_random_uuid()::text;
  v_order_number := 'BS-' || to_char(now(), 'YYYYMMDDHH24MISSMS') || '-' || upper(substr(gen_random_uuid()::text, 1, 6));

  insert into public.orders (
    id, order_number, customer_id, customer_name, customer_email, customer_phone, shipping_address,
    shipping_city, shipping_postal_code, subtotal, shipping_cost, discount, total, payment_method,
    payment_status, order_status, notes, idempotency_key
  ) values (
    v_order_id, v_order_number, p_customer_id, trim(p_customer_name), coalesce(trim(p_customer_email), ''), trim(p_customer_phone),
    trim(p_shipping_address), trim(p_shipping_city), coalesce(trim(p_shipping_postal_code), ''), 0, p_shipping_cost,
    p_discount, 0, p_payment_method, 'pending', 'pending', coalesce(trim(p_notes), ''), p_idempotency_key
  ) on conflict (idempotency_key) do nothing;

  if not found then
    select * into v_existing from public.orders where idempotency_key = p_idempotency_key limit 1;
    return jsonb_build_object('order_id', v_existing.id, 'order_number', v_existing.order_number, 'replayed', true);
  end if;

  for v_item in select * from jsonb_to_recordset(p_items) as x(product_id text, quantity integer) loop
    if v_item.product_id is null or v_item.quantity is null or v_item.quantity <= 0 then raise exception 'Invalid order item'; end if;

    select * into v_product from public.products where id = v_item.product_id and is_active = true for update;
    if not found then raise exception 'Product % is unavailable', v_item.product_id; end if;
    if v_product.stock_quantity < v_item.quantity then raise exception 'Insufficient stock for %', v_product.name; end if;

    insert into public.order_items (order_id, product_id, product_name, product_sku, product_color, unit_price, quantity, line_total)
    values (v_order_id, v_product.id, v_product.name, v_product.sku, v_product.color, v_product.price, v_item.quantity, v_product.price * v_item.quantity);

    update public.products set stock_quantity = stock_quantity - v_item.quantity, updated_at = now() where id = v_product.id;
    v_subtotal := v_subtotal + (v_product.price * v_item.quantity);
  end loop;

  v_total := v_subtotal + p_shipping_cost - p_discount;
  if v_total < 0 then raise exception 'Order total cannot be negative'; end if;

  update public.orders set subtotal = v_subtotal, total = v_total, updated_at = now() where id = v_order_id;

  return jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number, 'subtotal', v_subtotal, 'shipping_cost', p_shipping_cost, 'discount', p_discount, 'total', v_total, 'payment_method', p_payment_method, 'payment_status', 'pending', 'order_status', 'pending', 'replayed', false);
end;
$$;

revoke all on function public.create_order_atomic(text, text, text, text, text, text, text, text, integer, integer, text, text, jsonb) from public;
grant execute on function public.create_order_atomic(text, text, text, text, text, text, text, text, integer, integer, text, text, jsonb) to authenticated;
grant select on public.categories, public.products, public.product_images to anon, authenticated;
grant select, insert, update, delete on public.customer_addresses to authenticated;
grant select on public.orders, public.order_items, public.delivery_shipments, public.return_requests to authenticated;
