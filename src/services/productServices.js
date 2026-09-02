import { supabase } from "../utils/supabase";

function mapProduct(product) {
  const variants = (product.product_variants ?? [])
    .filter((variant) => variant.is_active)
    .map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      color: variant.color,
      colorHex: variant.color_hex,
      price: Number(variant.price_amount),
      currency: variant.currency,
      stockQuantity: variant.stock_quantity,

      sizes: (variant.product_sizes ?? [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((size) => ({
          id: size.id,
          label: size.size_label,
          stockQuantity: size.stock_quantity,
        })),
    }));

  const images = (product.product_images ?? [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((image) => ({
      id: image.id,
      variantId: image.variant_id,
      url: image.image_url,
      alt: image.alt_text || product.name,
      sortOrder: image.sort_order,
    }));

  const details = (product.product_details ?? [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => item.detail);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    subtitle: product.subtitle,
    description: product.description,
    badge: product.badge,
    categoryId: product.category_id,

    variants,
    images,
    details,
  };
}

export async function getProductBySlug(slug) {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      slug,
      name,
      subtitle,
      description,
      badge,
      category_id,

      product_variants (
        id,
        sku,
        color,
        color_hex,
        price_amount,
        currency,
        stock_quantity,
        is_active,

        product_sizes (
          id,
          size_label,
          sort_order,
          stock_quantity
        )
      ),

      product_images (
        id,
        variant_id,
        image_url,
        alt_text,
        sort_order
      ),

      product_details (
        id,
        detail,
        sort_order
      )
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) {
    throw error;
  }

  return mapProduct(data);
}