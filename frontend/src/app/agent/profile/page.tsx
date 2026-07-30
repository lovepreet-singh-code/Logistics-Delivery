"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User as UserIcon, LogOut, Star, Truck, Award, Settings, FileText, HelpCircle } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();

  const [agentName, setAgentName] = useState<string>("Loading...");
  const [agentId, setAgentId] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("name") || "Delivery Partner";
      const storedId = localStorage.getItem("agentId") || "";
      console.log("Fetched from localStorage -> Name:", storedName, "ID:", storedId);
      
      setAgentName(storedName);
      setAgentId(storedId);
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.clear();
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/";
    }
  };

  return (
    <>
      <div className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 shrink-0 z-20 sticky top-0 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-indigo-500" />
          My Profile
        </h1>
      </div>

      <div className="px-4 py-8 pb-32">
        {/* Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-xl relative overflow-hidden mb-6">
           <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
           
           <div className="flex items-center gap-5 relative z-10">
               <div className="w-20 h-20 rounded-full bg-slate-800 border-4 border-slate-950 flex items-center justify-center shadow-xl">
                 <span className="text-3xl font-black text-slate-400">
                    {agentName !== "Loading..." ? agentName.charAt(0).toUpperCase() : ""}
                 </span>
              </div>
              <div>
                 <h2 className="text-2xl font-black text-white leading-tight">{agentName}</h2>
                 <p className="text-sm font-mono text-indigo-400 mt-1">ID: {agentId ? `AGT-${agentId.slice(-6).toUpperCase()}` : "AGT-..."}</p>
                 <div className="flex items-center gap-1 mt-2 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-md w-max">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-bold text-amber-500">4.92 Rating</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Vehicle Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-xl mb-6 flex gap-4 items-center">
           <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center shrink-0">
              <Truck className="w-7 h-7 text-indigo-400" />
           </div>
           <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Assigned Vehicle</p>
              <h3 className="text-lg font-bold text-white">Tata Ace (V-101)</h3>
              <p className="text-xs font-mono text-slate-400 mt-1">Plate: MH 02 AB 1234</p>
           </div>
        </div>

        {/* Menu Items */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-2 shadow-xl mb-8 space-y-1">
           <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-3">
                 <Award className="w-5 h-5 text-slate-400" />
                 <span className="font-bold text-slate-300">Achievements</span>
              </div>
              <span className="text-slate-600">→</span>
           </button>
           <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-3">
                 <FileText className="w-5 h-5 text-slate-400" />
                 <span className="font-bold text-slate-300">Duty Logs</span>
              </div>
              <span className="text-slate-600">→</span>
           </button>
           <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-3">
                 <Settings className="w-5 h-5 text-slate-400" />
                 <span className="font-bold text-slate-300">App Settings</span>
              </div>
              <span className="text-slate-600">→</span>
           </button>
           <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-3">
                 <HelpCircle className="w-5 h-5 text-slate-400" />
                 <span className="font-bold text-slate-300">Support & Help</span>
              </div>
              <span className="text-slate-600">→</span>
           </button>
        </div>

        {/* Logout Button */}
        <button 
           onClick={handleLogout}
           className="w-full py-5 bg-red-950/20 hover:bg-red-900/30 active:bg-red-900/50 border-2 border-red-500/50 hover:border-red-500 text-red-500 hover:text-red-400 rounded-2xl font-black text-base uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg shadow-red-500/10"
        >
           <LogOut className="w-5 h-5" />
           Logout
        </button>
      </div>
    </>
  );
}
