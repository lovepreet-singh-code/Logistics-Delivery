"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { 
  Package, 
  MapPin, 
  Clock, 
  ChevronRight, 
  Loader2,
  Calendar
} from "lucide-react";

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
        <div className="flex items-center justify-center h-64 bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Orders Found</h3>
          <p className="text-slate-500 mb-6">You haven't placed any shipment orders yet.</p>
          <button 
            onClick={() => router.push("/customer/book")}
            className="text-indigo-600 font-medium hover:text-indigo-700"
          >
            Start your first booking &rarr;
          </button>
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
