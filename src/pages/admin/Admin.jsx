import { useEffect, useState } from "react";
import { getProducts } from "../../services/productServices";

function Admin() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);

        const data = await getProducts();

        setProducts(data);
      } catch (error) {
        console.error("APPWRITE ERROR:", error);
        setError(error);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  if (loading) {
    return <div>Loading products...</div>;
  }

  if (error) {
    return <div>Failed to load products.</div>;
  }

  return (
    <main>
      <h1>Products</h1>

      {products.map((product) => (
        <div key={product.$id}>
          <h2>{product.name}</h2>
          <p>{product.price}</p>
          <p>{product.slug}</p>
        </div>
      ))}
    </main>
  );
}

export default Admin;