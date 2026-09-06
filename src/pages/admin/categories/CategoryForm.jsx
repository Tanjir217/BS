import { useEffect, useState } from "react";

function CategoryForm({
  category,
  onSubmit,
  onCancel,
}) {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
    isActive: true,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        slug: category.slug || "",
        description: category.description || "",
        imageUrl: category.imageUrl || "",
        isActive: category.isActive ?? true,
      });
    } else {
      setFormData({
        name: "",
        slug: "",
        description: "",
        imageUrl: "",
        isActive: true,
      });
    }
  }, [category]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    onSubmit(formData);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-black/8 bg-white p-6"
    >
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/35">
          {category ? "Edit category" : "New category"}
        </p>

        <h2 className="mt-1 text-lg font-semibold">
          {category ? "Update category" : "Create category"}
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Name *
          </label>

          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-black"
            placeholder="Women's Shoes"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Slug *
          </label>

          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-black"
            placeholder="womens-shoes"
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
            className="w-full resize-none rounded-xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-black"
            placeholder="A short description for this category..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium">
            Image URL
          </label>

          <input
            type="url"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-black"
            placeholder="https://..."
          />
        </div>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="h-4 w-4"
          />

          <span className="text-sm font-medium">
            Active category
          </span>
        </label>
      </div>

      <div className="mt-6 flex justify-end gap-3 border-t border-black/8 pt-5">
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
          {category ? "Update Category" : "Create Category"}
        </button>
      </div>
    </form>
  );
}

export default CategoryForm;