import { useState } from "react";

import { updateHomeSection } from "../../../services/homeAdminServices";

function EditorialManager({ section, onClose }) {
  const [form, setForm] = useState({
    title: section.title || "",
    sub_title: section.sub_title || "",
    editorial_Alt: section.editorial_Alt || "",
    cta_Label: section.cta_Label || "",
    cta_Href: section.cta_Href || "",
    is_Active: section.is_Active ?? true,
  });

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
