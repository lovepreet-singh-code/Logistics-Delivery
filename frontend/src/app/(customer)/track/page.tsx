"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Package, Map } from "lucide-react";

export default function TrackBasePage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId.trim()) {
      router.push(`/track/${orderId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg glass rounded-3xl p-8 md:p-12 shadow-2xl text-center bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
        <Package className="w-16 h-16 text-primary mx-auto mb-6 opacity-90" />
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">Customer Tracking</h1>
        <p className="text-slate-500 mb-8 font-medium">Enter your Order ID to see real-time status and delivery location.</p>
        
        <form onSubmit={handleSearch} className="relative">
          <input 
            type="text" 
            placeholder="e.g. 6696a..."
            className="w-full pl-6 pr-16 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-primary transition-all text-lg"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            required
          />
          <button type="submit" className="absolute right-2 top-2 bottom-2 aspect-square bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center shadow-md">
            <Search className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
}
