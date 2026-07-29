"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Route,
  ScanBarcode,
  IndianRupee,
  User as UserIcon,
} from "lucide-react";

export default function AgentLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/agent", icon: Home },
    { name: "Routes", href: "/agent/routes", icon: Route },
    // Spacer for FAB symmetry (optional placeholder if needed)
    { name: "Earnings", href: "/agent/history", icon: IndianRupee },
    { name: "Profile", href: "/agent/profile", icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500">
      {/* Mobile-First Container */}
      <div className="max-w-md mx-auto h-screen bg-slate-900 shadow-2xl relative overflow-hidden flex flex-col border-x border-slate-800">
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto pb-24 relative z-0 no-scrollbar">
          {children}
        </div>

        {/* Floating Action Button (FAB) */}
        <button className="absolute bottom-24 right-6 w-14 h-14 bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(99,102,241,0.4)] z-30 transition-transform hover:scale-105 active:scale-95">
          <ScanBarcode className="w-6 h-6" />
        </button>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 pb-safe z-40">
          <div className="flex justify-between items-center px-6 py-4">
            {navItems.map((item, index) => {
              // Exact match for Home, prefix match for others to keep active state if nested
              const isActive = item.href === "/agent" ? pathname === item.href : pathname.startsWith(item.href);
              
              return (
                <React.Fragment key={item.name}>
                  {index === 2 && <div className="w-12"></div> /* Spacer for FAB */}
                  <Link href={item.href} className={`flex flex-col items-center gap-1 group transition-colors ${isActive ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"}`}>
                    <div className={`p-2 rounded-xl transition-transform group-active:scale-95 ${isActive ? "bg-indigo-500/20" : ""}`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold">{item.name}</span>
                  </Link>
                </React.Fragment>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
