"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, LogOut, CheckCircle, Loader2, Check } from "lucide-react";
import apiClient from "@/lib/apiClient";
import Link from "next/link";

export default function AgentDashboard() {
  const router = useRouter();
  const [activeDeliveries, setActiveDeliveries] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

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

      const [activeRes, statsRes] = await Promise.all([
        apiClient.get("/agent/deliveries/active"),
        apiClient.get("/agent/stats")
      ]);
      
      if (activeRes.data.success) {
        setActiveDeliveries(activeRes.data.data || []);
      }
      
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch agent data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("agentId");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/";
  };

  const pendingCount = activeDeliveries.length;
  const completedCount = stats?.completedToday || 0;
  const earnings = stats?.todayEarnings || 0;
  const distance = stats?.distanceCovered || 0;

  return (
    <>
      {/* Header & Metrics */}
      <div className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 shrink-0 z-20 sticky top-0">
        <header className="px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-500" />
              Agent Portal
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-400 transition-colors bg-slate-900 border border-slate-800 rounded-full"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        {/* Top Summary Metrics */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl flex flex-col gap-1 shadow-sm">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Stops</span>
              <span className="text-xl font-black text-white">{pendingCount + completedCount}</span>
            </div>
            <div className="bg-slate-900 border border-emerald-500/30 px-4 py-3 rounded-2xl flex flex-col gap-1 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-emerald-500/5"></div>
              <span className="text-xs text-emerald-500 font-bold uppercase tracking-wider relative z-10">Done</span>
              <span className="text-xl font-black text-emerald-400 relative z-10">{completedCount}</span>
            </div>
            <div className="bg-slate-900 border border-amber-500/30 px-4 py-3 rounded-2xl flex flex-col gap-1 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-amber-500/5"></div>
              <span className="text-xs text-amber-500 font-bold uppercase tracking-wider relative z-10">Pending</span>
              <span className="text-xl font-black text-amber-400 relative z-10">{pendingCount}</span>
            </div>
            <div className="bg-slate-900 border border-indigo-500/30 px-4 py-3 rounded-2xl flex flex-col gap-1 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-indigo-500/5"></div>
              <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider relative z-10">Earnings</span>
              <span className="text-xl font-black text-indigo-400 relative z-10">₹{earnings}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <p className="text-sm font-medium">Syncing live routes...</p>
          </div>
        ) : pendingCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20 relative">
              <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
              <Check className="w-12 h-12 text-white relative z-10" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">🎉 Great Work!</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              You completed all assigned deliveries today. Take a well-deserved rest!
            </p>
            
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full shadow-inner space-y-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">Today's Summary</h3>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm font-medium">Deliveries</span>
                <span className="text-white font-bold">{completedCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm font-medium">Distance</span>
                <span className="text-white font-bold">{distance} km</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm font-medium">Active Time</span>
                <span className="text-white font-bold">7h 32m</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
             <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-3xl p-6 text-center shadow-lg">
                <h3 className="text-xl font-bold text-white mb-2">You have {pendingCount} active routes!</h3>
                <p className="text-sm text-slate-400 mb-6">Head over to the routes tab to start your deliveries.</p>
                <Link href="/agent/routes" className="w-full block py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-500/25">
                   View Active Routes
                </Link>
             </div>
          </div>
        )}
      </div>
    </>
  );
}
