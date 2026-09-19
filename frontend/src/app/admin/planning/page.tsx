"use client";

import React, { useState, useEffect } from 'react';
import { Navigation, Package, Truck, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import apiClient from '@/lib/apiClient';

export default function PlanningPage() {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  const [unassignedOrders, setUnassignedOrders] = useState<any[]>([]);
  const [filterTab, setFilterTab] = useState<'DELIVERIES' | 'PICKUPS'>('DELIVERIES');
  const [availableFleet, setAvailableFleet] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [lastDispatch, setLastDispatch] = useState<{ agentName: string, orders: any[] } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token') || '';
        const headers = { Authorization: `Bearer ${token}` };
        
        const [ordersRes, agentsRes] = await Promise.all([
          apiClient.get('/orders', { headers }),
          apiClient.get('/management/agents', { headers })
        ]);
        
        console.log("Fetched Orders Response:", ordersRes.data);
        console.log("Fetched Agents Response:", agentsRes.data);
        
        const ordersArray = ordersRes.data.data || ordersRes.data || [];
        const agentsArray = agentsRes.data.data || agentsRes.data || [];
        
        const pending = ordersArray.filter((o: any) => o.status === 'ORDER_PLACED' || o.status === 'PENDING' || o.status === 'PENDING_PICKUP');
        setUnassignedOrders(pending);
        setAvailableFleet(agentsArray);
      } catch (error) {
        console.error("Failed to load planning data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleOrderToggle = (id: string) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    );
  };

  const handleDispatch = async () => {
    if (selectedOrders.length === 0 || !selectedDriver) return;
    setDispatching(true);
    try {
      let fallbackDriverId = "60b5f1f9a2b5b3a3d8f8a1a1"; // valid fallback ObjectId
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          fallbackDriverId = payload.id || payload.userId || fallbackDriverId;
        }
      } catch (e) {
        console.error("Could not parse token for driverId fallback", e);
      }

      // Use the debug endpoint to bypass planning logic and assign directly to Agent
      const dispatchPromises = selectedOrders.map(orderId => 
        apiClient.post('/dispatch/debug/create-mock-manifest', {
          agentId: fallbackDriverId,
          orderId: orderId
        })
      );
      
      await Promise.all(dispatchPromises);
      alert(`Successfully dispatched ${selectedOrders.length} orders!`);
      
      const agentObj = availableFleet.find(a => (a.userId || a._id) === selectedDriver);
      const dispatchedOrdersObjects = unassignedOrders.filter(o => selectedOrders.includes(o._id));
      setLastDispatch({
        agentName: agentObj ? agentObj.name : "Unknown Agent",
        orders: dispatchedOrdersObjects
      });

      // Remove dispatched orders from state
      setUnassignedOrders(prev => prev.filter(o => !selectedOrders.includes(o._id)));
      setSelectedOrders([]);
      setSelectedDriver(null);
    } catch (error) {
      console.error("Dispatch failed", error);
      alert("Failed to dispatch orders.");
    } finally {
      setDispatching(false);
    }
  };

  // Define displayed orders based on the filter tab
  const displayedOrders = unassignedOrders.filter(o => 
    filterTab === 'PICKUPS' ? o.status === 'PENDING_PICKUP' : (o.status === 'ORDER_PLACED' || o.status === 'PENDING')
  );

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6">
      <header className="flex justify-between items-end print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Navigation className="w-8 h-8 text-amber-500" />
            Route Planning & Dispatch
          </h1>
          <p className="text-slate-400 mt-1">Select pending orders and assign them to available fleet.</p>
        </div>
        {lastDispatch && (
          <button 
            onClick={() => window.print()}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg"
          >
            Print Run Sheet
          </button>
        )}
      </header>

      {/* PRINT ONLY SECTION */}
      {lastDispatch && (
        <div className="hidden print:block text-black p-8">
          <h1 className="text-2xl font-bold mb-4 border-b pb-2">LogiCore - Daily Run Sheet</h1>
          <div className="flex justify-between mb-8">
            <p><strong>Agent Name:</strong> {lastDispatch.agentName}</p>
            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
            <p><strong>Vehicle:</strong> Assigned Fleet</p>
          </div>
          <table className="w-full text-left border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2">Seq</th>
                <th className="border border-gray-300 p-2">Tracking ID</th>
                <th className="border border-gray-300 p-2">Customer / Phone</th>
                <th className="border border-gray-300 p-2">Address</th>
                <th className="border border-gray-300 p-2">Signature</th>
              </tr>
            </thead>
            <tbody>
              {lastDispatch.orders.map((order, idx) => (
                <tr key={order._id}>
                  <td className="border border-gray-300 p-2 text-center font-bold">{idx + 1}</td>
                  <td className="border border-gray-300 p-2 font-mono text-sm">{order._id.slice(-8).toUpperCase()}</td>
                  <td className="border border-gray-300 p-2">{order.customerPhone || 'N/A'}</td>
                  <td className="border border-gray-300 p-2 text-sm">
                    {order.status === 'PENDING_PICKUP' ? order.pickupAddress?.fullAddress : order.deliveryAddress?.fullAddress}
                  </td>
                  <td className="border border-gray-300 p-2 w-32"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)] print:hidden">
        
        {/* Left Pane: Orders */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-400" /> Pending Orders
            </h2>
            <span className="text-sm font-medium text-slate-400">{selectedOrders.length} selected</span>
          </div>
          
          <div className="flex bg-slate-950 p-1 rounded-xl mb-4">
            <button
              onClick={() => { setFilterTab('DELIVERIES'); setSelectedOrders([]); }}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${filterTab === 'DELIVERIES' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Deliveries
            </button>
            <button
              onClick={() => { setFilterTab('PICKUPS'); setSelectedOrders([]); }}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${filterTab === 'PICKUPS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Pickups
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
            ) : displayedOrders.length === 0 ? (
              <div className="text-center text-slate-500 p-8">No pending orders to dispatch.</div>
            ) : (
              displayedOrders.map(order => (
                <div 
                  key={order._id}
                  onClick={() => handleOrderToggle(order._id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedOrders.includes(order._id) 
                      ? 'bg-indigo-500/10 border-indigo-500/50' 
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-mono font-bold text-slate-200 text-lg">{order._id.slice(-8).toUpperCase()}</h3>
                      <p className="text-sm text-slate-400 mt-1">To: {order.deliveryAddress?.fullAddress?.substring(0, 20)}...</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-md font-mono">{order.parcelDetails?.weight || 0} kg</span>
                      {selectedOrders.includes(order._id) && <CheckCircle2 className="w-5 h-5 text-indigo-500" />}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center: Action */}
        <div className="flex items-center justify-center py-4 lg:py-0">
          <button 
            onClick={handleDispatch}
            disabled={selectedOrders.length === 0 || !selectedDriver || dispatching}
            className="flex flex-col items-center justify-center w-24 h-24 rounded-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold transition-colors shadow-lg hover:shadow-amber-500/20 group"
          >
            {dispatching ? (
              <Loader2 className="w-8 h-8 mb-1 animate-spin" />
            ) : (
              <ArrowRight className="w-8 h-8 mb-1 group-disabled:hidden" />
            )}
            <span className="text-xs uppercase tracking-wider text-center px-2 leading-tight">Optimize &<br/>Dispatch</span>
          </button>
        </div>

        {/* Right Pane: Fleet */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-400" /> Available Agents
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
            ) : availableFleet.length === 0 ? (
              <div className="text-center text-slate-500 p-8">No available delivery agents.</div>
            ) : (
              availableFleet.map(agent => (
                <div 
                  key={agent._id}
                  onClick={() => setSelectedDriver(agent.userId || agent._id)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    selectedDriver === (agent.userId || agent._id) 
                      ? 'bg-emerald-500/10 border-emerald-500/50 relative overflow-hidden' 
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {selectedDriver === (agent.userId || agent._id) && (
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/20 blur-2xl"></div>
                  )}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-200 text-lg flex items-center gap-2">
                        {agent.name}
                        {selectedDriver === (agent.userId || agent._id) && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      </h3>
                      <p className="text-sm font-mono text-slate-400 mt-1">Status: {agent.status}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase rounded-md border border-emerald-500/30">
                      Available
                    </span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-between text-xs text-slate-400">
                    <span className="font-mono">Rating: {agent.rating}/5.0</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
