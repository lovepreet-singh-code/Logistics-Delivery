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
  ChevronRight,
  IndianRupee,
  TrendingUp
} from "lucide-react";
import SkeletonLoader from "@/components/SkeletonLoader";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function CustomerDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (typeof window === "undefined") return;
        
        console.log("Fetching orders from API...");
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found in localStorage");
          setLoading(false);
          return;
        }

        // Cache bypass by appending timestamp
        const res = await axios.get(`http://localhost:8080/api/orders/my-orders?t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = res.data.data || res.data;
        console.log("Orders received:", data);
        
        setOrders(Array.isArray(data) ? data : []);
      } catch (error: any) {
        console.error("Fetch Error:", error.response?.data || error.message || error);
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
      value: orders.filter(o => o.status === "PENDING").length,
      icon: Package,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      href: "/customer/orders?filter=all"
    },
    {
      title: "Active Shipments",
      value: orders.filter(o => o.status === "IN_TRANSIT").length,
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
    { name: "Download Invoice", icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50 hover:bg-emerald-100", border: "border-emerald-100", onClick: () => alert("Invoice generation is coming soon!") },
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

  const chartData = [
    { name: 'Mon', shipments: 12 },
    { name: 'Tue', shipments: 19 },
    { name: 'Wed', shipments: 15 },
    { name: 'Thu', shipments: 22 },
    { name: 'Fri', shipments: 28 },
    { name: 'Sat', shipments: 10 },
    { name: 'Sun', shipments: 5 },
  ];

  const totalSpend = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
  const avgDeliveryTime = "2.4 Days";

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 md:p-8 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-indigo-200 font-medium mb-1">Total Lifetime Spend</p>
            <h3 className="text-3xl md:text-4xl font-extrabold text-white">₹{totalSpend.toLocaleString()}</h3>
          </div>
          <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center backdrop-blur-sm border border-indigo-500/30">
            <IndianRupee className="w-7 h-7 text-indigo-300" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-900 to-slate-900 rounded-3xl p-6 md:p-8 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-emerald-200 font-medium mb-1">Avg Delivery Time</p>
            <h3 className="text-3xl md:text-4xl font-extrabold text-white">{avgDeliveryTime}</h3>
          </div>
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center backdrop-blur-sm border border-emerald-500/30">
            <TrendingUp className="w-7 h-7 text-emerald-300" />
          </div>
        </div>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" /> This Month's Shipments
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="shipments" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
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
                {orders.slice(0, 3).map((order) => (
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
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button 
                        onClick={() => router.push(`/customer/orders/${order._id}`)}
                        className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
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
    </div>
  );
}
