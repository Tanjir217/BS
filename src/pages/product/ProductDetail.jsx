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
    let isMounted = true;

    async function loadProduct() {
      try {
        setLoading(true);
        setError(null);

        const data =
          await getProductBySlug(slug);

        if (!isMounted) {
          return;
        }

        if (!data) {
          setProduct(null);
          return;
        }

        setProduct(data);
      } catch (loadError) {
        console.error(
          "Failed to load product:",
          loadError,
        );

        if (isMounted) {
          setError(loadError);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <main className="mx-auto max-w-360 px-6 py-16 md:px-10">
        <div className="grid min-h-[50vh] place-items-center">
          <p className="text-sm text-black/50">
            Loading product...
          </p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return <NotFound />;
  }

  return (
    <main className="mx-auto max-w-360 px-6 py-12 md:px-10 md:py-16">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)] lg:items-start lg:gap-16">
        <ProductGallery
          images={product.images}
          productName={product.name}
        />

        <ProductInfo
          product={product}
        />
      </div>
    </main>
  );
}

export default ProductDetail;