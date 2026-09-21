import { useEffect, useState } from "react";
import {
  createCategory,
  deleteCategory,
  getCategoriesForAdmin,
  updateCategory,
} from "../../../services/categoryServices";

import CategoryTable from "./CategoryTable";
import CategoryForm from "./CategoryForm";

function getErrorMessage(error, fallback) {
  return error?.message || fallback;
}

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function loadCategories() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const data = await getCategoriesForAdmin();

      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories:", error);
      setCategories([]);
      setErrorMessage(
        getErrorMessage(
          error,
          "Failed to load categories. Please refresh and try again.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function handleAddCategory() {
    setErrorMessage("");
    setEditingCategory(null);
    setIsFormOpen(true);
  }

  function handleEditCategory(category) {
    setErrorMessage("");
    setEditingCategory(category);
    setIsFormOpen(true);
  }

  async function handleSubmit(formData) {
    try {
      setIsSaving(true);
      setErrorMessage("");

      if (editingCategory) {
        await updateCategory(editingCategory.$id, formData);
      } else {
        await createCategory(formData);
      }

      setIsFormOpen(false);
      setEditingCategory(null);

      await loadCategories();
    } catch (error) {
      console.error("Failed to save category:", error);
      setErrorMessage(
        getErrorMessage(
          error,
          "Failed to save category. Please check the form and try again.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(categoryId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this category?",
    );

    if (!confirmed) return;

    try {
      setErrorMessage("");
      await deleteCategory(categoryId);
      await loadCategories();
    } catch (error) {
      console.error("Failed to delete category:", error);
      setErrorMessage(
        getErrorMessage(error, "Failed to delete category."),
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-black/45">Catalog</p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Categories
          </h1>

          <p className="mt-1 text-sm text-black/50">
            Manage product categories for your store.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddCategory}
          className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black/80"
        >
          Add Category
        </button>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {isFormOpen && (
        <CategoryForm
          category={editingCategory}
          onSubmit={handleSubmit}
          onCancel={() => {
            if (!isSaving) {
              setIsFormOpen(false);
              setEditingCategory(null);
            }
          }}
        />
      )}

      <CategoryTable
        categories={categories}
        isLoading={isLoading}
        onEdit={handleEditCategory}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default CategoriesPage;
