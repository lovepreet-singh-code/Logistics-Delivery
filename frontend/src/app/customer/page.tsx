"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle,
  PlusCircle,
  MapPin,
  FileText,
  HeadphonesIcon,
  Calendar,
  ChevronRight
} from "lucide-react";
import SkeletonLoader from "@/components/SkeletonLoader";

export default function CustomerDashboard() {
  const router = useRouter();
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
      <div className="space-y-8">
        <div>
          <SkeletonLoader type="text" />
        </div>
        <SkeletonLoader type="stats" count={4} />
        <SkeletonLoader type="table" count={3} />
      </div>
    );
  }

  const today = new Date().toDateString();

  const metrics = [
    {
      title: "Today's Pickups",
      value: orders.filter(o => new Date(o.createdAt).toDateString() === today).length,
      icon: Package,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      href: "/customer/orders?filter=all"
    },
    {
      title: "Active Shipments",
      value: orders.filter(o => !["DELIVERED", "PENDING", "CANCELLED"].includes(o.status)).length,
      icon: Truck,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      href: "/customer/orders?filter=transit"
    },
    {
      title: "Delivered Orders",
      value: orders.filter(o => o.status === "DELIVERED").length,
      icon: CheckCircle,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      href: "/customer/orders?filter=delivered"
    },
    {
      title: "Cancelled Orders",
      value: orders.filter(o => o.status === "CANCELLED").length,
      icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      href: "/customer/orders?filter=all"
    }
  ];

  const quickActions = [
    { name: "Book New Parcel", icon: PlusCircle, color: "text-indigo-600", bg: "bg-indigo-50 hover:bg-indigo-100", border: "border-indigo-100", onClick: () => router.push("/customer/book") },
    { name: "Track Shipment", icon: MapPin, color: "text-blue-600", bg: "bg-blue-50 hover:bg-blue-100", border: "border-blue-100", onClick: () => router.push("/customer/track") },
    { name: "Download Invoice", icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50 hover:bg-emerald-100", border: "border-emerald-100", onClick: () => router.push("/customer/orders") },
    { name: "Contact Support", icon: HeadphonesIcon, color: "text-amber-600", bg: "bg-amber-50 hover:bg-amber-100", border: "border-amber-100", onClick: () => {} },
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case "PENDING": return "bg-purple-100 text-purple-700 border-purple-200";
      case "IN_TRANSIT": return "bg-amber-100 text-amber-700 border-amber-200";
      case "DELIVERED": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      default: return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-slate-500 mt-1">Welcome back. Here is the status of your shipments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <Link 
            key={i}
            href={m.href}
            className={`block p-6 rounded-3xl bg-white border ${m.border} shadow-sm hover:shadow-md transition-all relative overflow-hidden group hover:-translate-y-1`}
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
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <button 
              key={i}
              onClick={action.onClick}
              className={`flex items-center gap-3 p-4 rounded-2xl border ${action.border} ${action.bg} transition-colors group text-left`}
            >
              <div className={`p-2 rounded-xl bg-white/60 shadow-sm ${action.color}`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-700 group-hover:text-slate-900 text-sm">
                {action.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Recent Orders</h2>
          <button 
            onClick={() => router.push("/customer/orders")}
            className="text-indigo-600 text-sm font-bold hover:text-indigo-700"
          >
            View All
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 text-lg font-medium">You haven't placed any orders yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-100">
                  <th className="p-4 pl-6">Tracking ID</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4 pl-6">
                      <span className="font-mono font-bold text-slate-800">{order._id.substring(0, 8)}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button 
                        onClick={() => router.push(`/customer/track?id=${order._id}`)}
                        className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700 group-hover:underline"
                      >
                        View <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
