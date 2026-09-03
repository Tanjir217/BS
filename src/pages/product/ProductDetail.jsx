import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import NotFound from "../NotFound";
import { getProductBySlug } from "../../services/productServices";

import ProductGallery from "../../components/product/ProductGallery";
import ProductInfo from "../../components/product/ProductInfo";
function ProductDetail() {
  const { slug } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        setError(null);

        const data = await getProductBySlug(slug);
        console.log("PRODUCT:", data);
        console.log("PRODUCT IMAGES:", data?.images);
        setProduct(data);
      } catch (err) {
        console.error("Failed to load product:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto grid min-h-[50vh] max-w-xl place-items-center px-6 py-20 text-center">
        Loading product...
      </div>
    );
  }

  if (error || !product) {
    return <NotFound />;
  }

  return (
    <main>
      <ProductGallery images={product.images} productName={product.name} />

      {/* <ProductInfo product={product} /> */}
    </main>
  );
}

export default ProductDetail;
