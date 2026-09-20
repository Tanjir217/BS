import { useCallback, useEffect, useState } from "react";

import {
  getHomeSectionsForAdmin,
  updateHomeSectionStatus,
} from "../../../services/homeAdminServices";

import HomeSectionCard from "./HomeSectionCard";
import SectionProductManager from "./SectionProductManager.jsx";
import EditorialManager from "./EditorialManager";

function HomePage() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSection, setSelectedSection] = useState(null);

  const loadSections = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getHomeSectionsForAdmin();
      setSections(data);
    } catch (error) {
      console.error("Failed to load homepage sections:", error);
      setError("Failed to load homepage sections.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  async function handleToggleSection(section) {
    try {
      setError("");

      const updated = await updateHomeSectionStatus(
        section.$id,
        !section.is_Active,
      );

      setSections((current) =>
        current.map((item) =>
          item.$id === section.$id ? { ...item, ...updated } : item,
        ),
      );

      setSelectedSection((current) =>
        current?.$id === section.$id
          ? { ...current, ...updated }
          : current,
      );
    } catch (error) {
      console.error("Failed to update homepage section:", error);
      setError("Failed to update homepage section visibility.");
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">Loading homepage sections...</p>
      </div>
    );
  }

  if (error && sections.length === 0) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Homepage Management
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage editorial content, section visibility, product selection,
          slider order, and imagery shown on the homepage.
        </p>
      </div>

      {error && (
        <p className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {sections.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">No homepage sections found.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {sections.map((section) => (
            <HomeSectionCard
              key={section.$id}
              section={section}
              onManage={() => setSelectedSection(section)}
              onToggleActive={handleToggleSection}
            />
          ))}
        </div>
      )}

      {selectedSection && (
        <div className="mt-6 space-y-6">
          <EditorialManager
            key={`editorial-${selectedSection.$id}`}
            section={selectedSection}
            onClose={() => setSelectedSection(null)}
          />

          <SectionProductManager
            key={`products-${selectedSection.$id}`}
            section={selectedSection}
            onClose={() => setSelectedSection(null)}
          />
        </div>
      )}
    </div>
  );
}

export default HomePage;
