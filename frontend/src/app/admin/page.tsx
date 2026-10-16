"use client";

import { Package, Truck, CheckCircle, Clock, Loader2, LayoutDashboard, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import axios from 'axios';

interface DashboardStats {
  totalOrders: number;
  pendingPickups: number;
  inTransit: number;
  outForDelivery: number;
  delivered: number;
  revenue?: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingPickups: 0,
    inTransit: 0,
    outForDelivery: 0,
    delivered: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      let res;
      try {
        res = await apiClient.get('/orders/stats/dashboard');
      } catch (gwErr) {
        // Fallback to direct Order Service port 4004
        const directUrl = (process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:4004') + '/api/orders/stats/dashboard';
        res = await axios.get(directUrl);
      }

      const data = res.data?.data || res.data || {};
      setStats({
        totalOrders: Number(data.totalOrders) || 0,
        pendingPickups: Number(data.pendingPickups) || 0,
        inTransit: Number(data.inTransit) || 0,
        outForDelivery: Number(data.outForDelivery) || 0,
        delivered: Number(data.delivered) || 0,
        revenue: Number(data.revenue) || 0,
      });
    } catch (err) {
      console.error("Failed to fetch dashboard stats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-indigo-500" />
            Dashboard
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Clean and minimalist operations overview</p>
        </div>
        <button
          onClick={fetchDashboardStats}
          disabled={loading}
          className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
          title="Refresh Dashboard Stats"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Orders" value={stats.totalOrders} icon={Package} color="text-indigo-400" bg="bg-indigo-500/20" loading={loading} />
        <StatCard title="Pending Pickups" value={stats.pendingPickups} icon={Clock} color="text-amber-400" bg="bg-amber-500/20" loading={loading} />
        <StatCard title="In Transit" value={stats.inTransit} icon={Truck} color="text-blue-400" bg="bg-blue-500/20" loading={loading} />
        <StatCard title="Delivered" value={stats.delivered} icon={CheckCircle} color="text-emerald-400" bg="bg-emerald-500/20" loading={loading} />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg, loading }: any) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">{title}</p>
          <h3 className="text-4xl font-bold text-white">
            {loading ? <Loader2 className="w-8 h-8 animate-spin text-slate-500" /> : Number(value || 0).toLocaleString()}
          </h3>
        </div>
        <div className={`p-3 rounded-xl ${bg} ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
