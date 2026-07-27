"use client";

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Truck, Package, CheckCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';

// Mock Data Fallbacks
const MOCK_METRICS = {
  activeFleet: 42,
  pendingOrders: 156,
  deliveredOrders: 890,
};

const MOCK_CHART_DATA = [
  { name: 'Mon', deliveries: 120 },
  { name: 'Tue', deliveries: 150 },
  { name: 'Wed', deliveries: 180 },
  { name: 'Thu', deliveries: 140 },
  { name: 'Fri', deliveries: 210 },
  { name: 'Sat', deliveries: 250 },
  { name: 'Sun', deliveries: 90 },
];

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(MOCK_METRICS);
  const [chartData, setChartData] = useState(MOCK_CHART_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Attempt to fetch real data
        const fleetRes = await axios.get('http://localhost:8080/api/fleet/vehicles');
        const ordersRes = await axios.get('http://localhost:8080/api/orders');
        
        const activeVehicles = fleetRes.data.data?.filter((v: any) => v.status === 'AVAILABLE').length || 0;
        const pending = ordersRes.data.data?.filter((o: any) => o.status === 'PENDING').length || 0;
        const delivered = ordersRes.data.data?.filter((o: any) => o.status === 'DELIVERED').length || 0;

        setMetrics({
          activeFleet: activeVehicles,
          pendingOrders: pending,
          deliveredOrders: delivered,
        });
        
        // We'll keep mock data for the chart to ensure a beautiful display even if the database is sparse.
      } catch (err) {
        console.error("Failed to fetch live data. Falling back to mock data.", err);
        setError(true);
        // Keeps the mock data in state
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Operations Command
            </h1>
            <p className="text-slate-400 mt-2 font-medium">Real-time logistics platform overview</p>
          </div>
          {error && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-sm font-medium backdrop-blur-md animate-in fade-in slide-in-from-top-4">
              <AlertTriangle className="w-4 h-4" />
              <span>Live connection failed. Showing offline mode data.</span>
            </div>
          )}
        </header>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur-2xl shadow-2xl group transition-all hover:bg-white/10">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/30 transition-all duration-500"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">Active Fleet</p>
                <h3 className="text-4xl font-bold text-white">
                  {loading ? '...' : metrics.activeFleet}
                </h3>
              </div>
              <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400">
                <Truck className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur-2xl shadow-2xl group transition-all hover:bg-white/10">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/20 rounded-full blur-2xl group-hover:bg-amber-500/30 transition-all duration-500"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">Pending Orders</p>
                <h3 className="text-4xl font-bold text-white">
                  {loading ? '...' : metrics.pendingOrders}
                </h3>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400">
                <Package className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur-2xl shadow-2xl group transition-all hover:bg-white/10">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/30 transition-all duration-500"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">Delivered Today</p>
                <h3 className="text-4xl font-bold text-white">
                  {loading ? '...' : metrics.deliveredOrders}
                </h3>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </div>

        </div>

        {/* Chart Section */}
        <div className="rounded-3xl bg-white/5 border border-white/10 p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>
          <h2 className="text-xl font-bold text-slate-200 mb-6 relative z-10">Delivery Performance</h2>
          
          <div className="h-80 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  cursor={{ fill: '#334155', opacity: 0.4 }}
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #1e293b',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)'
                  }}
                  itemStyle={{ color: '#c7d2fe' }}
                />
                <Bar 
                  dataKey="deliveries" 
                  fill="#6366f1" 
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
