"use client";

import React, { useState, useEffect } from 'react';
import { UserCheck, Search, Plus, MoreVertical, Edit2, Trash2, MapPin, Truck } from 'lucide-react';
import axios from 'axios';

interface Agent {
  _id: string;
  name: string;
  assignedHubId?: string;
  vehicleId?: string;
  status: string;
  rating: number;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would fetch from /api/management/agents
    // Mocking for now to show the UI
    const mockAgents: Agent[] = [
      { _id: '1', name: 'Rahul Kumar', assignedHubId: 'HUB-DEL-01', vehicleId: 'DL 1M 1234', status: 'AVAILABLE', rating: 4.8 },
      { _id: '2', name: 'Amit Singh', assignedHubId: 'HUB-DEL-02', vehicleId: 'DL 2C 5678', status: 'IN_TRANSIT', rating: 4.5 },
      { _id: '3', name: 'Vikram Das', assignedHubId: 'HUB-BOM-01', vehicleId: 'MH 12 9012', status: 'OFFLINE', rating: 4.9 },
    ];
    setAgents(mockAgents);
    setLoading(false);
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-amber-500" />
            Delivery Agents
          </h1>
          <p className="text-slate-400 mt-1">Manage agent profiles and assignments.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search agents..." 
              className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-amber-500 text-sm text-slate-200 w-64"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-xl transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Agent</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                <th className="px-6 py-4 font-semibold">Agent Details</th>
                <th className="px-6 py-4 font-semibold">Hub Assignment</th>
                <th className="px-6 py-4 font-semibold">Vehicle</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading...</td>
                </tr>
              ) : agents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No agents found.</td>
                </tr>
              ) : (
                agents.map((agent) => (
                  <tr key={agent._id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold">
                          {agent.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{agent.name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                             ⭐ {agent.rating}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        <span className="font-mono">{agent.assignedHubId || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Truck className="w-4 h-4 text-slate-500" />
                        <span className="font-mono">{agent.vehicleId || 'None'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase
                        ${agent.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                          agent.status === 'IN_TRANSIT' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                          'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                        {agent.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
