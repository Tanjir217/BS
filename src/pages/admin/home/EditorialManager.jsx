import { useState } from "react";

import { updateHomeSection } from "../../../services/homeAdminServices";

import {
  getEditorialImageUrl,
  removeEditorialImage,
  replaceEditorialImage,
  uploadEditorialImage,
} from "../../../services/editorialImageServices";

function EditorialManager({ section, onClose }) {
  const [form, setForm] = useState({
    title: section.title || "",
    sub_title: section.sub_title || "",
    editorial_Alt: section.editorial_Alt || "",
    cta_Label: section.cta_Label || "",
    cta_Href: section.cta_Href || "",
    is_Active: section.is_Active ?? true,
  });
  const [editorialFileId, setEditorialFileId] = useState(
    section.editorial_File_ID || "",
  );

  const [editorialImageUrl, setEditorialImageUrl] = useState(
    getEditorialImageUrl(section.editorial_File_ID),
  );

  const [imageUploading, setImageUploading] = useState(false);

  const [imageError, setImageError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await updateHomeSection(section.$id, form);

      setSuccess("Editorial section updated.");
    } catch (error) {
      console.error("Failed to update editorial section:", error);

      setError("Failed to update editorial section.");
    } finally {
      setSaving(false);
    }
  }
  function validateEditorialImage(file) {
    if (!file) {
      return "Please select an image.";
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return "Please select a JPG, PNG, or WebP image.";
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      return "Image must be smaller than 5MB.";
    }

    return "";
  }
  async function handleImageUpload(event) {
    const file = event.target.files?.[0];

    event.target.value = "";

    const validationError = validateEditorialImage(file);

    if (validationError) {
      setImageError(validationError);
      return;
    }

    try {
      setImageUploading(true);
      setImageError("");

      const result = await uploadEditorialImage(section.$id, file);

      setEditorialFileId(result.fileID);
      setEditorialImageUrl(result.url);
    } catch (error) {
      console.error("Failed to upload editorial image:", error);

      setImageError("Failed to upload editorial image.");
    } finally {
      setImageUploading(false);
    }
  }
  async function handleImageReplace(event) {
    const file = event.target.files?.[0];

    event.target.value = "";

    const validationError = validateEditorialImage(file);

    if (validationError) {
      setImageError(validationError);
      return;
    }

    try {
      setImageUploading(true);
      setImageError("");

      const result = await replaceEditorialImage(
        section.$id,
        editorialFileId,
        file,
      );

      setEditorialFileId(result.fileID);
      setEditorialImageUrl(result.url);
    } catch (error) {
      console.error("Failed to replace editorial image:", error);

      setImageError("Failed to replace editorial image.");
    } finally {
      setImageUploading(false);
    }
  }
  async function handleImageRemove() {
    if (!editorialFileId) {
      return;
    }

    const confirmed = window.confirm("Remove the editorial image?");

    if (!confirmed) {
      return;
    }

    try {
      setImageUploading(true);
      setImageError("");

      await removeEditorialImage(section.$id, editorialFileId);

      setEditorialFileId("");
      setEditorialImageUrl(null);
    } catch (error) {
      console.error("Failed to remove editorial image:", error);

      setImageError("Failed to remove editorial image.");
    } finally {
      setImageUploading(false);
    }
  }
  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 p-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Editorial</h2>

          <p className="mt-1 text-sm text-gray-500">
            Manage the editorial content displayed on the homepage.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
        >
          Close
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Title
          </label>

          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Subtitle
          </label>

          <textarea
            name="sub_title"
            value={form.sub_title}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Editorial Image
          </label>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            {editorialImageUrl ? (
              <div>
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <img
                    src={editorialImageUrl}
                    alt={form.editorial_Alt || "Editorial preview"}
                    className="h-64 w-full object-cover"
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <label className="cursor-pointer rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white">
                    {imageUploading ? "Uploading..." : "Replace Image"}

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
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 disabled:opacity-50"
                  >
                    Remove Image
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white px-6 py-10 text-center hover:bg-gray-50">
                <span className="text-sm font-medium text-gray-700">
                  {imageUploading ? "Uploading..." : "Upload Editorial Image"}
                </span>

                <span className="mt-1 text-xs text-gray-500">
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

            {imageError && (
              <p className="mt-3 text-sm text-red-600">{imageError}</p>
            )}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Editorial Alt Text
          </label>

          <input
            name="editorial_Alt"
            value={form.editorial_Alt}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            CTA Label
          </label>

          <input
            name="cta_Label"
            value={form.cta_Label}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            CTA URL
          </label>

          <input
            name="cta_Href"
            value={form.cta_Href}
            onChange={handleChange}
            placeholder="/category/sneakers"
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_Active}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                is_Active: event.target.checked,
              }))
            }
          />

          <span className="text-sm text-gray-700">Active</span>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {success && <p className="text-sm text-green-600">{success}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditorialManager;
