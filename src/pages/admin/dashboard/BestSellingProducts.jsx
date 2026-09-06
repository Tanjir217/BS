import SectionCard from "../components/SectionCard";

const products = [
  {
    rank: 1,
    name: "Rosie 85",
    sold: 42,
    revenue: "৳520,800",
  },
  {
    rank: 2,
    name: "Virnasa",
    sold: 31,
    revenue: "৳540,950",
  },
  {
    rank: 3,
    name: "Maysa 90",
    sold: 24,
    revenue: "৳364,800",
  },
];

function BestSellingProducts() {
  return (
    <SectionCard
      title="Best Selling"
      description="Top products by units sold"
      action={
        <button className="text-xs font-medium underline underline-offset-4">
          View all
        </button>
      }
    >
      <div className="divide-y divide-black/8">
        {products.map((product) => (
          <div
            key={product.name}
            className="flex items-center gap-3 px-5 py-4"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/5 text-xs font-semibold">
              {product.rank}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {product.name}
              </p>

              <p className="mt-1 text-xs text-black/40">
                {product.sold} sold
              </p>
            </div>

            <p className="text-xs font-medium">
              {product.revenue}
            </p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export default BestSellingProducts;