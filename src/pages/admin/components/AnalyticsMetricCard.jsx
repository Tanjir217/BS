function formatPercentage(value) {
    const number = Number(value || 0);
  
    if (number > 0) {
      return `+${number.toFixed(1)}%`;
    }
  
    if (number < 0) {
      return `${number.toFixed(1)}%`;
    }
  
    return "0.0%";
  }
  
  function AnalyticsMetricCard({
    label,
    value,
    change,
    description = "vs previous period",
  }) {
    const numericChange = Number(
      change || 0
    );
  
    const changeClass =
      numericChange > 0
        ? "text-emerald-600"
        : numericChange < 0
          ? "text-red-600"
          : "text-black/40";
  
    return (
      <div className="rounded-xl border border-black/8 bg-white p-5">
        <p className="text-xs font-medium text-black/40">
          {label}
        </p>
  
        <p className="mt-3 text-2xl font-semibold tracking-tight">
          {value}
        </p>
  
        <div className="mt-3 flex items-center gap-2">
          <span
            className={[
              "text-xs font-medium",
              changeClass,
            ].join(" ")}
          >
            {formatPercentage(change)}
          </span>
  
          <span className="text-[11px] text-black/30">
            {description}
          </span>
        </div>
      </div>
    );
  }
  
  export default AnalyticsMetricCard;