import { Link, useParams } from "react-router-dom";
import ProductGallery from "../../components/product/ProductGallery";
import ProductInfo from "../../components/product/ProductInfo";
import { getProductBySlug } from "../../data/products";
import NotFound from "../NotFound";

function ProductDetail() {
  const { slug } = useParams();
  const product = getProductBySlug(slug);

  if (!product) return <NotFound />;

  return (
    <div className="product-page">
      <nav className="product-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        {product.breadcrumbs.map((crumb) => <span key={crumb}>{crumb}</span>)}
        <span aria-current="page">{product.name}</span>
      </nav>
      <div className="product-page__layout">
        <ProductGallery images={product.images} productName={product.name} />
        <ProductInfo product={product} />
      </div>
    </div>
  );
}

export default ProductDetail;
