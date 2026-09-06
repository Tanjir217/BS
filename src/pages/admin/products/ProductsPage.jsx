import { useEffect, useMemo, useState } from "react";
import {
  createProduct,
  deleteProduct,
  getProductsForAdmin,
  updateProduct,
} from "../../../services/productServices";
import { getCategoriesForAdmin } from "../../../services/categoryServices";
import ProductPagination from "./ProductPagination";
import ProductFilters from "./ProductFilters";
import ProductTable from "./ProductTable";
import ProductForm from "./ProductForm";

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const PRODUCTS_PER_PAGE = 10;

  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    status: "all",
    stock: "all",
    discount: "all",
  });

  async function loadProducts() {
    try {
      setIsLoading(true);

      const [productResult, categoryData] = await Promise.all([
        getProductsForAdmin({
          page,
          limit: PRODUCTS_PER_PAGE,
        }),
        getCategoriesForAdmin(),
      ]);

      setProducts(productResult.products);
      setTotalPages(productResult.totalPages);
      setTotalProducts(productResult.total);

      setCategories(categoryData);
    } catch (error) {
      console.error("Failed to load admin products:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, [page]);
  useEffect(() => {
    setPage(1);
  }, [
    filters.search,
    filters.category,
    filters.status,
    filters.stock,
    filters.discount,
  ]);
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const search = filters.search.trim().toLowerCase();

      const matchesSearch =
        !search ||
        product.name?.toLowerCase().includes(search) ||
        product.sku?.toLowerCase().includes(search) ||
        product.slug?.toLowerCase().includes(search);

      const matchesCategory =
        filters.category === "all" || product.categoryID === filters.category;

      const matchesStatus =
        filters.status === "all" ||
        (filters.status === "active" && product.isActive) ||
        (filters.status === "inactive" && !product.isActive);

      const matchesStock =
        filters.stock === "all" ||
        (filters.stock === "in-stock" && product.stockQuantity > 0) ||
        (filters.stock === "low" &&
          product.stockQuantity > 0 &&
          product.stockQuantity <= 5) ||
        (filters.stock === "out" && product.stockQuantity <= 0);

      const hasDiscount =
        product.compareAtPrice && product.compareAtPrice > product.price;

      const matchesDiscount =
        filters.discount === "all" ||
        (filters.discount === "discounted" && hasDiscount) ||
        (filters.discount === "no-discount" && !hasDiscount);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus &&
        matchesStock &&
        matchesDiscount
      );
    });
  }, [products, filters]);

  function handleAddProduct() {
    setEditingProduct(null);
    setIsFormOpen(true);
  }

  function handleEditProduct(product) {
    setEditingProduct(product);
    setIsFormOpen(true);
  }

  async function handleSubmit(formData) {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.$id, formData);
      } else {
        await createProduct(formData);
      }

      setIsFormOpen(false);
      setEditingProduct(null);

      await loadProducts();
    } catch (error) {
      console.error("Failed to save product:", error);
    }
  }

  async function handleDelete(productId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?",
    );

    if (!confirmed) return;

    try {
      await deleteProduct(productId);
      await loadProducts();
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-black/45">Catalog</p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Products
          </h1>

          <p className="mt-1 text-sm text-black/50">
            Manage your store products, pricing, inventory and visibility.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddProduct}
          className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black/80"
        >
          Add Product
        </button>
      </div>

      {/* Form */}
      {isFormOpen && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingProduct(null);
          }}
        />
      )}

      {/* Filters */}
      <ProductFilters
        filters={filters}
        categories={categories}
        onChange={setFilters}
      />

      {/* Table */}
      <ProductTable
        products={filteredProducts}
        categories={categories}
        isLoading={isLoading}
        onEdit={handleEditProduct}
        onDelete={handleDelete}
      />
      <ProductPagination
        page={page}
        totalPages={totalPages}
        totalProducts={totalProducts}
        onPageChange={setPage}
      />
    </div>
  );
}

export default ProductsPage;
