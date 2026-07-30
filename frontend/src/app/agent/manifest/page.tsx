"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  ArrowLeft,
  Truck,
  MapPin,
  ListOrdered
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Order {
  _id: string;
  deliveryAddress?: {
    fullAddress?: string;
    city?: string;
  };
  receiverName?: string;
}

interface LoadItem extends Order {
  isLoaded: boolean;
  loadSequence: number;
}

export default function LoadingManifest() {
  const router = useRouter();
  const [loadPlan, setLoadPlan] = useState<LoadItem[]>([]);
  const [loadedItems, setLoadedItems] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignedOrders = async () => {
      try {
        if (typeof window === "undefined") return;
        
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await axios.get(`http://localhost:8080/api/orders?t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = res.data.data || res.data;
        let orders: Order[] = Array.isArray(data) ? data : [];

        // Keep active pending orders
        orders = orders.filter(o => !["DELIVERED", "CANCELLED"].includes((o as any).status));

        // Fallback dummy data if API returns empty for testing
        if (orders.length === 0) {
          orders = [
            { _id: "STOP1-A7X92Q", receiverName: "Stop 1", deliveryAddress: { fullAddress: "742 Evergreen Terrace", city: "Springfield" } },
            { _id: "STOP2-B8Y33R", receiverName: "Stop 2", deliveryAddress: { fullAddress: "308 Negra Arroyo Lane", city: "Albuquerque" } },
            { _id: "STOP3-C9Z44S", receiverName: "Stop 3", deliveryAddress: { fullAddress: "31 Spooner Street", city: "Quahog" } }
          ];
        }

        // CRITICAL LIFO LOGIC: Reverse the array so last delivery is loaded first.
        const reversedOrders = [...orders].reverse();
        
        const initialLoadPlan: LoadItem[] = reversedOrders.map((order, index) => ({
          ...order,
          isLoaded: false,
          loadSequence: index + 1 // 1-based sequence
        }));

        setLoadPlan(initialLoadPlan);
        setLoadedItems({});
      } catch (error) {
        console.error("Failed to fetch manifest", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssignedOrders();
  }, [router]);

  const toggleLoaded = (id: string) => {
    setLoadedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const allLoaded = loadPlan.length > 0 && loadPlan.every(item => !!loadedItems[item._id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-medium animate-pulse">Generating Load Manifest...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-32">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-30 px-6 py-4 flex items-center gap-4 shadow-md">
        <Link href="/agent" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Load Manifest</h1>
          <p className="text-xs text-indigo-400 font-bold flex items-center gap-1 mt-0.5 uppercase tracking-widest">
            <ListOrdered className="w-3.5 h-3.5" /> LIFO Protocol Active
          </p>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-lg mx-auto mt-2">
        {/* Warning Banner */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-8 shadow-lg shadow-amber-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-black text-amber-500 text-sm tracking-wide uppercase">Reverse Loading Required</h3>
              <p className="text-amber-500/90 text-xs mt-1.5 leading-relaxed font-medium">
                Load boxes exactly in this order. The first box loaded will be placed at the back of the truck, ensuring the first delivery is accessible at the front.
              </p>
            </div>
          </div>
        </div>

        {/* Load Plan List */}
        <div className="space-y-3">
          {loadPlan.map((item) => {
            const isLoaded = !!loadedItems[item._id];
            
            return (
              <div 
                key={item._id}
                onClick={() => toggleLoaded(item._id)}
                className={`
                  relative p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden
                  ${isLoaded 
                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]' 
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-xl'}
                `}
              >
                {isLoaded && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -translate-y-10 translate-x-10 pointer-events-none"></div>
                )}
                
                <div className="flex items-center gap-4 relative z-10">
                  {/* Sequence Indicator */}
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shrink-0 transition-all duration-300
                    ${isLoaded ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-800 text-slate-400'}
                  `}>
                    {isLoaded ? <CheckCircle className="w-6 h-6 animate-in zoom-in" /> : item.loadSequence}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`font-mono text-xs font-bold ${isLoaded ? 'text-emerald-400' : 'text-indigo-400'}`}>
                        {item._id.substring(0, 8).toUpperCase()}
                      </p>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isLoaded ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                        {isLoaded ? 'Loaded' : 'Pending'}
                      </span>
                    </div>
                    <h4 className={`font-bold truncate text-sm md:text-base ${isLoaded ? 'text-emerald-50' : 'text-white'}`}>
                      {item.receiverName || "Unknown Receiver"}
                    </h4>
                    <div className={`flex items-center gap-1.5 mt-1 text-xs truncate font-medium ${isLoaded ? 'text-emerald-200/70' : 'text-slate-500'}`}>
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.deliveryAddress?.fullAddress || item.deliveryAddress?.city || "Address unavailable"}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent z-40">
        <div className="max-w-lg mx-auto">
          {allLoaded ? (
            <a 
              href="/agent"
              className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-3 animate-in slide-in-from-bottom-2"
            >
              <Truck className="w-6 h-6 animate-pulse" />
              Start Delivery Route
            </a>
          ) : (
            <button 
              disabled
              className="w-full h-16 rounded-2xl bg-slate-900 text-slate-600 font-bold text-sm uppercase tracking-widest border-2 border-slate-800 cursor-not-allowed flex items-center justify-center gap-3 transition-colors"
            >
              <Package className="w-5 h-5" />
              Load All Packages To Start
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
