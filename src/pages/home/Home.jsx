import EditorialProductShowcase from "../../components/sections/EditorialProductShowcase";
import { editorialShowcaseData } from "../../data/home/editorialShowcase";
import { collectionSceneProducts } from "../../data/home/collectionScene";
import NewCollectionHero from "../../components/sections/NewCollectionHero/NewCollectionHero";
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
    </main>
  );
}

export default Home;