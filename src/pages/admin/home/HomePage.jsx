import { useCallback, useEffect, useState } from "react";

import {
  getHomeSectionsForAdmin,
  updateHomeSectionStatus,
} from "../../../services/homeAdminServices";
import HomeSectionCard from "./HomeSectionCard";
import SectionProductManager from "./SectionProductManager";
import EditorialManager from "./EditorialManager";

function HomePage() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSection, setSelectedSection] = useState(null);
  const [savingSectionId, setSavingSectionId] = useState(null);

  const loadSections = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setSections(await getHomeSectionsForAdmin());
    } catch (loadError) {
      console.error("Failed to load homepage sections:", loadError);
      setError(
        loadError?.message || "Failed to load homepage sections.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  async function handleToggle(section) {
    try {
      setSavingSectionId(section.$id);
      setError("");

      const updated = await updateHomeSectionStatus(
        section.$id,
        !section.isActive,
      );

      setSections((current) =>
        current.map((item) =>
          item.$id === section.$id ? updated : item,
        ),
      );

      setSelectedSection((current) =>
        current?.$id === section.$id ? updated : current,
      );
    } catch (toggleError) {
      console.error("Failed to update homepage section:", toggleError);
      setError(
        toggleError?.message || "Failed to update homepage section.",
      );
    } finally {
      setSavingSectionId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          Homepage Management
        </h1>
        <p className="text-sm text-black/45">Loading homepage sections...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-black/45">Content</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Homepage Management
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-black/50">
          Control which homepage sections are live, edit editorial content,
          and manage the products and ordering inside each section.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {sections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-white p-10 text-center">
          <p className="text-sm text-black/50">
            No homepage sections exist yet. Run the latest Supabase migration
            to create the default sections.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {sections.map((section) => (
            <HomeSectionCard
              key={section.$id}
              section={section}
              onManage={() => setSelectedSection(section)}
              onToggle={handleToggle}
              isSaving={savingSectionId === section.$id}
            />
          ))}
        </div>
      )}

      {selectedSection && (
        <div>
          {selectedSection.type === "editorial-section" ? (
            <EditorialManager
              key={selectedSection.$id}
              section={selectedSection}
              onClose={() => setSelectedSection(null)}
              onSaved={loadSections}
            />
          ) : (
            <SectionProductManager
              key={selectedSection.$id}
              section={selectedSection}
              onClose={() => setSelectedSection(null)}
              onSaved={loadSections}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default HomePage;
