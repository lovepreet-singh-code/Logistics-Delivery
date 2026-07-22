"use client";

import { useEffect, useState } from "react";
import { apiFleet, apiOrder, apiDispatch } from "@/lib/api";
import { Truck, Package, Route, Activity, BarChart3, AlertCircle, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalVehicles: 0,
    availableVehicles: 0,
    ordersPendingRouting: 0,
    ordersRouted: 0,
    activeManifests: 0,
  });
  const [error, setError] = useState("");

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError("");
      
      // We wrap in Promise.allSettled to handle partial failures gracefully if some services are down
      const [fleetRes, ordersPendingRes, ordersRoutedRes, manifestsRes] = await Promise.allSettled([
        apiFleet.get("/"), // Assuming / returns all vehicles (would need specific endpoint in production)
        apiOrder.get("?status=PENDING"),
        apiOrder.get("?status=ROUTED"),
        apiDispatch.get("/manifests?status=ACTIVE")
      ]);

      setMetrics({
        totalVehicles: fleetRes.status === "fulfilled" ? fleetRes.value.data.count || 0 : 0,
        availableVehicles: fleetRes.status === "fulfilled" ? 
          (fleetRes.value.data.data?.filter((v: any) => v.status === "AVAILABLE").length || 0) : 0,
        ordersPendingRouting: ordersPendingRes.status === "fulfilled" ? ordersPendingRes.value.data.count || 0 : 0,
        ordersRouted: ordersRoutedRes.status === "fulfilled" ? ordersRoutedRes.value.data.count || 0 : 0,
        activeManifests: manifestsRes.status === "fulfilled" ? manifestsRes.value.data.count || 0 : 0,
      });

    } catch (err: any) {
      setError("Failed to load dashboard metrics. Ensure all microservices are running.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Optional polling could go here
  }, []);

  const MetricCard = ({ title, value, icon: Icon, trend, colorClass }: any) => (
    <div className="glass rounded-2xl p-6 shadow-xl border border-slate-100 dark:border-slate-800 transform transition-all hover:-translate-y-1 hover:shadow-2xl bg-white/80 dark:bg-slate-900/80">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-3 rounded-xl", colorClass)}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className="text-sm font-medium text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">
            {trend}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-slate-500 dark:text-slate-400 font-medium mb-1">{title}</h3>
        <p className="text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      
      {/* Topbar */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 text-primary">
            <Activity className="w-8 h-8" />
            <h1 className="text-xl font-bold tracking-wider uppercase">Central Command</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={fetchMetrics}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Refresh Data"
            >
              <RefreshCcw className={cn("w-5 h-5 text-slate-500", loading && "animate-spin")} />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 border-2 border-white dark:border-slate-800 shadow-md"></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Platform Overview</h2>
            <p className="text-slate-500">Real-time metrics from microservices.</p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          
          <MetricCard 
            title="Available Fleet" 
            value={loading ? "..." : metrics.availableVehicles} 
            icon={Truck}
            colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
            trend="Active"
          />
          
          <MetricCard 
            title="Orders Pending" 
            value={loading ? "..." : metrics.ordersPendingRouting} 
            icon={Package}
            colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400"
          />

          <MetricCard 
            title="Ready for Dispatch" 
            value={loading ? "..." : metrics.ordersRouted} 
            icon={Route}
            colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400"
          />

          <MetricCard 
            title="Active Manifests" 
            value={loading ? "..." : metrics.activeManifests} 
            icon={BarChart3}
            colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400"
            trend="En Route"
          />
          
        </div>

        {/* Dummy Chart Section for Aesthetics */}
        <div className="glass rounded-3xl p-8 border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 h-96 flex flex-col items-center justify-center text-slate-400 shadow-inner">
          <BarChart3 className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg font-medium">Analytics Engine Visualization Placeholder</p>
          <p className="text-sm">Historical dispatch and routing efficiency charts will appear here.</p>
        </div>

      </main>
    </div>
  );
}
