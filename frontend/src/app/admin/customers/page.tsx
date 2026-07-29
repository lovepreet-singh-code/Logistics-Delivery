"use client";

import React, { useState } from 'react';
import { Users, Mail, Phone, MapPin, Package, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CustomersPage() {
  // Mock Data
  const [customers] = useState([
    { id: 'C-001', name: 'Ravi Kumar', email: 'ravi@example.com', phone: '+91 9876543210', location: 'New Delhi', orders: 12, lifetimeSpend: 14500, status: 'Active' },
    { id: 'C-002', name: 'Priya Singh', email: 'priya@example.com', phone: '+91 8765432109', location: 'Mumbai', orders: 5, lifetimeSpend: 6200, status: 'Active' },
    { id: 'C-003', name: 'Amit Patel', email: 'amit@example.com', phone: '+91 7654321098', location: 'Ahmedabad', orders: 24, lifetimeSpend: 28900, status: 'Active' },
    { id: 'C-004', name: 'Neha Sharma', email: 'neha@example.com', phone: '+91 6543210987', location: 'Bangalore', orders: 1, lifetimeSpend: 1200, status: 'Suspended' },
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase()));

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
          <h3 className="text-3xl font-bold text-white mt-2 relative z-10">1,248</h3>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 relative z-10">Active This Month</p>
          <h3 className="text-3xl font-bold text-white mt-2 relative z-10">892</h3>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 relative z-10">Avg Orders / User</p>
          <h3 className="text-3xl font-bold text-white mt-2 relative z-10">4.2</h3>
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
          <button className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">Filter Active</button>
          <button className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">Filter Suspended</button>
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
                <th className="px-6 py-4 font-bold tracking-wider">Lifetime Spend</th>
                <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-slate-200 font-bold">{c.name}</p>
                        <p className="text-xs font-mono">{c.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 space-y-1">
                    <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {c.email}</div>
                    <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {c.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-500" /> {c.location}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2"><Package className="w-4 h-4 text-slate-500" /> {c.orders}</div>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-300">
                    ₹{c.lifetimeSpend.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-md border ${
                      c.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button className="p-2 hover:bg-indigo-500/20 rounded-lg text-indigo-400 transition-colors inline-flex items-center justify-center text-xs font-bold" title="View Profile">
                      View
                    </button>
                    {c.status === 'Active' ? (
                      <button className="p-2 hover:bg-amber-500/20 rounded-lg text-amber-400 transition-colors inline-flex items-center justify-center text-xs font-bold" title="Suspend">
                        Suspend
                      </button>
                    ) : (
                       <button className="p-2 hover:bg-emerald-500/20 rounded-lg text-emerald-400 transition-colors inline-flex items-center justify-center text-xs font-bold" title="Activate">
                        Activate
                      </button>
                    )}
                    <button className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors inline-flex items-center justify-center text-xs font-bold" title="Delete">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
