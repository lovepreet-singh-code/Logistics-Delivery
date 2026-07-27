"use client";
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

/** 
 * Admin Dashboard - Live API Connected Version
 */
export default function AdminDashboard() {
  const [stats, setStats] = useState({ active: 0, pending: 0, delivered: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Headers for authenticated requests
        const headers = { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // Fetching data from API Gateway
        // Ensure backend microservices are running on 8080
        const [fleetRes, orderRes] = await Promise.all([
          fetch('http://localhost:8080/api/fleet/stats', { headers }).catch(() => ({ json: () => ({ count: 0 }) })),
          fetch('http://localhost:8080/api/orders/stats', { headers }).catch(() => ({ json: () => ({ pending: 0, delivered: 0 }) }))
        ]);

        const fleetData = await fleetRes.json();
        const orderData = await orderRes.json();

        setStats({
          active: fleetData.count || 0,
          pending: orderData.pending || 0,
          delivered: orderData.delivered || 0
        });
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const chartData = [
    { name: 'Active', value: stats.active },
    { name: 'Pending', value: stats.pending },
    { name: 'Delivered', value: stats.delivered },
  ];

  return (
    <div className="p-8 bg-[#0B0E14] min-h-screen text-white font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Operations Command</h1>
        <p className="text-slate-400">Real-time logistics platform overview</p>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-900/20 to-blue-900/10 border border-blue-500/20">
          <p className="text-slate-400 text-sm font-medium">Active Fleet</p>
          <h2 className="text-4xl font-bold mt-2">{loading ? '...' : stats.active}</h2>
        </div>
        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-900/20 to-amber-900/10 border border-amber-500/20">
          <p className="text-slate-400 text-sm font-medium">Pending Orders</p>
          <h2 className="text-4xl font-bold mt-2">{loading ? '...' : stats.pending}</h2>
        </div>
        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-900/20 to-emerald-900/10 border border-emerald-500/20">
          <p className="text-slate-400 text-sm font-medium">Delivered Today</p>
          <h2 className="text-4xl font-bold mt-2">{loading ? '...' : stats.delivered}</h2>
        </div>
      </div>

      {/* Chart Section */}
      <div className="p-6 rounded-2xl bg-[#151921] border border-slate-800 h-[400px]">
        <h3 className="text-xl font-bold mb-6">Delivery Performance</h3>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} 
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={['#3b82f6', '#f59e0b', '#10b981'][index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}