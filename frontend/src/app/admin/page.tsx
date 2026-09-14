"use client";

import { Package, Truck, CheckCircle, Clock, Loader2, LayoutDashboard } from 'lucide-react';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/orders');
        setOrders(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch orders", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const totalOrders = orders.length;
  const pendingDispatch = orders.filter(o => o.status === 'ORDER_PLACED' || o.status === 'PENDING').length;
  const outForDelivery = orders.filter(o => o.status === 'OUT_FOR_DELIVERY').length;
  const delivered = orders.filter(o => o.status === 'DELIVERED').length;

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
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Orders" value={totalOrders} icon={Package} color="text-indigo-400" bg="bg-indigo-500/20" loading={loading} />
        <StatCard title="Pending Dispatch" value={pendingDispatch} icon={Clock} color="text-amber-400" bg="bg-amber-500/20" loading={loading} />
        <StatCard title="Out for Delivery" value={outForDelivery} icon={Truck} color="text-blue-400" bg="bg-blue-500/20" loading={loading} />
        <StatCard title="Delivered" value={delivered} icon={CheckCircle} color="text-emerald-400" bg="bg-emerald-500/20" loading={loading} />
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
            {loading ? <Loader2 className="w-8 h-8 animate-spin text-slate-500" /> : value}
          </h3>
        </div>
        <div className={`p-3 rounded-xl ${bg} ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
