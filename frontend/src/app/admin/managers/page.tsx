"use client";

import React, { useState } from 'react';
import { UserCog, Building2, Map, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ManagersPage() {
  const [managers] = useState([
    { id: 'M-101', name: 'Suresh Raina', email: 'suresh@logistics.com', region: 'North', hub: 'Delhi Central', teamSize: 45, status: 'Active' },
    { id: 'M-102', name: 'Anjali Sharma', email: 'anjali@logistics.com', region: 'West', hub: 'Mumbai Hub', teamSize: 32, status: 'Active' },
    { id: 'M-103', name: 'Kiran Desai', email: 'kiran@logistics.com', region: 'South', hub: 'Bangalore Depot', teamSize: 58, status: 'Active' },
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <UserCog className="w-8 h-8 text-amber-500" />
            Operations Managers
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Oversee region and hub-level administrative accounts.</p>
        </div>
        <button className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20">
          + Add Manager
        </button>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 relative z-10">Total Managers</p>
          <h3 className="text-3xl font-bold text-white mt-2 relative z-10">24</h3>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 relative z-10">Regions Covered</p>
          <h3 className="text-3xl font-bold text-white mt-2 relative z-10">5</h3>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 relative z-10">System Access</p>
          <h3 className="text-3xl font-bold text-white mt-2 relative z-10">100%</h3>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs text-slate-500 uppercase bg-slate-950/50">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Manager</th>
                <th className="px-6 py-4 font-bold tracking-wider">Region</th>
                <th className="px-6 py-4 font-bold tracking-wider">Assigned Hub</th>
                <th className="px-6 py-4 font-bold tracking-wider">Team Size</th>
                <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {managers.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-slate-200 font-bold flex items-center gap-1">
                          {m.name} <ShieldCheck className="w-4 h-4 text-amber-500" />
                        </p>
                        <div className="flex items-center gap-1 text-xs mt-0.5"><Mail className="w-3 h-3" /> {m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2"><Map className="w-4 h-4 text-slate-500" /> {m.region}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-slate-500" /> {m.hub}</div>
                  </td>
                  <td className="px-6 py-4 font-mono">
                    {m.teamSize} Agents
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-md border ${
                      m.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {m.status}
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
