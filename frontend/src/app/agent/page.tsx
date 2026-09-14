"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, LogOut, Loader2, Check } from "lucide-react";
import Link from "next/link";
import axios from "axios";

export default function AgentDashboard() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    stops: 0,
    done: 0,
    pending: 0,
    earnings: 0
  });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/");
          return;
        }

        const response = await axios.get("http://localhost:8080/api/orders", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success && Array.isArray(response.data.data)) {
          const allOrders = response.data.data;
          
          const total = allOrders.length;
          const completed = allOrders.filter((o: any) => o.status === 'DELIVERED').length;
          const pending = total - completed;
          const earnings = completed * 50;
          
          setStats({
            stops: total,
            done: completed,
            pending: pending,
            earnings: earnings
          });
        }
      } catch (error) {
        console.error("Failed to fetch agent orders", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("agentId");
    localStorage.removeItem("role");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/";
  };

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
              <span className="text-xl font-black text-white">{loading ? "-" : stats.stops}</span>
            </div>
            <div className="bg-slate-900 border border-emerald-500/30 px-4 py-3 rounded-2xl flex flex-col gap-1 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-emerald-500/5"></div>
              <span className="text-xs text-emerald-500 font-bold uppercase tracking-wider relative z-10">Done</span>
              <span className="text-xl font-black text-emerald-400 relative z-10">{loading ? "-" : stats.done}</span>
            </div>
            <div className="bg-slate-900 border border-amber-500/30 px-4 py-3 rounded-2xl flex flex-col gap-1 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-amber-500/5"></div>
              <span className="text-xs text-amber-500 font-bold uppercase tracking-wider relative z-10">Pending</span>
              <span className="text-xl font-black text-amber-400 relative z-10">{loading ? "-" : stats.pending}</span>
            </div>
            <div className="bg-slate-900 border border-indigo-500/30 px-4 py-3 rounded-2xl flex flex-col gap-1 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-indigo-500/5"></div>
              <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider relative z-10">Earnings</span>
              <span className="text-xl font-black text-indigo-400 relative z-10">₹{loading ? "-" : stats.earnings}</span>
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
        ) : (
          <div className="flex flex-col gap-4">
             <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-3xl p-6 text-center shadow-lg">
                
                {stats.pending === 0 ? (
                  <>
                    <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20 relative">
                      <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
                      <Check className="w-10 h-10 text-white relative z-10" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No pending deliveries right now. You are all caught up!</h3>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-white mb-2">You have {stats.pending} active routes!</h3>
                    <p className="text-sm text-slate-400 mb-6">Before hitting the road, strictly follow the LIFO loading protocol.</p>
                  </>
                )}
                
                <div className="flex flex-col gap-3 mt-6">
                  {stats.pending === 0 ? (
                    <button disabled className="w-full block py-4 bg-slate-700 text-slate-400 rounded-2xl font-black text-sm uppercase tracking-widest transition-all cursor-not-allowed">
                       📦 View Load Plan (LIFO)
                    </button>
                  ) : (
                    <Link href="/agent/manifest" className="w-full block py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all">
                       📦 View Load Plan (LIFO)
                    </Link>
                  )}
                  <Link href="/agent/routes" className="w-full block py-4 bg-slate-900 border border-indigo-500/30 hover:bg-slate-800 text-indigo-400 rounded-2xl font-bold text-sm shadow-lg transition-all">
                     View Active Routes
                  </Link>
                </div>
             </div>
          </div>
        )}
      </div>
    </>
  );
}
