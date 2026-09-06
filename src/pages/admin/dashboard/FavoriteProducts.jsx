import { Heart } from "lucide-react";

import SectionCard from "../components/SectionCard";

const products = [
  {
    name: "Rosie 85",
    favorites: 128,
  },
  {
    name: "Virnasa",
    favorites: 94,
  },
  {
    name: "Celia 70",
    favorites: 73,
  },
];

function FavoriteProducts() {
  return (
    <SectionCard
      title="Most Favorited"
      description="Products customers save the most"
    >
      <div className="divide-y divide-black/8">
        {products.map((product) => (
          <div
            key={product.name}
            className="flex items-center gap-3 px-5 py-4"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/5">
              <Heart size={15} strokeWidth={1.8} />
            </div>

            <p className="flex-1 text-sm font-medium">
              {product.name}
            </p>

            <p className="text-xs text-black/45">
              {product.favorites} favorites
            </p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export default FavoriteProducts;