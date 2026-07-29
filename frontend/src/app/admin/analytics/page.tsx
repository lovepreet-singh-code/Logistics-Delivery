"use client";

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { Activity, IndianRupee, Clock, Package, AlertTriangle } from 'lucide-react';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // In a real scenario, this fetches from /api/analytics/dashboard-stats
    // We mock the response of the aggregation pipeline here
    setTimeout(() => {
      setStats({
        revenueTotal: 1452000,
        successRate: 94.5,
        avgDeliveryTime: 18.5,
        topHubs: [
          { name: "Delhi Central", count: 4500 },
          { name: "Mumbai Hub", count: 3200 },
          { name: "Bangalore Depot", count: 2800 },
          { name: "Chennai Main", count: 2100 },
          { name: "Kolkata Hub", count: 1800 },
        ],
        topDrivers: [
          { name: "Rahul Kumar", deliveries: 125 },
          { name: "Amit Singh", deliveries: 110 },
          { name: "Vikram Das", deliveries: 98 },
        ]
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return <div className="p-8 flex items-center justify-center h-full text-slate-500">Loading Intelligence Engine...</div>;
  }

  const COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#f97316'];

  const pieData = [
    { name: 'Delivered', value: 945 },
    { name: 'Failed/Cancelled', value: 55 }
  ];
  const PIE_COLORS = ['#10b981', '#ef4444'];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-indigo-500" />
            Analytics Engine
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Deep insights and reporting powered by aggregation pipelines.</p>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400"><IndianRupee className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Revenue</p>
              <h3 className="text-3xl font-bold text-white">₹{(stats.revenueTotal).toLocaleString()}</h3>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400"><Package className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Success Rate</p>
              <h3 className="text-3xl font-bold text-white">{stats.successRate}%</h3>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><Clock className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Avg Delivery Time</p>
              <h3 className="text-3xl font-bold text-white">{stats.avgDeliveryTime} hrs</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Hubs Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-slate-200 mb-6">Top Performing Hubs (Volume)</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topHubs} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '12px' }}
                  itemStyle={{ color: '#818cf8' }}
                  cursor={{ fill: '#1e293b' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {stats.topHubs.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Success Rate Pie Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col">
          <h2 className="text-xl font-bold text-slate-200 mb-2">Delivery Success Ratio</h2>
          <div className="flex-1 w-full flex items-center justify-center min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
