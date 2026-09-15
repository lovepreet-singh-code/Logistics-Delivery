"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Package, Calendar, ChevronRight, Search, Truck, AlertTriangle } from "lucide-react";
import SkeletonLoader from "@/components/SkeletonLoader";

export default function CustomerDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderIdInput, setOrderIdInput] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (typeof window === "undefined") return;
        
        const token = localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await axios.get(`http://localhost:8080/api/orders/my-orders?t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = res.data.data || res.data;
        setOrders(Array.isArray(data) ? data : []);
      } catch (error: any) {
        console.error("Fetch Error:", error.response?.data || error.message || error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, []);

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const trackingId = orderIdInput.trim();
    if (!trackingId) return;

    setTrackingLoading(true);
    setTrackingError('');
    router.push(`/customer/track?id=${trackingId}`);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "PENDING": return "bg-purple-100 text-purple-700 border-purple-200";
      case "IN_TRANSIT": return "bg-amber-100 text-amber-700 border-amber-200";
      case "DELIVERED": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      default: return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <SkeletonLoader type="text" />
        </div>
        <SkeletonLoader type="table" count={3} />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-12">
        {/* Track Header & Search Bar */}
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 drop-shadow-sm">
            Track Your Package
          </h1>
          <p className="text-slate-500 text-lg">
            Enter your Tracking ID below for real-time updates.
          </p>

          <form onSubmit={handleTrackOrder} className="flex flex-col md:flex-row gap-4 mt-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
              <input 
                type="text" 
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                placeholder="Enter Tracking ID..."
                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-lg font-medium shadow-sm"
              />
            </div>
            <button 
              type="submit" 
              disabled={trackingLoading || !orderIdInput.trim()}
              className="py-4 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center disabled:opacity-70 active:scale-95 group"
            >
              {trackingLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span className="flex items-center gap-2">
                  Track
                  <Truck className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>
          
          {trackingError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 mt-4 text-left">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-red-700 text-sm font-medium">{trackingError}</p>
            </div>
          )}
        </div>

        {/* Recent Orders Mini-List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col mt-12">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-xl font-bold text-slate-900">Recent Orders</h2>
            {orders.length > 0 && (
              <button 
                onClick={() => router.push("/customer/orders")}
                className="text-indigo-600 text-sm font-bold hover:text-indigo-700"
              >
                View All
              </button>
            )}
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">You haven't placed any orders yet.</p>
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
                          onClick={() => router.push(`/customer/track?id=${order._id}`)}
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
