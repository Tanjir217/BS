import EditorialProductShowcase from "../../components/sections/EditorialProductShowcase";
import { editorialShowcaseData } from "../../data/home/editorialShowcase";

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