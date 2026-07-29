"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  Loader2 
} from "lucide-react";

export default function CustomerDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:8080/api/orders/my-orders", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data.data || []);
      } catch (error) {
        console.error("Failed to fetch orders", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const metrics = [
    {
      title: "Total Orders",
      value: orders.length,
      icon: Package,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20"
    },
    {
      title: "Active Shipments",
      value: orders.filter(o => !["DELIVERED", "PENDING"].includes(o.status)).length,
      icon: Truck,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20"
    },
    {
      title: "Delivered",
      value: orders.filter(o => o.status === "DELIVERED").length,
      icon: CheckCircle,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20"
    },
    {
      title: "Pending Pickups",
      value: orders.filter(o => o.status === "PENDING").length,
      icon: Clock,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-slate-500 mt-1">Welcome back. Here is the status of your shipments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <div 
            key={i}
            className={`p-6 rounded-3xl bg-white border ${m.border} shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group`}
          >
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${m.bg} group-hover:scale-150 transition-transform duration-500`} />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">{m.title}</p>
                <h3 className="text-3xl font-bold text-slate-900">{m.value}</h3>
              </div>
              <div className={`p-3 rounded-2xl ${m.bg} ${m.color}`}>
                <m.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Activity</h2>
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">You haven't placed any orders yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.slice(0, 5).map((order) => (
              <div key={order._id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                    {order.pickupAddress.pinCode.substring(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {order.pickupAddress.fullAddress} → {order.deliveryAddress.fullAddress}
                    </p>
                    <p className="text-xs text-slate-500">Tracking ID: {order._id}</p>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600">
                  {order.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
