"use client";

import { Truck, Package, CheckCircle, AlertTriangle, Users, IndianRupee, XCircle, Activity, MapPin, ChevronRight, Calendar, Navigation, Loader2 } from 'lucide-react';
import AdminChart from './AdminChart';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';

// Dynamically import the map so it only runs on the client
const AdminMap = dynamic(() => import('@/components/AdminMap'), {
  ssr: false,
  loading: () => <div className="w-full h-[400px] bg-slate-900/50 rounded-3xl animate-pulse"></div>
});

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [pendingPickups, setPendingPickups] = useState(0);
  const [activeFleet, setActiveFleet] = useState(0);

  const [recentOrdersList, setRecentOrdersList] = useState<any[]>([]);
  const [unassignedOrdersList, setUnassignedOrdersList] = useState<any[]>([]);
  const [listsLoading, setListsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setListsLoading(true);
        
        // Fetch stats
        const statsRes = await apiClient.get('/analytics/dashboard-stats');
        setStats(statsRes.data.data);
        setPendingPickups(statsRes.data.data.pendingPickups || 0);
        setActiveFleet(statsRes.data.data.activeDrivers || 0);
        
        // Fetch recent and unassigned orders
        const [recentRes, unassignedRes] = await Promise.all([
          apiClient.get('/orders/recent'),
          apiClient.get('/orders/unassigned')
        ]);
        
        setRecentOrdersList(recentRes.data.data || []);
        setUnassignedOrdersList(unassignedRes.data.data || []);
        
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
        setError(true);
      } finally {
        setLoading(false);
        setListsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const kpis = [
    { title: "Total Customers", value: "1,245", icon: Users, color: "text-indigo-400", bg: "bg-indigo-500/20", glow: "group-hover:bg-indigo-500/20" },
    { title: "Total Revenue", value: stats?.revenueTotal ? `?${stats.revenueTotal.toLocaleString()}` : "?0", icon: IndianRupee, color: "text-emerald-400", bg: "bg-emerald-500/20", glow: "group-hover:bg-emerald-500/20" },
    { title: "Active Drivers", value: activeFleet.toString(), icon: Truck, color: "text-blue-400", bg: "bg-blue-500/20", glow: "group-hover:bg-blue-500/20" },
    { title: "Pending Pickups", value: pendingPickups.toString(), icon: Package, color: "text-amber-400", bg: "bg-amber-500/20", glow: "group-hover:bg-amber-500/20" },
    { title: "Success Rate", value: stats?.successRate ? `${stats.successRate}%` : "0%", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/20", glow: "group-hover:bg-emerald-500/20" }
  ];

  const recentActivities = [
    { time: "16:20", text: "Driver Rahul (V-101) arrived at Hub", type: "hub" },
    { time: "16:15", text: "Order LG-9912 marked as Delivered", type: "success" },
    { time: "16:05", text: "New Order LG-9925 created by John Doe", type: "order" },
    { time: "15:50", text: "Driver Priya (V-103) started transit", type: "transit" },
    { time: "15:30", text: "Vehicle V-102 reported maintenance", type: "alert" },
    { time: "15:15", text: "Order LG-9888 picked up from sender", type: "pickup" },
  ];

  return (
    <div className="p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1600px] mx-auto space-y-8">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-indigo-500" />
            Operations Command Center
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Real-time logistics platform overview & live tracking</p>
        </div>
        {error && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-sm font-medium backdrop-blur-md">
            <AlertTriangle className="w-4 h-4" />
            <span>Live connection failed. Using cached metrics.</span>
          </div>
        )}
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg group transition-all hover:bg-slate-800/80 hover:-translate-y-1">
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl transition-all duration-500 opacity-20 ${kpi.glow}`}></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{kpi.title}</p>
                <h3 className="text-2xl font-bold text-white">{kpi.value}</h3>
              </div>
              <div className={`p-2.5 rounded-xl ${kpi.bg} ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {/* Main Left Column */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-6">
          
          {/* Live Map */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl relative overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-400" /> Live Fleet & Topology
              </h2>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Live</span>
              </div>
            </div>
            <AdminMap />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Chart Section */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
              <h2 className="text-xl font-bold text-slate-200 mb-6">Delivery Performance</h2>
              <AdminChart />
            </div>

            {/* Recent Orders Table */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 flex flex-col shadow-xl overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                <h2 className="text-xl font-bold text-slate-200">Recent Dispatch</h2>
                <Link href="/admin/orders" className="text-indigo-400 text-sm font-bold hover:text-indigo-300">View All</Link>
              </div>
              <div className="overflow-x-auto flex-1 p-2">
                {listsLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-800/50">
                        <th className="p-3 pl-4">Order / Customer</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Driver</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {recentOrdersList.map((order, i) => (
                        <tr key={order._id || i} className="hover:bg-slate-800/30 transition-colors group">
                          <td className="p-3 pl-4">
                            <div className="font-mono font-bold text-slate-300 text-sm">{order.awb || order._id?.slice(-8).toUpperCase()}</div>
                            <div className="text-xs text-slate-500">{order.customerId?.slice(-6) || 'Unknown'}</div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              order.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              order.status === 'PENDING' || order.status === 'ORDER_PLACED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            }`}>
                              {(order.status || 'UNKNOWN').replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="text-sm font-medium text-slate-300">
                              {order.routing?.agentId ? 'Assigned' : 'Unassigned'}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {recentOrdersList.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-6 text-center text-slate-500">No recent orders found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Planning Quick-View */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 flex flex-col shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-amber-500" /> Planning
              </h2>
              <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase rounded-md">{unassignedOrdersList.length} Unassigned</span>
            </div>
            <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
              {listsLoading ? (
                <div className="flex justify-center items-center h-20">
                  <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                </div>
              ) : unassignedOrdersList.length > 0 ? (
                unassignedOrdersList.map(order => (
                  <div key={order._id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between group">
                    <div>
                      <div className="font-mono font-bold text-slate-300 text-sm">{order.awb || order._id?.slice(-8).toUpperCase()}</div>
                      <div className="text-xs text-slate-500 mt-1">To: {order.deliveryAddress?.pinCode || 'Unknown'}</div>
                    </div>
                    <Link href={`/admin/orders`} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      Dispatch
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-slate-500 py-4">All orders assigned.</div>
              )}
            </div>
          </div>

          {/* Live Activity Feed */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden flex flex-col max-h-[500px]">
            <div className="p-6 border-b border-slate-800 bg-slate-900/50">
              <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" /> Live Feed
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Vertical line */}
              <div className="relative">
                <div className="absolute left-3.5 top-2 bottom-2 w-px bg-slate-800"></div>
                
                <div className="space-y-8">
                  {recentActivities.map((act, i) => (
                    <div key={i} className="relative flex gap-4 animate-in slide-in-from-right-4 fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                      <div className={`relative z-10 w-7 h-7 rounded-full border-2 border-slate-900 flex items-center justify-center shrink-0 shadow-lg ${
                        act.type === 'success' ? 'bg-emerald-500' :
                        act.type === 'alert' ? 'bg-red-500' :
                        act.type === 'order' ? 'bg-amber-500' :
                        act.type === 'transit' ? 'bg-blue-500' :
                        'bg-indigo-500'
                      }`}>
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500 mb-0.5">{act.time}</p>
                        <p className="text-sm font-medium text-slate-300 leading-snug">{act.text}</p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="relative flex gap-4 opacity-50">
                    <div className="relative z-10 w-7 h-7 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center shrink-0">
                       <div className="w-1.5 h-1.5 bg-slate-600 rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500 italic">Waiting for new events...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
