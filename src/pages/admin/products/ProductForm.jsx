import { useEffect, useState } from "react";
import ProductImageManager from "./ProductImageManager";
const EMPTY_FORM = {
  name: "",
  slug: "",
  sku: "",
  description: "",
  price: "",
  compareAtPrice: "",
  categoryID: "",
  color: "",
  colorHEX: "",
  stockQuantity: "",
  isFeatured: false,
  isActive: true,
};

function ProductForm({ product, categories, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        slug: product.slug || "",
        sku: product.sku || "",
        description: product.description || "",
        price: product.price ?? "",
        compareAtPrice: product.compareAtPrice ?? "",
        categoryID: product.categoryID || "",
        color: product.color || "",
        colorHEX: product.colorHEX || "",
        stockQuantity: product.stockQuantity ?? "",
        isFeatured: product.isFeatured ?? false,
        isActive: product.isActive ?? true,
      });
    } else {
      setFormData(EMPTY_FORM);
    }
  }, [product]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    onSubmit({
      ...formData,
      price: Number(formData.price),
      compareAtPrice:
        formData.compareAtPrice === "" ? "" : Number(formData.compareAtPrice),
      stockQuantity: Number(formData.stockQuantity),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-black/8 bg-white p-6"
    >
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/35">
          {product ? "Edit product" : "New product"}
        </p>

        <h2 className="mt-1 text-lg font-semibold">
          {product ? "Update product" : "Create product"}
        </h2>
      </div>

      {/* Basic Information */}
      <section>
        <h3 className="mb-4 text-sm font-semibold">Basic Information</h3>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Name *</label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Rosie"
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">SKU *</label>

            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              required
              placeholder="ROSIE-001"
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">Slug *</label>

            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              required
              placeholder="rosie"
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">
              Description
            </label>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Product description..."
              className="w-full resize-none rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mt-8 border-t border-black/8 pt-6">
        <h3 className="mb-4 text-sm font-semibold">Pricing</h3>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Price *</label>

            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="12000"
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Compare At Price
            </label>

            <input
              type="number"
              name="compareAtPrice"
              value={formData.compareAtPrice}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="15000"
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black"
            />

            <p className="mt-1.5 text-xs text-black/40">
              Used to calculate the discount shown to customers.
            </p>
          </div>
        </div>
      </section>

      {/* Category */}
      <section className="mt-8 border-t border-black/8 pt-6">
        <h3 className="mb-4 text-sm font-semibold">Category</h3>

        <select
          name="categoryID"
          value={formData.categoryID}
          onChange={handleChange}
          className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black"
        >
          <option value="">Select a category</option>

          {categories
            .filter((category) => category.isActive)
            .map((category) => (
              <option key={category.$id} value={category.$id}>
                {category.name}
              </option>
            ))}
        </select>
      </section>

      {/* Product Details */}
      <section className="mt-8 border-t border-black/8 pt-6">
        <h3 className="mb-4 text-sm font-semibold">Product Details</h3>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Color</label>

            <input
              type="text"
              name="color"
              value={formData.color}
              onChange={handleChange}
              placeholder="Black"
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Color HEX</label>

            <input
              type="text"
              name="colorHEX"
              value={formData.colorHEX}
              onChange={handleChange}
              placeholder="#000000"
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>
        </div>
      </section>
      <ProductImageManager productId={product?.$id} />
      {/* Inventory */}
      <section className="mt-8 border-t border-black/8 pt-6">
        <h3 className="mb-4 text-sm font-semibold">Inventory</h3>

        <div className="max-w-md">
          <label className="mb-2 block text-sm font-medium">
            Stock Quantity *
          </label>

          <input
            type="number"
            name="stockQuantity"
            value={formData.stockQuantity}
            onChange={handleChange}
            required
            min="0"
            step="1"
            placeholder="25"
            className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black"
          />
        </div>
      </section>

      {/* Visibility */}
      <section className="mt-8 border-t border-black/8 pt-6">
        <h3 className="mb-4 text-sm font-semibold">Visibility</h3>

        <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4"
            />

            <span className="text-sm font-medium">Active product</span>
          </label>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              name="isFeatured"
              checked={formData.isFeatured}
              onChange={handleChange}
              className="h-4 w-4"
            />

            <span className="text-sm font-medium">Featured product</span>
          </label>
        </div>
      </section>

      {/* Actions */}
      <div className="mt-8 flex justify-end gap-3 border-t border-black/8 pt-5">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium transition hover:bg-black/5"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-black/80"
        >
          {product ? "Update Product" : "Create Product"}
        </button>
      </div>
    </form>
  );
}

export default ProductForm;
