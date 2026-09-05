import { useEffect, useState } from "react";

import EditorialProductShowcase from "../../components/sections/EditorialProductShowcase";

import NewCollectionHero from "../../components/sections/NewCollectionHero";

import InspiredProductSlider from "../../components/sections/InspiredProductSlider";

import { inspiredProducts } from "../../data/home/inspiredProductSlider";

import {
  getNewCollection,
  getEditorialSections,
} from "../../services/homeServices";

function Home() {
  const [newCollection, setNewCollection] = useState(null);
  const [editorialSections, setEditorialSections] = useState([]);

  useEffect(() => {
    async function loadHomeContent() {
      const newCollectionData = await getNewCollection();

      const editorialData = await getEditorialSections();

      console.log("NEW COLLECTION:", newCollectionData);
      console.log("EDITORIAL SECTIONS:", editorialData);

      setNewCollection(newCollectionData);
      setEditorialSections(editorialData);
    }

    loadHomeContent();
  }, []);

  return (
    <main>
      <NewCollectionHero products={newCollection?.products ?? []} />

      <EditorialProductShowcase sections={editorialSections} />

      <InspiredProductSlider products={inspiredProducts} />
    </main>
  );
}

export default Home;
