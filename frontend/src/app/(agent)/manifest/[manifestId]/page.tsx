"use client";

import { useEffect, useState } from "react";
import { Package, MapPin, CheckCircle, Truck, Info, Navigation, ArrowRight } from "lucide-react";
import { apiDispatch } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function AgentManifestPage({ params }: { params: { manifestId: string } }) {
  const { manifestId } = params;
  const [manifest, setManifest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"LIFO" | "ROUTE">("LIFO");
  const [completedStops, setCompletedStops] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchManifest(manifestId);
  }, [manifestId]);

  const fetchManifest = async (id: string) => {
    try {
      setLoading(true);
      const res = await apiDispatch.get(`/manifests/${id}`);
      setManifest(res.data.data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Manifest not found");
      setManifest(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleStopCompletion = (orderId: string) => {
    const newStops = new Set(completedStops);
    if (newStops.has(orderId)) {
      newStops.delete(orderId);
    } else {
      newStops.add(orderId);
    }
    setCompletedStops(newStops);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !manifest) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center p-6 text-center">
        <Package className="w-16 h-16 text-slate-400 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Manifest Not Found</h2>
        <p className="text-slate-500">{error}</p>
      </div>
    );
  }

  // Pre-calculate LIFO view data (loadingSequence contains orderIds)
  // We need to cross-reference with routeSequence to show lat/lng or just show the ID order
  const totalOrders = manifest.loadingSequence?.length || 0;
  const progress = totalOrders > 0 ? (completedStops.size / totalOrders) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 flex flex-col font-sans pb-20">
      
      {/* Mobile Header */}
      <div className="bg-primary text-white p-6 rounded-b-[2rem] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Truck className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Active Route</h1>
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-md">
              {manifest.status}
            </span>
          </div>
          
          <div className="space-y-1 mb-6">
            <p className="text-primary-foreground/80 text-sm font-medium uppercase tracking-wider">Manifest ID</p>
            <p className="text-lg font-mono font-semibold">{manifest._id}</p>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2 font-medium">
              <span>Progress ({completedStops.size}/{totalOrders})</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2.5 backdrop-blur-sm">
              <div 
                className="bg-white h-2.5 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 mt-6 gap-2">
        <button
          onClick={() => setActiveTab("LIFO")}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl font-semibold transition-all shadow-sm flex items-center justify-center gap-2",
            activeTab === "LIFO" 
              ? "bg-white dark:bg-slate-800 text-primary border-2 border-primary" 
              : "bg-slate-200 dark:bg-slate-800/50 text-slate-500 border-2 border-transparent"
          )}
        >
          <Package className="w-5 h-5" />
          Load Plan (LIFO)
        </button>
        <button
          onClick={() => setActiveTab("ROUTE")}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl font-semibold transition-all shadow-sm flex items-center justify-center gap-2",
            activeTab === "ROUTE" 
              ? "bg-white dark:bg-slate-800 text-primary border-2 border-primary" 
              : "bg-slate-200 dark:bg-slate-800/50 text-slate-500 border-2 border-transparent"
          )}
        >
          <Navigation className="w-5 h-5" />
          Delivery Route
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 px-4 mt-6">
        
        {activeTab === "LIFO" && (
          <div className="animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl flex items-start gap-3 mb-6">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">Load these parcels in the exact order shown. The first item listed goes in FIRST (pushed to the back).</p>
            </div>
            
            <div className="space-y-4">
              {manifest.loadingSequence?.map((orderId: string, index: number) => {
                const isFirstToLoad = index === 0;
                const isLastToLoad = index === totalOrders - 1;
                
                return (
                  <div key={orderId} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 relative overflow-hidden">
                    {/* Visual indicator bar */}
                    <div className={cn(
                      "absolute left-0 top-0 bottom-0 w-2",
                      isFirstToLoad ? "bg-red-500" : isLastToLoad ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"
                    )}></div>
                    
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 ml-2">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-mono text-sm font-semibold truncate w-48 md:w-full">{orderId}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {isFirstToLoad ? "First in van (Back)" : isLastToLoad ? "Last in van (Door)" : "Middle"}
                      </p>
                    </div>
                    
                    <Package className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "ROUTE" && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl flex items-start gap-3 mb-6">
              <Navigation className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">This is your optimized chronological delivery route. Tap complete upon delivery.</p>
            </div>

            <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-[1.4rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              {manifest.routeSequence?.map((stop: any, index: number) => {
                const isCompleted = completedStops.has(stop.orderId);
                
                return (
                  <div key={stop.orderId} className="relative flex items-start group">
                    <div className={cn(
                      "absolute left-[-26px] w-4 h-4 rounded-full border-2 bg-white dark:bg-slate-900 ring-4 ring-white dark:ring-slate-950 transition-colors z-10",
                      isCompleted ? "border-emerald-500 bg-emerald-500" : "border-primary"
                    )}></div>
                    
                    <div className={cn(
                      "flex-1 bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 transition-all",
                      isCompleted ? "opacity-60" : "shadow-md scale-[1.01]"
                    )}>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">Stop {index + 1}</span>
                        {isCompleted && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                      </div>
                      
                      <div className="mb-4">
                        <p className="font-mono text-sm text-slate-600 dark:text-slate-400 mb-2 truncate">ID: {stop.orderId}</p>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span>Lat: {stop.lat.toFixed(4)}, Lng: {stop.lng.toFixed(4)}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleStopCompletion(stop.orderId)}
                        className={cn(
                          "w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors",
                          isCompleted 
                            ? "bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600"
                            : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                        )}
                      >
                        {isCompleted ? "Undo" : "Mark Delivered"}
                        {!isCompleted && <ArrowRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
