import SectionCard from "../components/SectionCard";

const products = [
  {
    name: "Maysa 90",
    stock: 0,
  },
  {
    name: "Rosie 85",
    stock: 3,
  },
  {
    name: "Celia 70",
    stock: 5,
  },
  {
    name: "Virnasa",
    stock: 7,
  },
];

function LowStockProducts() {
  return (
    <SectionCard
      title="Inventory Alerts"
      description="Products that need attention"
      action={
        <button className="text-xs font-medium underline underline-offset-4">
          Inventory
        </button>
      }
    >
      <div className="divide-y divide-black/8">
        {products.map((product) => (
          <div
            key={product.name}
            className="flex items-center justify-between px-5 py-4"
          >
            <div>
              <p className="text-sm font-medium">{product.name}</p>

              <p className="mt-1 text-xs text-black/40">
                {product.stock === 0
                  ? "Out of stock"
                  : "Low stock"}
              </p>
            </div>

            <div
              className={[
                "text-sm font-semibold",
                product.stock === 0
                  ? "text-black/35"
                  : "text-black",
              ].join(" ")}
            >
              {product.stock}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export default LowStockProducts;