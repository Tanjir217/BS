import { useEffect, useState } from "react";

import EditorialProductShowcase from "../../components/sections/EditorialProductShowcase";
import NewCollectionHero from "../../components/sections/NewCollectionHero";
import InspiredProductSlider from "../../components/sections/InspiredProductSlider";

import {
  getNewCollection,
  getEditorialSections,
  getInspiredProducts,
} from "../../services/homeServices";

function Home() {
  const [newCollection, setNewCollection] = useState(null);
  const [editorialSections, setEditorialSections] = useState([]);
  const [inspiredProducts, setInspiredProducts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadHomeContent() {
      try {
        setError("");

        const [newCollectionData, editorialData, inspiredData] =
          await Promise.all([
            getNewCollection(),
            getEditorialSections(),
            getInspiredProducts(),
          ]);

        if (!isMounted) {
          return;
        }

        setNewCollection(newCollectionData);
        setEditorialSections(editorialData);
        setInspiredProducts(inspiredData);
      } catch (loadError) {
        console.error("Failed to load homepage content:", loadError);

        if (isMounted) {
          setError("Some homepage content could not be loaded.");
        }
      }
    }

    loadHomeContent();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main>
      {error && (
        <div className="border-b border-red-100 bg-red-50 px-6 py-3 text-center text-xs text-red-700">
          {error}
        </div>
      )}

      <NewCollectionHero
        section={newCollection}
        products={newCollection?.products ?? []}
      />
      <EditorialProductShowcase sections={editorialSections} />
      <InspiredProductSlider products={inspiredProducts} />
    </main>
  );
}

export default Home;
