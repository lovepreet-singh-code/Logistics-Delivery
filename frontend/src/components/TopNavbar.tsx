"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, LogOut, User, CheckCircle2, Package, Truck, Trash2, Check } from "lucide-react";

export default function TopNavbar() {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/";
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
      <div className="flex items-center gap-4 ml-auto relative">
        
        {/* Notifications */}
        <div ref={dropdownRef} className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-sm focus:outline-none"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm">
              3
            </span>
          </button>

          {/* Dropdown Menu */}
          {showNotifications && (
            <div className="absolute top-12 right-0 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800">Notifications</h3>
                <span className="text-xs text-indigo-600 font-medium cursor-pointer hover:underline">Mark all as read</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                <div className="p-4 hover:bg-slate-50 transition-colors flex gap-3 opacity-100 group relative cursor-default">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 pr-10">
                    <p className="text-sm font-semibold text-slate-800">Parcel Picked Up</p>
                    <p className="text-xs text-slate-500 mt-0.5">Your package #60d5ec has been picked up by the agent.</p>
                    <p className="text-[10px] text-slate-400 mt-1">10 mins ago</p>
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Mark as read"><Check className="w-4 h-4" /></button>
                    <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="p-4 hover:bg-slate-50 transition-colors flex gap-3 opacity-100 group relative cursor-default">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 pr-10">
                    <p className="text-sm font-semibold text-slate-800">Delivery Expected Today</p>
                    <p className="text-xs text-slate-500 mt-0.5">Your package is out for delivery and will arrive by 5 PM.</p>
                    <p className="text-[10px] text-slate-400 mt-1">1 hour ago</p>
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Mark as read"><Check className="w-4 h-4" /></button>
                    <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="p-4 hover:bg-slate-50 transition-colors flex gap-3 opacity-60 group relative cursor-default">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1 pr-10">
                    <p className="text-sm font-semibold text-slate-800">Booking Confirmed</p>
                    <p className="text-xs text-slate-500 mt-0.5">Your booking for #59c4fa was successful.</p>
                    <p className="text-[10px] text-slate-400 mt-1">Yesterday</p>
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-slate-50 text-center text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer border-t border-slate-100">
                View All Activity
              </div>
            </div>
          )}
        </div>

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
