"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, History, CheckCircle, Package } from "lucide-react";
import apiClient from "@/lib/apiClient";

export default function HistoryPage() {
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

      const response = await apiClient.get("/agent/deliveries/history");
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

  const completedDeliveries = deliveries;

  return (
    <>
      <div className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 shrink-0 z-20 sticky top-0 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <History className="w-5 h-5 text-emerald-500" />
          Earnings & History
        </h1>
        <div className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl">
           <span className="text-xs font-bold text-emerald-400">{completedDeliveries.length} Done</span>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Earnings Summary */}
        <div className="bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-3xl p-6 shadow-xl mb-8 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-10 -translate-y-10 pointer-events-none"></div>
           <p className="text-indigo-100 text-sm font-medium mb-1 relative z-10">Today's Earnings</p>
           <h2 className="text-4xl font-black text-white relative z-10">₹850</h2>
           
           <div className="flex gap-4 mt-6 pt-4 border-t border-indigo-400/30 relative z-10">
              <div>
                 <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-wider">Deliveries</p>
                 <p className="text-white font-bold text-lg">{completedDeliveries.length}</p>
              </div>
              <div className="w-px h-8 bg-indigo-400/30"></div>
              <div>
                 <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-wider">Distance</p>
                 <p className="text-white font-bold text-lg">64 km</p>
              </div>
           </div>
        </div>

        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Completed Timeline</h3>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <p className="text-sm font-medium">Loading history...</p>
          </div>
        ) : completedDeliveries.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                 <Package className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-400 text-sm">No completed deliveries yet today.</p>
           </div>
        ) : (
          <div className="relative pl-4 space-y-6">
             {/* Timeline Line */}
             <div className="absolute left-6 top-2 bottom-2 w-px bg-slate-800"></div>

            {completedDeliveries.map((delivery, index) => {
              const order = delivery.orderId;
              const trackingId = order?._id?.slice(-8).toUpperCase() || "UNKNOWN";
              const dropAddress = order?.deliveryAddress?.fullAddress || "Address not available";
              
              // Simulate delivery time for visual timeline
              const mockTime = new Date();
              mockTime.setHours(14 - index, 30 + (index * 15), 0);

              return (
                <div key={delivery._id} className="relative flex gap-4 z-10 group">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 border-4 border-slate-950 flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-emerald-500/20">
                     <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex-1 bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-sm group-hover:border-slate-700 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                       <h4 className="font-mono font-bold text-white tracking-wide">{trackingId}</h4>
                       <span className="text-xs font-bold text-slate-500">{mockTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-1">{dropAddress}</p>
                    <div className="mt-3 inline-block px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider rounded-lg">
                       Delivered Successfully
                    </div>
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
