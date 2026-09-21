-- Catalog paths, scoped category slugs, homepage defaults and storage metadata access.
-- This migration is additive and safe to run after 20260921000000.

-- Category slugs are unique within their parent category, not globally.
-- This allows /men/new-collection and /women/new-collection to coexist.
alter table public.categories
  drop constraint if exists categories_slug_key;

create unique index if not exists categories_parent_slug_unique_idx
  on public.categories (
    coalesce(parent_category_id, '00000000-0000-0000-0000-000000000000'::uuid),
    lower(slug)
  );

create index if not exists categories_slug_lookup_idx
  on public.categories (lower(slug));

-- Seed the homepage section records only when they do not already exist.
-- Product assignments and editorial media remain empty and are controlled
-- from the admin dashboard.
insert into public.home_sections (
  section_key,
  type,
  title,
  sub_title,
  cta_label,
  cta_href,
  is_active,
  sort_order
)
values
  ('new_collection', 'collection-hero', 'New Collection', '', 'Shop New Collection', '/all-products', true, 10),
  ('editorial_women', 'editorial-section', 'Women', 'Explore the latest women''s collection.', '', '', true, 20),
  ('editorial_men', 'editorial-section', 'Men', 'Explore the latest men''s collection.', '', '', true, 30),
  ('inspired', 'inspired-slider', 'Get inspired', '', '', '', true, 40)
on conflict (section_key) do nothing;

-- The storefront bucket is public for product/editorial image delivery.
-- Authenticated management users still need SELECT metadata access for
-- upload/delete workflows through the Storage API.
drop policy if exists storefront_media_management_select
on storage.objects;

create policy storefront_media_management_select
on storage.objects
for select to authenticated
using (
  bucket_id = 'storefront-media'
  and (select private.has_management_role('manager'))
);
