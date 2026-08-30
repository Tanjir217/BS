import EditorialProductShowcase from "../../components/sections/EditorialProductShowcase";
import  {editorialShowcaseData}  from "../../data/home/editorialShowcase";
import { collectionSceneProducts } from "../../data/home/collectionScene";
import NewCollectionHero from "../../components/sections/NewCollectionHero";
import InspiredProductSlider from "../../components/sections/InspiredProductSlider";
import { inspiredProducts } from "../../data/home/inspiredProductSlider";
function Home() {
  const {
    title,
    subtitle,
    editorial,
    products,
  } = editorialShowcaseData;

  return (
    <main 
    className=""
    >
      <NewCollectionHero products={collectionSceneProducts} />
      <EditorialProductShowcase
        title={title}
        subtitle={subtitle}
        editorial={editorial}
        products={products}
      />
      <EditorialProductShowcase
        title={title}
        subtitle={subtitle}
        editorial={editorial}
        products={products}
        reverse
      />
      <InspiredProductSlider products={inspiredProducts} />

    </main>
  );
}

export default Home;