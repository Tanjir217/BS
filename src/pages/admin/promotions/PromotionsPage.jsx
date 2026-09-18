import CatalogPromotionManager from "../home/CatalogPromotionManager";

function PromotionsPage() {
  return (
    <div className="space-y-6 py-2 sm:py-4">
      <div>
        <p className="text-sm text-black/45">Marketing</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Promotions</h1>
        <p className="mt-1 text-sm text-black/50">
          Control the promotional banner displayed across catalog pages.
        </p>
      </div>

      <CatalogPromotionManager />
    </div>
  );
}

export default PromotionsPage;
