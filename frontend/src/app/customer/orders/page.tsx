"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { 
  Package, 
  MapPin, 
  Clock, 
  ChevronRight, 
  Calendar,
  Box,
  ArrowRight
} from "lucide-react";
import SkeletonLoader from "@/components/SkeletonLoader";

export default function MyOrdersPage() {
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Orders</h1>
          <p className="text-slate-500 mt-1">View and track all your shipments.</p>
        </div>
        <button 
          onClick={() => router.push("/customer/book")}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
        >
          Book New Parcel
        </button>
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
                  <th className="p-4">Route</th>
                  <th className="p-4">Parcel Info</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4 pl-6 align-top">
                      <p className="font-mono font-bold text-slate-900">{order._id.substring(0, 8)}...</p>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    
                    <td className="p-4 align-top">
                      <div className="relative pl-4 space-y-3">
                        <div className="absolute left-1 top-1.5 bottom-1.5 w-0.5 bg-slate-200" />
                        
                        <div className="relative">
                          <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full border-2 border-indigo-500 bg-white" />
                          <p className="text-sm font-medium text-slate-900">{order.pickupAddress.fullAddress.substring(0, 25)}...</p>
                          <p className="text-xs text-slate-500">{order.pickupAddress.pinCode}</p>
                        </div>

                        <div className="relative">
                          <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full border-2 border-emerald-500 bg-white" />
                          <p className="text-sm font-medium text-slate-900">{order.deliveryAddress.fullAddress.substring(0, 25)}...</p>
                          <p className="text-xs text-slate-500">{order.deliveryAddress.pinCode}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 align-top">
                      <p className="text-sm font-medium text-slate-900">{order.parcelDetails.parcelType || "Box"}</p>
                      <p className="text-xs text-slate-500">{order.parcelDetails.weightKg} kg</p>
                    </td>

                    <td className="p-4 align-top">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>

                    <td className="p-4 pr-6 align-top text-right">
                      <button 
                        onClick={() => router.push(`/customer/track?id=${order._id}`)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm group-hover:shadow-md"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
