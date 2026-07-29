"use client";

import React, { useState, useEffect } from 'react';
import { Warehouse, Plus, Search, MapPin, Settings, User } from 'lucide-react';

interface WarehouseData {
  _id: string;
  name: string;
  location: { address: string };
  capacity: number;
  currentInventory: number;
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Mock Data
    const mockWarehouses: WarehouseData[] = [
      { _id: 'WH-01', name: 'Delhi Central Warehouse', location: { address: 'New Delhi, DL' }, capacity: 10000, currentInventory: 7500 },
      { _id: 'WH-02', name: 'Mumbai Hub Depot', location: { address: 'Mumbai, MH' }, capacity: 15000, currentInventory: 12000 },
      { _id: 'WH-03', name: 'Bangalore Tech Park Storage', location: { address: 'Bangalore, KA' }, capacity: 8000, currentInventory: 2000 },
      { _id: 'WH-04', name: 'Kolkata East Terminal', location: { address: 'Kolkata, WB' }, capacity: 5000, currentInventory: 4800 },
    ];
    setWarehouses(mockWarehouses);
    setLoading(false);
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Warehouse className="w-8 h-8 text-indigo-400" />
            Warehouses
          </h1>
          <p className="text-slate-400 mt-1">Manage network capacities and storage depots.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search warehouses..." 
              className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-sm text-slate-200 w-64"
            />
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Register Warehouse</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-slate-500 py-12">Loading...</div>
        ) : (
          warehouses.map((wh) => {
            const utilization = (wh.currentInventory / wh.capacity) * 100;
            let barColor = 'bg-emerald-500';
            if (utilization > 75) barColor = 'bg-amber-500';
            if (utilization > 90) barColor = 'bg-red-500';

            return (
              <div key={wh._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/50 transition-all group relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Warehouse className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">{wh.name}</h3>
                      <p className="text-xs font-mono text-slate-500 mt-0.5">{wh._id}</p>
                    </div>
                  </div>
                  <button className="p-2 text-slate-500 hover:text-white transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <span>{wh.location.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <User className="w-4 h-4 text-slate-500" />
                    <span>Manager Assigned</span>
                  </div>
                </div>

                {/* Capacity Bar */}
                <div className="space-y-2 mt-auto">
                  <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wide">
                    <span>Capacity Utilization</span>
                    <span className={utilization > 90 ? 'text-red-400' : utilization > 75 ? 'text-amber-400' : 'text-emerald-400'}>
                      {utilization.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all duration-1000`} style={{ width: `${utilization}%` }}></div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>{wh.currentInventory.toLocaleString()} units</span>
                    <span>{wh.capacity.toLocaleString()} max</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Register Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
            <h2 className="text-2xl font-bold text-white mb-6">Register Warehouse</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
                <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500" placeholder="e.g. North Zone Depot" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Address</label>
                <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500" placeholder="City, State" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Max Capacity (Units)</label>
                <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500" placeholder="10000" />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors">Cancel</button>
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors">Register</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
