-- Reassert the catalog read surface for hosted environments.
--
-- The storefront and admin dashboard must be able to read products and
-- product image metadata through the publishable/authenticated API key.
-- This migration is intentionally idempotent so it is safe when a remote
-- project already contains equivalent policies.

begin;

-- Public storefront catalog reads.
grant select on table
  public.products,
  public.product_images
to anon, authenticated;

drop policy if exists products_public_read_active on public.products;
create policy products_public_read_active
on public.products
for select
to anon, authenticated
using (is_active = true);

-- Management users may read inactive catalog records too.
drop policy if exists products_management_select on public.products;
create policy products_management_select
on public.products
for select
to authenticated
using ((select private.has_management_role('manager')));

-- Product image metadata is readable for active products, and management
-- users can read metadata for inactive products as well.
drop policy if exists product_images_public_read_active on public.product_images;
create policy product_images_public_read_active
on public.product_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products p
    where p.id = product_images.product_id
      and p.is_active = true
  )
);

drop policy if exists product_images_management_select on public.product_images;
create policy product_images_management_select
on public.product_images
for select
to authenticated
using ((select private.has_management_role('manager')));

-- Storage uploads return object metadata. Keep the SELECT policy aligned with
-- the existing management INSERT/UPDATE/DELETE policies.
drop policy if exists storefront_media_management_select on storage.objects;
create policy storefront_media_management_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'storefront-media'
  and (select private.has_management_role('manager'))
);

commit;
