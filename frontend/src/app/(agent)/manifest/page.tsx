"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation, Truck, ClipboardList } from "lucide-react";

export default function AgentManifestBasePage() {
  const router = useRouter();
  const [manifestId, setManifestId] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manifestId.trim()) {
      router.push(`/manifest/${manifestId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 relative">
      <div className="absolute top-0 inset-x-0 h-64 bg-primary rounded-b-[3rem] shadow-xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl z-10 border border-slate-100 dark:border-slate-800">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <ClipboardList className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100 mb-2">Agent Delivery Manifest</h1>
        <p className="text-slate-500 text-center mb-8 font-medium">Load your daily route and LIFO schedule.</p>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Manifest ID</label>
            <input 
              type="text" 
              placeholder="Enter ID..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              value={manifestId}
              onChange={(e) => setManifestId(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30 flex justify-center items-center gap-2">
            <Truck className="w-5 h-5" />
            Load Manifest
          </button>
        </form>
      </div>
    </div>
  );
}
