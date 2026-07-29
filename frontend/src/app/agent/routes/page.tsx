"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Route, Navigation, Loader2, Play, MapPin, Package, Clock } from "lucide-react";
import apiClient from "@/lib/apiClient";
import Link from "next/link";

export default function RoutesPage() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayDeliveries();
  }, []);

  const fetchTodayDeliveries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await apiClient.get("/agent/deliveries/active");
      if (response.data.success && Array.isArray(response.data.data)) {
        setDeliveries(response.data.data);
      } else {
        setDeliveries([]);
      }
    } catch (err: any) {
      console.error("Failed to fetch deliveries", err);
    } finally {
      setLoading(false);
    }
  };

  const pendingDeliveries = deliveries; // Since we are fetching active only

  return (
    <>
      <div className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 shrink-0 z-20 sticky top-0 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <Route className="w-5 h-5 text-indigo-500" />
          Active Routes
        </h1>
        <div className="bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 rounded-xl">
           <span className="text-xs font-bold text-indigo-400">{pendingDeliveries.length} Pending</span>
        </div>
      </div>

      <div className="px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <p className="text-sm font-medium">Loading routes...</p>
          </div>
        ) : pendingDeliveries.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                 <Package className="w-10 h-10 text-slate-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Active Routes</h3>
              <p className="text-slate-400 text-sm">You have no pending deliveries assigned at the moment.</p>
           </div>
        ) : (
          <div className="space-y-4">
            {pendingDeliveries.map((delivery, index) => {
              const order = delivery.orderId;
              const trackingId = order?._id?.slice(-8).toUpperCase() || "UNKNOWN";
              const pickupAddress = order?.pickupAddress?.fullAddress || "Hub";
              const dropAddress = order?.deliveryAddress?.fullAddress || "Unknown Destination";
              const weight = order?.parcelDetails?.weight ? `${order.parcelDetails.weight}kg` : 'N/A';
              const isOutForDelivery = delivery.status === "OUT_FOR_DELIVERY" || delivery.status === "IN_TRANSIT";

              return (
                <div key={delivery._id} className="bg-slate-900/80 backdrop-blur-xl rounded-[2rem] p-5 border border-slate-700/50 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                       <div className="flex items-center gap-2 mb-1">
                          <span className="bg-slate-800 text-slate-300 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">
                            Stop {index + 1}
                          </span>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                            isOutForDelivery ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          }`}>
                            {isOutForDelivery ? "In Transit" : "Pending"}
                          </span>
                       </div>
                       <h3 className="font-mono text-lg font-black text-white mt-2">{trackingId}</h3>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Weight</p>
                       <p className="text-sm font-bold text-slate-300">{weight}</p>
                    </div>
                  </div>

                  <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/50 mb-5 relative z-10 space-y-4">
                     <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                           <Package className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Pickup</p>
                           <p className="text-sm font-medium text-slate-300 line-clamp-1">{pickupAddress}</p>
                        </div>
                     </div>
                     <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                           <MapPin className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Drop</p>
                           <p className="text-sm font-medium text-white line-clamp-2">{dropAddress}</p>
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-3 relative z-10">
                     <button className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 rounded-2xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                        <Navigation className="w-4 h-4" /> Nav
                     </button>
                     <Link href={`/agent/routes/${delivery._id}`} className="flex-[2] py-3.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25">
                        <Play className="w-4 h-4 fill-white" /> Start Delivery
                     </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
