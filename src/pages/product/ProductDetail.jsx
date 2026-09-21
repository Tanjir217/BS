import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";

import NotFound from "../NotFound";

import { getProductByPath } from "../../services/productServices";
import ProductGallery from "../../components/product/ProductGallery";
import ProductInfo from "../../components/product/ProductInfo";

function ProductDetail() {
  const { "*": productPath = "" } = useParams();

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
          await getProductByPath(productPath.split("/").filter(Boolean));

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
  }, [productPath]);

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

  const requestedPath = productPath.split("/").filter(Boolean).join("/");
  const canonicalPath = product.href.replace(/^\/products\//, "");

  if (requestedPath !== canonicalPath) {
    return <Navigate to={product.href} replace />;
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