import { useEffect, useState } from "react";

import { getHomeSectionsForAdmin } from "../../../services/homeAdminServices";

import HomeSectionCard from "./HomeSectionCard";

import SectionProductManager from "./SectionProductManager.jsx";

import EditorialManager from "./EditorialManager";

function HomePage() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSection, setSelectedSection] = useState(null);
  useEffect(() => {
    async function loadSections() {
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
    }

    loadSections();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">Loading homepage sections...</p>
      </div>
    );
  }

  if (error) {
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
          Manage the sections and products displayed on your homepage.
        </p>
      </div>

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
            />
          ))}
        </div>
      )}
      {selectedSection && (
        <div className="mt-6">
          {selectedSection.type === "editorial-section" ? (
            <EditorialManager
              key={selectedSection.$id}
              section={selectedSection}
              onClose={() => setSelectedSection(null)}
            />
          ) : (
            <SectionProductManager
              key={selectedSection.$id}
              section={selectedSection}
              onClose={() => setSelectedSection(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default HomePage;
