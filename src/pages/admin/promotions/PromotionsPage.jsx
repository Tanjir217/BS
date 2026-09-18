import { useEffect, useState } from "react";

import {
  getPromotionCategories,
} from "../../../services/categoryPromotionServices";

import CategoryPromotionManager from "./CategoryPromotionManager";

function PromotionsPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        setCategories(await getPromotionCategories());
      } catch (loadError) {
        setError(loadError?.message || "Unable to load promotion categories.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="space-y-6 py-2 sm:py-4">
      <div>
        <p className="text-sm text-black/45">Marketing</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Category Promotions
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-black/50">
          Each category has its own database-backed banner. All Products,
          Men and Women can be managed independently.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-black/8 bg-white p-6">
          <p className="text-sm text-black/45">Loading categories...</p>
        </div>
      ) : (
        <div className="space-y-5">
          {categories.map((category) => (
            <CategoryPromotionManager
              key={category.$id}
              category={category}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default PromotionsPage;
