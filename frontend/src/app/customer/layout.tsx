"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  PackagePlus, 
  ListOrdered, 
  MapPin, 
  Menu, 
  X,
  Truck,
  Settings,
  CreditCard,
  BellRing,
  HelpCircle,
  Bookmark,
  LogOut
} from "lucide-react";
import TopNavbar from "@/components/TopNavbar";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/customer", icon: LayoutDashboard, active: true },
    { name: "Book Parcel", href: "/customer/book", icon: PackagePlus, active: true },
    { name: "My Orders", href: "/customer/orders", icon: ListOrdered, active: true },
    { name: "Track Shipment", href: "/customer/track", icon: MapPin, active: true },
  ];

  const upcomingLinks = [
    { name: "Saved Addresses", icon: Bookmark },
    { name: "Invoices", icon: CreditCard },
    { name: "Notifications", icon: BellRing },
    { name: "Support", icon: HelpCircle },
    { name: "Settings", icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-slate-900 text-slate-300
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col border-r border-slate-800 shadow-2xl lg:shadow-none
      `}>
        {/* Logo Area */}
        <div className="h-20 flex items-center px-8 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">LogiCore</span>
          </div>
          <button 
            className="ml-auto lg:hidden text-slate-400 hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-4">Main Menu</div>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium
                  ${isActive 
                    ? 'bg-indigo-500/10 text-indigo-400' 
                    : 'hover:bg-slate-800 hover:text-slate-100'}
                `}
              >
                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                {item.name}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                )}
              </Link>
            );
          })}

          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-8 mb-4 px-4">Preferences (Coming Soon)</div>
          {upcomingLinks.map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-3 px-4 py-3 rounded-xl opacity-50 cursor-not-allowed group font-medium text-slate-500"
            >
              <item.icon className="w-5 h-5" />
              {item.name}
              <span className="ml-auto text-[10px] bg-slate-800 px-2 py-0.5 rounded-full">Soon</span>
            </div>
          ))}
        </nav>

        {/* User / Logout Area */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors group"
          >
            <LogOut className="w-5 h-5 text-slate-500 group-hover:text-red-400 transition-colors" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-50">
        
        {/* Desktop Top Navbar */}
        <div className="hidden lg:block">
          <TopNavbar />
        </div>

        {/* Mobile Header */}
        <header className="h-16 flex items-center justify-between px-4 lg:hidden bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">LogiCore</span>
          </div>
          <button 
            className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8 lg:p-10">
          <div className="max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>

      </main>
    </div>
  );
}
