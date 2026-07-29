"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Map, Truck, Package, LogOut, Search, 
  Users, UserCog, UserCheck, Warehouse, Navigation, 
  MapPin, BarChart3, PieChart, Settings, SearchIcon,
  Bell, FileText, Activity
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleSignOut = () => {
    // Clear all potential auth data
    localStorage.removeItem('adminToken');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    
    // Clear cookies
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "adminToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    // Force full window refresh to re-run middleware checks
    window.location.href = '/';
  };
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col md:flex-row font-sans selection:bg-indigo-500/30">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-20">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
             <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Admin Panel</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-2 px-4">Core</div>
          <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors group">
            <LayoutDashboard className="w-5 h-5 group-hover:text-indigo-400" />
            <span className="font-medium text-sm">Dashboard</span>
          </Link>
          <Link href="/admin/orders" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors group">
            <Package className="w-5 h-5 group-hover:text-indigo-400" />
            <span className="font-medium text-sm">Orders</span>
          </Link>
          <Link href="/admin/customers" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors group">
            <Users className="w-5 h-5 group-hover:text-indigo-400" />
            <span className="font-medium text-sm">Customers</span>
          </Link>

          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6 px-4">Operations</div>
          <Link href="/admin/fleet" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors group">
            <Truck className="w-5 h-5 group-hover:text-amber-400" />
            <span className="font-medium text-sm">Vehicles</span>
          </Link>
          <Link href="/admin/hubs" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors group">
            <Map className="w-5 h-5 group-hover:text-amber-400" />
            <span className="font-medium text-sm">Hubs</span>
          </Link>
          <Link href="/admin/agents" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors group">
            <UserCheck className="w-5 h-5 group-hover:text-amber-400" />
            <span className="font-medium text-sm">Delivery Agents</span>
          </Link>
          <Link href="/admin/managers" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors group">
            <UserCog className="w-5 h-5 group-hover:text-amber-400" />
            <span className="font-medium text-sm">Managers</span>
          </Link>
          <Link href="/admin/warehouses" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors group">
            <Warehouse className="w-5 h-5 group-hover:text-amber-400" />
            <span className="font-medium text-sm">Warehouses</span>
          </Link>
          <Link href="/admin/franchises" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors group">
            <MapPin className="w-5 h-5 group-hover:text-amber-400" />
            <span className="font-medium text-sm">Franchises</span>
          </Link>

          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6 px-4">Analytics & Tools</div>
          <Link href="/admin/planning" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors group">
            <Navigation className="w-5 h-5 group-hover:text-indigo-400" />
            <span className="font-medium text-sm">Planning</span>
          </Link>
          <Link href="/admin/tracking" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors group">
            <MapPin className="w-5 h-5 group-hover:text-indigo-400" />
            <span className="font-medium text-sm">Tracking</span>
          </Link>
          <Link href="/admin/reports" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors group">
            <BarChart3 className="w-5 h-5 group-hover:text-indigo-400" />
            <span className="font-medium text-sm">Reports</span>
          </Link>
          <Link href="/admin/analytics" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors group">
            <PieChart className="w-5 h-5 group-hover:text-indigo-400" />
            <span className="font-medium text-sm">Analytics</span>
          </Link>
          <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors group mt-4">
            <Settings className="w-5 h-5 group-hover:text-indigo-400" />
            <span className="font-medium text-sm">Settings</span>
          </Link>
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <button 
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors w-full group"
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto bg-slate-950 relative flex flex-col">
        {/* Top Navbar */}
        <header className="h-20 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between">
          <div className="relative w-full max-w-lg hidden md:block">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search Tracking ID, Customer, or Vehicle..." 
              className="w-full pl-12 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-200 placeholder-slate-500 shadow-inner transition-all"
            />
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <button className="p-2.5 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-400 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-800"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <span className="text-sm font-bold text-indigo-400">A</span>
            </div>
          </div>
        </header>

        <div className="flex-1 relative">
          {children}
        </div>
      </main>
    </div>
  );
}
