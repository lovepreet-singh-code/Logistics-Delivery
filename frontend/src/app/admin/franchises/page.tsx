"use client";

import React, { useState } from 'react';
import { MapPin, Briefcase, Percent, ShieldCheck, ArrowRight, Activity } from 'lucide-react';
import Link from 'next/link';

export default function FranchisesPage() {
  const [franchises] = useState([
    { id: 'F-001', name: 'Delhi NCR Express', owner: 'Rajat Sharma', location: 'Delhi', revenueShare: '80/20', activeHubs: 3, status: 'Active' },
    { id: 'F-002', name: 'Mumbai Coast Logistics', owner: 'Vikram Singh', location: 'Mumbai', revenueShare: '85/15', activeHubs: 2, status: 'Active' },
    { id: 'F-003', name: 'Bangalore Tech Trans', owner: 'Deepak Reddy', location: 'Bangalore', revenueShare: '80/20', activeHubs: 1, status: 'Pending' },
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <MapPin className="w-8 h-8 text-fuchsia-500" />
            Franchise Partners
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Manage franchise owners, locations, and revenue sharing agreements.</p>
        </div>
        <button className="bg-fuchsia-500 hover:bg-fuchsia-600 text-slate-950 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-fuchsia-500/20">
          + Onboard Franchise
        </button>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-fuchsia-500/10 rounded-full blur-2xl group-hover:bg-fuchsia-500/20 transition-all"></div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 relative z-10">Active Franchises</p>
          <h3 className="text-3xl font-bold text-white mt-2 relative z-10">42</h3>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 relative z-10">Partner Revenue Share</p>
          <h3 className="text-3xl font-bold text-white mt-2 relative z-10">₹4.2 Cr</h3>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 relative z-10">Applications Pending</p>
          <h3 className="text-3xl font-bold text-white mt-2 relative z-10">12</h3>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs text-slate-500 uppercase bg-slate-950/50">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Franchise Name</th>
                <th className="px-6 py-4 font-bold tracking-wider">Owner</th>
                <th className="px-6 py-4 font-bold tracking-wider">Location</th>
                <th className="px-6 py-4 font-bold tracking-wider">Rev Share</th>
                <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {franchises.map((f) => (
                <tr key={f.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                        <Briefcase className="w-5 h-5 text-fuchsia-500" />
                      </div>
                      <div>
                        <p className="text-slate-200 font-bold">{f.name}</p>
                        <p className="text-xs font-mono">{f.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300 font-medium">
                    {f.owner}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-500" /> {f.location}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 font-mono"><Percent className="w-4 h-4 text-slate-500" /> {f.revenueShare}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-md border ${
                      f.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors inline-flex items-center justify-center">
                      <ArrowRight className="w-5 h-5" />
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
