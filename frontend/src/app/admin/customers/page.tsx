"use client";

import React, { useState, useEffect } from 'react';
import { Users, Mail, Phone, MapPin, Package, Loader2 } from 'lucide-react';
import apiClient from '@/lib/apiClient';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/management/users?role=CUSTOMER');
      setCustomers(res.data.data || []);
    } catch (error) {
      console.error("Failed to load customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await apiClient.patch(`/management/users/${id}/status`, {
        isActive: !currentStatus
      });
      fetchCustomers(); // refresh list
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status. See console for details.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
      await apiClient.delete(`/management/users/${id}`);
      fetchCustomers(); // refresh list
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Failed to delete user.");
    }
  };
  
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === 'ACTIVE') return matchesSearch && c.isActive;
    if (filter === 'SUSPENDED') return matchesSearch && !c.isActive;
    return matchesSearch;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-500" />
            Customers
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Manage customer accounts and view their order history.</p>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 relative z-10">Total Customers</p>
          <h3 className="text-3xl font-bold text-white mt-2 relative z-10">{loading ? <Loader2 className="w-6 h-6 animate-spin mt-1" /> : customers.length}</h3>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 relative z-10">Active Users</p>
          <h3 className="text-3xl font-bold text-white mt-2 relative z-10">{loading ? <Loader2 className="w-6 h-6 animate-spin mt-1" /> : customers.filter(c => c.isActive).length}</h3>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 relative z-10">Avg Orders / User</p>
          <h3 className="text-3xl font-bold text-white mt-2 relative z-10">N/A</h3>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilter('ALL')} className={`px-4 py-2 bg-slate-900 border rounded-xl transition-colors ${filter === 'ALL' ? 'border-indigo-500 text-white' : 'border-slate-800 text-slate-400 hover:text-white'}`}>All</button>
          <button onClick={() => setFilter('ACTIVE')} className={`px-4 py-2 bg-slate-900 border rounded-xl transition-colors ${filter === 'ACTIVE' ? 'border-emerald-500 text-white' : 'border-slate-800 text-slate-400 hover:text-white'}`}>Filter Active</button>
          <button onClick={() => setFilter('SUSPENDED')} className={`px-4 py-2 bg-slate-900 border rounded-xl transition-colors ${filter === 'SUSPENDED' ? 'border-red-500 text-white' : 'border-slate-800 text-slate-400 hover:text-white'}`}>Filter Suspended</button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs text-slate-500 uppercase bg-slate-950/50">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Customer</th>
                <th className="px-6 py-4 font-bold tracking-wider">Contact</th>
                <th className="px-6 py-4 font-bold tracking-wider">Location</th>
                <th className="px-6 py-4 font-bold tracking-wider">Orders</th>
                <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                    <p className="mt-2 text-slate-400 font-medium">Loading customers...</p>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                 <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                          {c.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-slate-200 font-bold">{c.name}</p>
                          <p className="text-xs font-mono">{c._id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {c.email}</div>
                      <div className="flex items-center gap-2 text-slate-600"><Phone className="w-3 h-3" /> N/A</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600"><MapPin className="w-4 h-4" /> Not Tracked</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600"><Package className="w-4 h-4" /> N/A</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-md border ${
                        c.isActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}>
                        {c.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {c.isActive ? (
                        <button onClick={() => handleToggleStatus(c._id, c.isActive)} className="p-2 hover:bg-amber-500/20 rounded-lg text-amber-400 transition-colors inline-flex items-center justify-center text-xs font-bold" title="Suspend">
                          Suspend
                        </button>
                      ) : (
                         <button onClick={() => handleToggleStatus(c._id, c.isActive)} className="p-2 hover:bg-emerald-500/20 rounded-lg text-emerald-400 transition-colors inline-flex items-center justify-center text-xs font-bold" title="Activate">
                          Activate
                        </button>
                      )}
                      <button onClick={() => handleDelete(c._id)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors inline-flex items-center justify-center text-xs font-bold" title="Delete">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
