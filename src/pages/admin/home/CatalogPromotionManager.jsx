import { useEffect, useState } from "react";

import {
  createCatalogPromotion,
  getCatalogPromotionForAdmin,
  updateCatalogPromotion,
} from "../../../services/catalogPromotionServices";

import {
  getEditorialImageUrl,
  removeEditorialImage,
  replaceEditorialImage,
  uploadEditorialImage,
} from "../../../services/editorialImageServices";

function CatalogPromotionManager() {
  const [promotion, setPromotion] = useState(null);
  const [form, setForm] = useState({
    title: "",
    sub_title: "",
    editorial_Alt: "",
    cta_Label: "",
    cta_Href: "",
    is_Active: true,
  });
  const [imageUrl, setImageUrl] = useState(null);
  const [fileId, setFileId] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadPromotion() {
    try {
      setLoading(true);
      setError("");
      const result = await getCatalogPromotionForAdmin();
      setPromotion(result);
      if (result) {
        setForm({
          title: result.title || "",
          sub_title: result.sub_title || "",
          editorial_Alt: result.editorial_Alt || "",
          cta_Label: result.cta_Label || "",
          cta_Href: result.cta_Href || "",
          is_Active: result.is_Active ?? true,
        });
        setFileId(result.editorial_File_ID || "");
        setImageUrl(getEditorialImageUrl(result.editorial_File_ID));
      }
    } catch (loadError) {
      console.error("Failed to load catalog promotion:", loadError);
      setError(loadError?.message || "Unable to load the catalog promotion.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPromotion();
  }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleCreate() {
    try {
      setCreating(true);
      setError("");
      setSuccess("");
      const created = await createCatalogPromotion();
      setPromotion(created);
      setForm({
        title: created.title || "",
        sub_title: created.sub_title || "",
        editorial_Alt: created.editorial_Alt || "",
        cta_Label: created.cta_Label || "",
        cta_Href: created.cta_Href || "",
        is_Active: created.is_Active ?? true,
      });
      setFileId(created.editorial_File_ID || "");
      setImageUrl(null);
      setSuccess("Catalog promotion created.");
    } catch (createError) {
      console.error("Failed to create catalog promotion:", createError);
      setError(createError?.message || "Unable to create the catalog promotion.");
    } finally {
      setCreating(false);
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!promotion) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const updated = await updateCatalogPromotion(promotion.$id, form);
      setPromotion(updated);
      setSuccess("Catalog promotion updated.");
    } catch (saveError) {
      console.error("Failed to update catalog promotion:", saveError);
      setError(saveError?.message || "Unable to update the catalog promotion.");
    } finally {
      setSaving(false);
    }
  }

  function validateImage(file) {
    if (!file) return "Please select an image.";
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return "Please select a JPG, PNG, or WebP image.";
    }
    if (file.size > 5 * 1024 * 1024) {
      return "Image must be smaller than 5MB.";
    }
    return "";
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    const validationError = validateImage(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setImageUploading(true);
      setError("");
      const result = await uploadEditorialImage(promotion.$id, file);
      setFileId(result.fileID);
      setImageUrl(result.url);
      setPromotion((current) => ({
        ...current,
        editorial_File_ID: result.fileID,
      }));
      setSuccess("Promotional image uploaded.");
    } catch (uploadError) {
      console.error("Failed to upload promotional image:", uploadError);
      setError(uploadError?.message || "Unable to upload the promotional image.");
    } finally {
      setImageUploading(false);
    }
  }

  async function handleImageReplace(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    const validationError = validateImage(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setImageUploading(true);
      setError("");
      const result = await replaceEditorialImage(promotion.$id, fileId, file);
      setFileId(result.fileID);
      setImageUrl(result.url);
      setPromotion((current) => ({
        ...current,
        editorial_File_ID: result.fileID,
      }));
      setSuccess("Promotional image replaced.");
    } catch (replaceError) {
      console.error("Failed to replace promotional image:", replaceError);
      setError(replaceError?.message || "Unable to replace the promotional image.");
    } finally {
      setImageUploading(false);
    }
  }

  async function handleImageRemove() {
    if (!fileId || !promotion) return;
    if (!window.confirm("Remove the promotional image?")) return;

    try {
      setImageUploading(true);
      setError("");
      await removeEditorialImage(promotion.$id, fileId);
      setFileId("");
      setImageUrl(null);
      setPromotion((current) => ({
        ...current,
        editorial_File_ID: "",
      }));
      setSuccess("Promotional image removed.");
    } catch (removeError) {
      console.error("Failed to remove promotional image:", removeError);
      setError(removeError?.message || "Unable to remove the promotional image.");
    } finally {
      setImageUploading(false);
    }
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-black/8 bg-white p-6">
        <p className="text-sm text-black/50">Loading catalog promotion...</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-black/8 bg-white p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/35">
            Catalog
          </p>
          <h2 className="mt-1 text-xl font-semibold text-black">
            Promotional banner
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-black/50">
            This banner replaces the old category-page header and can be changed without editing the storefront.
          </p>
        </div>

        {!promotion && (
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create banner"}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!promotion ? (
        <div className="rounded-xl border border-dashed border-black/12 bg-black/[0.02] p-8 text-center text-sm text-black/50">
          No catalog promotion is configured yet.
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-black/45">
                Title
              </span>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className="w-full rounded-xl border-0 bg-black/[0.035] px-4 py-3 text-sm shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] outline-none focus:ring-2 focus:ring-black/10"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-black/45">
                CTA label
              </span>
              <input
                name="cta_Label"
                value={form.cta_Label}
                onChange={handleChange}
                placeholder="Shop the collection"
                className="w-full rounded-xl border-0 bg-black/[0.035] px-4 py-3 text-sm shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] outline-none focus:ring-2 focus:ring-black/10"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-black/45">
              Promotional message
            </span>
            <textarea
              name="sub_title"
              value={form.sub_title}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-xl border-0 bg-black/[0.035] px-4 py-3 text-sm shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] outline-none focus:ring-2 focus:ring-black/10"
            />
          </label>

          <div>
            <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-black/45">
              Banner image
            </span>
            <div className="overflow-hidden rounded-2xl border border-black/8 bg-black/[0.02] p-4">
              {imageUrl ? (
                <>
                  <img
                    src={imageUrl}
                    alt={form.editorial_Alt || "Catalog promotion preview"}
                    className="h-56 w-full rounded-xl object-cover"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <label className="cursor-pointer rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white">
                      {imageUploading ? "Uploading..." : "Replace image"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageReplace}
                        disabled={imageUploading}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleImageRemove}
                      disabled={imageUploading}
                      className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium text-black/65 disabled:opacity-50"
                    >
                      Remove image
                    </button>
                  </div>
                </>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-black/10 bg-white px-6 py-10 text-center">
                  <span className="text-sm font-medium text-black/70">
                    {imageUploading ? "Uploading..." : "Upload banner image"}
                  </span>
                  <span className="mt-1 text-xs text-black/40">
                    JPG, PNG or WebP · Max 5MB
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    disabled={imageUploading}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-black/45">
                Image alt text
              </span>
              <input
                name="editorial_Alt"
                value={form.editorial_Alt}
                onChange={handleChange}
                className="w-full rounded-xl border-0 bg-black/[0.035] px-4 py-3 text-sm shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] outline-none focus:ring-2 focus:ring-black/10"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-black/45">
                CTA URL
              </span>
              <input
                name="cta_Href"
                value={form.cta_Href}
                onChange={handleChange}
                placeholder="/all-products"
                className="w-full rounded-xl border-0 bg-black/[0.035] px-4 py-3 text-sm shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] outline-none focus:ring-2 focus:ring-black/10"
              />
            </label>
          </div>

          <label className="flex items-center gap-3 text-sm text-black/65">
            <input
              type="checkbox"
              name="is_Active"
              checked={form.is_Active}
              onChange={handleChange}
              className="h-4 w-4 accent-black"
            />
            Show this promotion on catalog pages
          </label>

          <div className="flex items-center justify-between gap-4 border-t border-black/8 pt-5">
            <p className="text-xs text-black/40">
              Changes apply to Men, Women and All Products category pages.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save promotion"}
            </button>
          </div>

          {success && <p className="text-sm text-green-700">{success}</p>}
        </form>
      )}
    </section>
  );
}

export default CatalogPromotionManager;
