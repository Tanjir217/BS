import { collectionSceneProducts } from "./home/collectionScene";
import { editorialShowcases } from "./home/editorialShowcase";
import { inspiredProducts } from "./home/inspiredProductSlider";

const defaultSizes = [34, 35, 36, 37, 38, 39, 40, 41];

const detailedProducts = {
  "": {
    sku: "",
    badge: "",
    subtitle: "",
    color: "",
    colorHex: "",
    category: "",
    breadcrumbs: ["", "", ""],
    sizes: [34, 34.5, 35, 35.5, 36, 36.5, 37, 37.5, 38, 38.5, 39, 39.5, 40, 40.5, 41, 42],
    images: [
      "https://media.jimmychoo.com/image/upload/f_auto,q_auto:best,dpr_2.0,w_900,h_1125,c_fit/ROWPROD_PRODUCT/images/original/CALYOTK85NKT_010003_SIDE_vg1043.jpg",
      "https://media.jimmychoo.com/image/upload/f_auto,q_auto:best,dpr_2.0,w_900,h_1125,c_fit/ROWPROD_PRODUCT/images/original/CALYOTK85NKT_010003_MODEL_vg1044.jpg",
      "https://media.jimmychoo.com/image/upload/f_auto,q_auto:best,dpr_2.0,w_900,h_1125,c_fit/ROWPROD_PRODUCT/images/original/CALYOTK85NKT_010003_ANGLE_vg1043.jpg",
      "https://media.jimmychoo.com/image/upload/f_auto,q_auto:best,dpr_2.0,w_900,h_1125,c_fit/ROWPROD_PRODUCT/images/original/CALYOTK85NKT_010003_DETAIL_vg1043.jpg",
    ],
    description: "",
    details: ["", "", "", "", "", "", ""],
  },
};

const allProductSeeds = [
  ...collectionSceneProducts,
  ...inspiredProducts,
  ...editorialShowcases.flatMap((showcase) => showcase.products),
];

function getSlug(product) {
  return product.href?.replace("/products/", "") || product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function createProduct(product) {
  const slug = getSlug(product);
  const details = detailedProducts[slug];

  return {
    id: product.id,
    slug,
    sku: details?.sku || product.id.toUpperCase(),
    badge: details?.badge || "New Season",
    name: product.name,
    subtitle: details?.subtitle || `${product.name} — crafted for a refined everyday wardrobe.`,
    price: product.price,
    currency: product.currency || "৳",
    color: details?.color || "Black",
    colorHex: details?.colorHex || "#171717",
    category: details?.category || "Shoes",
    breadcrumbs: details?.breadcrumbs || ["Women", "New Arrivals", "Shoes"],
    sizes: details?.sizes || defaultSizes,
    images: details?.images || [product.image],
    description: details?.description || `${product.name} is a signature Bayzid Shoes style, designed with a balance of polish, comfort, and modern elegance.`,
    details: details?.details || ["Signature Bayzid Shoes design", "Carefully selected materials", "Designed for everyday elegance"],
  };
}

// Temporary catalog. A future Supabase query can return this same shape.
export const products = Array.from(
  new Map(allProductSeeds.map((product) => {
    const catalogProduct = createProduct(product);
    return [catalogProduct.slug, catalogProduct];
  })).values(),
);

export function getProductBySlug(slug) {
  return products.find((product) => product.slug === slug);
}
