import { useEffect, useState } from "react";

import EditorialProductShowcase from "../../components/sections/EditorialProductShowcase";

import NewCollectionHero from "../../components/sections/NewCollectionHero";

import InspiredProductSlider from "../../components/sections/InspiredProductSlider";

import { inspiredProducts } from "../../data/home/inspiredProductSlider";

import { getNewCollection } from "../../services/homeServices";

function Home() {
  const [newCollection, setNewCollection] = useState(null);

  useEffect(() => {
    async function loadNewCollection() {
      const data = await getNewCollection();

      console.log("NEW COLLECTION:", data);
      console.log("NEW COLLECTION PRODUCTS:", data?.products);
      console.log("PRODUCT COUNT:", data?.products?.length);

      setNewCollection(data);
    }

    loadNewCollection();
  }, []);

  return (
    <main>
      <NewCollectionHero products={newCollection?.products ?? []} />

      <EditorialProductShowcase />

      <InspiredProductSlider products={inspiredProducts} />
    </main>
  );
}

export default Home;
