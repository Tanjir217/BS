import { useEffect } from "react";
import EditorialProductShowcase from "../../components/sections/EditorialProductShowcase";
// import  {editorialShowcases}  from "../../data/home/editorialShowcase";
import { collectionSceneProducts } from "../../data/home/collectionScene";
import NewCollectionHero from "../../components/sections/NewCollectionHero";
import InspiredProductSlider from "../../components/sections/InspiredProductSlider";
import { inspiredProducts } from "../../data/home/inspiredProductSlider";
import { getNewCollection } from "../../services/homeServices";
function Home() {
  useEffect(() => {
    async function testHomeService() {
      const data = await getNewCollection();
  
      console.log("NEW COLLECTION:", data);
    }
  
    testHomeService();
  }, []);
  // const {
  //   title,
  //   subtitle,
  //   editorial,
  //   products,
  // } = editorialShowcaseData;
  console.log(import.meta.env.VITE_APPWRITE_ENDPOINT)
  return (
    <main 
    className=""
    >
      <NewCollectionHero products={collectionSceneProducts} />
      {/* <EditorialProductShowcase
        title={title}
        subtitle={subtitle}
        editorial={editorial}
        products={products}
      /> */}
      {/* <EditorialProductShowcase
        title={title}
        subtitle={subtitle}
        editorial={editorial}
        products={products}
        reverse = {true}
      /> */}
      <EditorialProductShowcase/>
      <InspiredProductSlider products={inspiredProducts} />

    </main>
  );
}

export default Home;