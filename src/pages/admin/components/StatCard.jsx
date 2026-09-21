function StatCard({
    label,
    value,
    change,
    description,
    icon: Icon,
  }) {
    return (
      <div className="rounded-2xl border border-black/8 bg-white p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-black/40">
              {label}
            </p>
  
            <p className="mt-3 text-2xl font-semibold tracking-tight">
              {value}
            </p>
          </div>
  
          {Icon && (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/5">
              <Icon size={17} strokeWidth={1.8} />
            </div>
          )}
        </div>
  
        <div className="mt-4 flex items-center gap-2">
          {change && (
            <span className="text-xs font-medium text-black">
              {change}
            </span>
          )}
  
          {description && (
            <span className="text-xs text-black/35">{description}</span>
          )}
        </div>
      </div>
    );
  }
  
  export default StatCard;