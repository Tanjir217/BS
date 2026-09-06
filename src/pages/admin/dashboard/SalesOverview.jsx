import SectionCard from "../components/SectionCard";

const sales = [
  { day: "Mon", value: 45 },
  { day: "Tue", value: 68 },
  { day: "Wed", value: 52 },
  { day: "Thu", value: 78 },
  { day: "Fri", value: 62 },
  { day: "Sat", value: 91 },
  { day: "Sun", value: 74 },
];

function SalesOverview() {
  return (
    <SectionCard
      title="Sales Overview"
      description="Revenue performance over the last 7 days"
      action={
        <select className="rounded-lg border border-black/8 bg-white px-3 py-2 text-xs outline-none">
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>Last 90 days</option>
        </select>
      }
    >
      <div className="p-5">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs text-black/40">Revenue</p>
            <p className="mt-1 text-2xl font-semibold">৳86,450</p>
          </div>

          <p className="text-xs font-medium">+14.8%</p>
        </div>

        <div className="flex h-64 items-end gap-3 border-b border-black/8">
          {sales.map((item) => (
            <div
              key={item.day}
              className="flex h-full flex-1 flex-col justify-end"
            >
              <div className="flex flex-1 items-end">
                <div
                  className="w-full rounded-t-lg bg-black transition hover:bg-black/75"
                  style={{
                    height: `${item.value}%`,
                  }}
                />
              </div>

              <p className="pb-3 pt-3 text-center text-[10px] text-black/35">
                {item.day}
              </p>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

export default SalesOverview;