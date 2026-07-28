import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Map, Truck, Package, LogOut } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link href="/admin/hubs" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
            <Map className="w-5 h-5" />
            <span className="font-medium">Hubs & Topology</span>
          </Link>
          <Link href="/admin/fleet" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
            <Truck className="w-5 h-5" />
            <span className="font-medium">Fleet Management</span>
          </Link>
          <Link href="/admin/orders" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
            <Package className="w-5 h-5" />
            <span className="font-medium">Orders</span>
          </Link>
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors w-full">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto bg-slate-950 relative">
        {children}
      </main>
    </div>
  );
}
