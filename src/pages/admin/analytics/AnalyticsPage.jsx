import { useEffect, useState } from "react";

import SectionCard from "../components/SectionCard";

function AnalyticsPage() {


  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/40">
          Insights
        </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Analytics
        </h1>

        <p className="mt-2 max-w-xl text-sm text-black/45">
          Understand your store performance, sales trends,
          products, and customers.
        </p>
      </div>

      <SectionCard
        title="Analytics"
        description="Analytics workspace is being built."
      >
        <div className="flex min-h-64 items-center justify-center px-5">
          <p className="text-sm text-black/35">
            Analytics overview coming next.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}

export default AnalyticsPage;