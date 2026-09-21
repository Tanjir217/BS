const statusStyles = {
    Delivered: "bg-black text-white",
    Processing: "bg-black/8 text-black",
    Shipped: "bg-black/8 text-black",
    Pending: "bg-black/8 text-black",
    Cancelled: "bg-black/5 text-black/45",
    Active: "bg-black text-white",
    Inactive: "bg-black/5 text-black/45",
  };
  
  function StatusBadge({ status }) {
    const className =
      statusStyles[status] ?? "bg-black/8 text-black";
  
    return (
      <span
        className={[
          "inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium",
          className,
        ].join(" ")}
      >
        {status}
      </span>
    );
  }
  
  export default StatusBadge;