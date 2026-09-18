import { useEffect, useState } from "react";

import {
  createCategoryPromotion,
  getPromotionForAdmin,
  updateCategoryPromotion,
  uploadCategoryPromotionImage,
  replaceCategoryPromotionImage,
  removeCategoryPromotionImage,
} from "../../../services/categoryPromotionServices";

function CategoryPromotionManager({ category }) {
  const [promotion, setPromotion] = useState(null);
  const [form, setForm] = useState({
    title: "",
    sub_title: "",
    image_Alt: "",
    cta_Label: "",
    cta_Href: "",
    is_Active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const result = await getPromotionForAdmin(category.$id);

        if (!mounted) return;

        setPromotion(result);
        if (result) {
          setForm({
            title: result.title || "",
            sub_title: result.sub_title || "",
            image_Alt: result.image_Alt || "",
            cta_Label: result.cta_Label || "",
            cta_Href: result.cta_Href || "",
            is_Active: result.is_Active ?? true,
          });
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError?.message || "Unable to load this promotion.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [category.$id]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleCreate() {
    try {
      setSaving(true);
      setError("");
      const created = await createCategoryPromotion(category.$id);
      setPromotion(created);
      setForm({
        title: created.title || "",
        sub_title: created.sub_title || "",
        image_Alt: created.image_Alt || "",
        cta_Label: created.cta_Label || "",
        cta_Href: created.cta_Href || "",
        is_Active: created.is_Active ?? true,
      });
      setSuccess("Banner created.");
    } catch (createError) {
      setError(createError?.message || "Unable to create the banner.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!promotion) return;

    try {
      setSaving(true);
      setError("");
      const updated = await updateCategoryPromotion(promotion.$id, form);
      setPromotion(updated);
      setSuccess("Banner saved.");
    } catch (saveError) {
      setError(saveError?.message || "Unable to save the banner.");
    } finally {
      setSaving(false);
    }
  }

  function validateFile(file) {
    if (!file) return "Please select an image.";
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return "Use JPG, PNG or WebP.";
    }
    if (file.size > 5 * 1024 * 1024) {
      return "Image must be smaller than 5MB.";
    }
    return "";
  }

  async function handleImage(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setImageUploading(true);
      setError("");

      const updated = promotion.image_File_ID
        ? await replaceCategoryPromotionImage(
            promotion.$id,
            promotion.image_File_ID,
            file,
          )
        : await uploadCategoryPromotionImage(promotion.$id, file);

      setPromotion(updated);
      setSuccess("Banner image saved.");
    } catch (imageError) {
      setError(imageError?.message || "Unable to save the banner image.");
    } finally {
      setImageUploading(false);
    }
  }

  async function handleRemoveImage() {
    if (!promotion?.image_File_ID) return;

    try {
      setImageUploading(true);
      setError("");
      const updated = await removeCategoryPromotionImage(
        promotion.$id,
        promotion.image_File_ID,
      );
      setPromotion(updated);
      setSuccess("Banner image removed.");
    } catch (removeError) {
      setError(removeError?.message || "Unable to remove the banner image.");
    } finally {
      setImageUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-black/8 bg-white p-5">
        <p className="text-sm text-black/45">Loading banner...</p>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-black/8 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-black/35">
            Category promotion
          </p>
          <h2 className="mt-1 text-lg font-semibold">{category.name}</h2>
        </div>

        {!promotion && (
          <button
            type="button"
            onClick={handleCreate}
            disabled={saving}
            className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Create banner
          </button>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {!promotion ? (
        <p className="mt-5 text-sm text-black/45">
          No banner is configured for this category yet.
        </p>
      ) : (
        <form onSubmit={handleSave} className="mt-5 space-y-5">
          {promotion.imageUrl && (
            <div className="overflow-hidden rounded-2xl bg-black">
              <img
                src={promotion.imageUrl}
                alt={form.image_Alt || category.name}
                className="h-52 w-full object-cover"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <label className="cursor-pointer rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white">
              {imageUploading
                ? "Uploading..."
                : promotion.image_File_ID
                  ? "Replace image"
                  : "Upload image"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImage}
                disabled={imageUploading}
                className="hidden"
              />
            </label>

            {promotion.image_File_ID && (
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={imageUploading}
                className="rounded-xl border border-black/10 px-4 py-2.5 text-sm"
              >
                Remove image
              </button>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-black/40">
                Title
              </span>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className="w-full rounded-xl bg-black/[0.035] px-4 py-3 text-sm outline-none ring-1 ring-black/5 focus:ring-black/15"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-black/40">
                CTA label
              </span>
              <input
                name="cta_Label"
                value={form.cta_Label}
                onChange={handleChange}
                className="w-full rounded-xl bg-black/[0.035] px-4 py-3 text-sm outline-none ring-1 ring-black/5 focus:ring-black/15"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-black/40">
              Promotional message
            </span>
            <textarea
              name="sub_title"
              value={form.sub_title}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-xl bg-black/[0.035] px-4 py-3 text-sm outline-none ring-1 ring-black/5 focus:ring-black/15"
            />
          </label>

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-black/40">
                Image alt
              </span>
              <input
                name="image_Alt"
                value={form.image_Alt}
                onChange={handleChange}
                className="w-full rounded-xl bg-black/[0.035] px-4 py-3 text-sm outline-none ring-1 ring-black/5 focus:ring-black/15"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-black/40">
                CTA URL
              </span>
              <input
                name="cta_Href"
                value={form.cta_Href}
                onChange={handleChange}
                placeholder="/all-products"
                className="w-full rounded-xl bg-black/[0.035] px-4 py-3 text-sm outline-none ring-1 ring-black/5 focus:ring-black/15"
              />
            </label>
          </div>

          <label className="flex items-center gap-3 text-sm text-black/60">
            <input
              type="checkbox"
              name="is_Active"
              checked={form.is_Active}
              onChange={handleChange}
              className="h-4 w-4 accent-black"
            />
            Show this banner on the storefront
          </label>

          <div className="flex items-center justify-between border-t border-black/8 pt-4">
            <span className="text-xs text-black/40">
              Stored in Appwrite, not browser storage.
            </span>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save banner"}
            </button>
          </div>

          {success && <p className="text-sm text-green-700">{success}</p>}
        </form>
      )}
    </section>
  );
}

export default CategoryPromotionManager;
