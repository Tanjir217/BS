-- BAYZID SHOES catalog
-- Apply in the Supabase SQL editor, or with `supabase db push` after linking a project.

create extension if not exists pgcrypto;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  parent_id uuid references public.categories(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  subtitle text,
  description text,
  badge text,
  category_id uuid references public.categories(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A product can later have multiple colours; each purchasable colour is a variant.
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  colour text not null,
  colour_hex text,
  price_amount numeric(12, 2) not null check (price_amount >= 0),
  currency char(3) not null default 'BDT',
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (product_id, colour)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);

create table public.product_sizes (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  size_label text not null,
  sort_order integer not null default 0 check (sort_order >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  unique (variant_id, size_label)
);

create table public.product_details (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  detail text not null,
  sort_order integer not null default 0 check (sort_order >= 0)
);

create index product_variants_product_id_idx on public.product_variants(product_id);
create index product_images_product_id_idx on public.product_images(product_id, sort_order);
create index product_sizes_variant_id_idx on public.product_sizes(variant_id, sort_order);
create index product_details_product_id_idx on public.product_details(product_id, sort_order);

-- Keep `updated_at` current without trusting the browser.
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

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.product_sizes enable row level security;
alter table public.product_details enable row level security;

-- Public storefront visitors can read only items that are available for sale.
create policy "Public can view categories"
on public.categories for select using (true);

create policy "Public can view active products"
on public.products for select using (is_active = true);

create policy "Public can view active variants"
on public.product_variants for select using (is_active = true);

create policy "Public can view product images"
on public.product_images for select using (
  exists (select 1 from public.products p where p.id = product_id and p.is_active = true)
);

create policy "Public can view product sizes"
on public.product_sizes for select using (
  exists (select 1 from public.product_variants v where v.id = variant_id and v.is_active = true)
);

create policy "Public can view product details"
on public.product_details for select using (
  exists (select 1 from public.products p where p.id = product_id and p.is_active = true)
);
