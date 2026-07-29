"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, LogOut, User } from "lucide-react";

export default function TopNavbar() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/");
  };

  return (
    <div className="h-20 sticky top-0 z-30 w-full bg-slate-50/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between">
      
      {/* Search Bar */}
      <div className="relative w-full max-w-md hidden md:block">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search Tracking ID, Orders, or Help..." 
          className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-700 placeholder-slate-400 shadow-sm transition-all"
        />
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4 ml-auto">
        
        {/* Notifications */}
        <button className="relative p-2.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-sm">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        </button>

        <div className="w-px h-8 bg-slate-200 mx-2"></div>

        {/* Profile */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center overflow-hidden shadow-inner">
            <User className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-sm font-bold text-slate-900">Customer</p>
            <p className="text-xs text-slate-500">Premium Account</p>
          </div>
        </div>

        {/* Logout (Mobile mainly, or quick access) */}
        <button 
          onClick={handleLogout}
          className="p-2.5 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors ml-2"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
