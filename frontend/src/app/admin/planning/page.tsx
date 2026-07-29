"use client";

import React, { useState } from 'react';
import { Navigation, Package, Truck, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function PlanningPage() {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  // Mock Data
  const unassignedOrders = [
    { id: 'LG-9925', destination: 'Bangalore Hub', weight: '12 kg' },
    { id: 'LG-9926', destination: 'Mumbai Hub', weight: '8 kg' },
    { id: 'LG-9927', destination: 'Delhi Hub', weight: '15 kg' },
    { id: 'LG-9928', destination: 'Bangalore Hub', weight: '5 kg' },
  ];

  const availableFleet = [
    { id: 'D-101', name: 'Rahul Kumar', vehicle: 'DL 1M 1234', capacity: '1000 kg', currentLoad: '0%' },
    { id: 'D-102', name: 'Amit Singh', vehicle: 'DL 2C 5678', capacity: '800 kg', currentLoad: '0%' },
  ];

  const handleOrderToggle = (id: string) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    );
  };

  const handleDispatch = () => {
    if (selectedOrders.length === 0 || !selectedDriver) return;
    alert(`Dispatched ${selectedOrders.length} orders to ${selectedDriver}`);
    // In real app, calls /api/planning/dispatch
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Navigation className="w-8 h-8 text-amber-500" />
          Route Planning & Dispatch
        </h1>
        <p className="text-slate-400 mt-1">Select pending orders and assign them to available fleet.</p>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
        
        {/* Left Pane: Orders */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-400" /> Pending Orders
            </h2>
            <span className="text-sm font-medium text-slate-400">{selectedOrders.length} selected</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {unassignedOrders.map(order => (
              <div 
                key={order.id}
                onClick={() => handleOrderToggle(order.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedOrders.includes(order.id) 
                    ? 'bg-indigo-500/10 border-indigo-500/50' 
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-mono font-bold text-slate-200 text-lg">{order.id}</h3>
                    <p className="text-sm text-slate-400 mt-1">To: {order.destination}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-md">{order.weight}</span>
                    {selectedOrders.includes(order.id) && <CheckCircle2 className="w-5 h-5 text-indigo-500" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Action */}
        <div className="flex items-center justify-center py-4 lg:py-0">
          <button 
            onClick={handleDispatch}
            disabled={selectedOrders.length === 0 || !selectedDriver}
            className="flex flex-col items-center justify-center w-24 h-24 rounded-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold transition-colors shadow-lg hover:shadow-amber-500/20 group"
          >
            <ArrowRight className="w-8 h-8 mb-1 group-disabled:hidden" />
            <span className="text-xs uppercase tracking-wider text-center px-2 leading-tight">Optimize &<br/>Dispatch</span>
          </button>
        </div>

        {/* Right Pane: Fleet */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-400" /> Available Fleet
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {availableFleet.map(fleet => (
              <div 
                key={fleet.id}
                onClick={() => setSelectedDriver(fleet.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  selectedDriver === fleet.id 
                    ? 'bg-emerald-500/10 border-emerald-500/50 relative overflow-hidden' 
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                {selectedDriver === fleet.id && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/20 blur-2xl"></div>
                )}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-200 text-lg flex items-center gap-2">
                      {fleet.name}
                      {selectedDriver === fleet.id && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </h3>
                    <p className="text-sm font-mono text-slate-400 mt-1">{fleet.vehicle}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase rounded-md border border-emerald-500/30">
                    Available
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-between text-xs text-slate-400">
                  <span>Capacity: {fleet.capacity}</span>
                  <span>Load: {fleet.currentLoad}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
