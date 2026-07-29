"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Package, 
  MapPin, 
  Clock, 
  ChevronRight, 
  Calendar,
  Box,
  ArrowRight,
  Search,
  Filter,
  Eye
} from "lucide-react";
import SkeletonLoader from "@/components/SkeletonLoader";
import Link from "next/link";

export default function MyOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter") || "all";
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialFilter);

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

  const getStatusColor = (status: string) => {
    switch(status) {
      case "PENDING": return "bg-purple-100 text-purple-700";
      case "ROUTED": return "bg-blue-100 text-blue-700";
      case "MANIFESTED": return "bg-indigo-100 text-indigo-700";
      case "IN_TRANSIT": return "bg-amber-100 text-amber-700";
      case "OUT_FOR_DELIVERY": return "bg-orange-100 text-orange-700";
      case "DELIVERED": return "bg-emerald-100 text-emerald-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const filteredOrders = orders.filter(order => {
    // Status Filter
    if (statusFilter === "pending" && order.status !== "PENDING") return false;
    if (statusFilter === "transit" && !["OUT_FOR_DELIVERY", "IN_TRANSIT"].includes(order.status)) return false;
    if (statusFilter === "delivered" && order.status !== "DELIVERED") return false;

    // Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const trackingMatch = order._id?.toLowerCase().includes(q);
      const addressMatch = order.deliveryAddress?.fullAddress?.toLowerCase().includes(q) || 
                           order.deliveryAddress?.receiverName?.toLowerCase().includes(q);
      if (!trackingMatch && !addressMatch) return false;
    }

    return true;
  });

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Shipments</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">Manage and track your recent orders in real-time.</p>
        </div>
        
        {/* Search & Filters */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input 
              type="text" 
              placeholder="Search Tracking ID or Name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm w-64 bg-white"
            />
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm appearance-none bg-white font-medium text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="transit">In Transit</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="pt-8">
          <SkeletonLoader type="table" count={5} />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm max-w-2xl mx-auto mt-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="w-24 h-24 bg-gradient-to-tr from-indigo-100 to-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-indigo-50">
              <Box className="w-12 h-12 text-indigo-500" />
            </div>
            
            <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">No shipments yet</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
              You haven't booked any parcels. Experience blazing fast delivery and real-time tracking by placing your first order today.
            </p>
            
            <button 
              onClick={() => router.push("/customer/book")}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-xl hover:shadow-slate-900/20 active:scale-95"
            >
              Book Your First Parcel <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                  <th className="p-4 pl-6">Tracking ID & Date</th>
                  <th className="p-4">Receiver</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">ETA</th>
                  <th className="p-4 text-right">Fare</th>
                  <th className="p-4 pr-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No shipments found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const statusColor = 
                      order.status === "DELIVERED" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                      order.status === "OUT_FOR_DELIVERY" || order.status === "IN_TRANSIT" ? "bg-amber-100 text-amber-700 border-amber-200" :
                      order.status === "CANCELLED" ? "bg-red-100 text-red-700 border-red-200" :
                      "bg-indigo-100 text-indigo-700 border-indigo-200";

                    const receiverInfo = order.deliveryAddress?.receiverName || "N/A";
                    const etaDate = new Date(new Date(order.createdAt).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString();
                    
                    return (
                      <tr key={order._id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 group-hover:scale-110 transition-transform">
                              <Package className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 tracking-tight font-mono">{order._id.slice(-6).toUpperCase()}</p>
                              <p className="text-xs text-slate-500 mt-0.5">#{order._id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-semibold text-slate-800">{receiverInfo}</p>
                          <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[150px]">{order.deliveryAddress?.fullAddress}</p>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border uppercase tracking-wider ${statusColor}`}>
                            {order.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {etaDate}
                          </div>
                        </td>
                        <td className="px-6 py-5 font-bold text-slate-800 text-right">
                          ₹{order.fare || 50}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <Link 
                            href={`/customer/orders/${order._id}`}
                            className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="View Order Details"
                          >
                            <Eye className="w-5 h-5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
