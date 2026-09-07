function OrderEmptyState() {
    return (
      <div className="rounded-2xl border border-black/8 bg-white p-10 text-center">
        <h3 className="text-sm font-semibold text-black">
          No orders found
        </h3>
  
        <p className="mt-1 text-sm text-black/45">
          Orders will appear here when customers place them.
        </p>
      </div>
    );
  }
  
  export default OrderEmptyState;