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

        setProduct(data);
      } catch (err) {
        console.error(
          "Failed to load product:",
          err,
        );

        if (isMounted) {
          setError(err);
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
      <main className="product-page product-page--loading">
        <div className="product-loading">
          <span className="product-loading__line" />
          <span className="product-loading__line product-loading__line--short" />
        </div>
      </main>
    );
  }

  if (error || !product) {
    return <NotFound />;
  }

  return (
    <main className="product-page">
      <div className="product-breadcrumbs">
        <span>Home</span>
        <span>Shop</span>
        <span>{product.name}</span>
      </div>

      <div className="product-page__layout">
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