import {
    CircleDollarSign,
    ShoppingBag,
    Package,
  } from "lucide-react";
  
  import StatCard from "../components/StatCard";
  
  const stats = [
    {
      label: "Total Sales",
      value: "৳245,800",
      change: "+12.4%",
      description: "vs last month",
      icon: CircleDollarSign,
    },
    {
      label: "Today's Sales",
      value: "৳18,500",
      change: "+8.2%",
      description: "vs yesterday",
      icon: CircleDollarSign,
    },
    {
      label: "Orders",
      value: "48",
      change: "+6",
      description: "this month",
      icon: ShoppingBag,
    },
    {
      label: "Active Products",
      value: "32",
      change: "+3",
      description: "this month",
      icon: Package,
    },
  ];
  
  function DashboardStats() {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
    );
  }
  
  export default DashboardStats;