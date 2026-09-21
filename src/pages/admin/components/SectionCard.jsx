function SectionCard({ title, description, action, children, className = "" }) {
    return (
      <section
        className={[
          "rounded-2xl border border-black/8 bg-white",
          className,
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-black/8 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
  
            {description && (
              <p className="mt-1 text-xs text-black/40">{description}</p>
            )}
          </div>
  
          {action}
        </div>
  
        <div>{children}</div>
      </section>
    );
  }
  
  export default SectionCard;