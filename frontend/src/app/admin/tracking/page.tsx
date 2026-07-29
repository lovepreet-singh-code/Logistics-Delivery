"use client";

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Package, Clock } from 'lucide-react';
import dynamic from 'next/dynamic';
import axios from 'axios';

// Dynamically import the Leaflet map so it only runs on client
const TrackingMap = dynamic(() => import('@/components/TrackingMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center text-slate-500 shadow-xl">Loading Map Core...</div>
});

export default function TrackingPage() {
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch IN_TRANSIT orders and Active Vehicles
        // We will hit our real APIs via API Gateway
        const [ordersRes, vehiclesRes] = await Promise.all([
          axios.get('http://localhost:8080/api/orders', { headers }).catch(() => ({ data: { data: [] } })),
          axios.get('http://localhost:8080/api/fleet/vehicles', { headers }).catch(() => ({ data: { data: [] } }))
        ]);

        const transitOrders = (ordersRes.data.data || []).filter((o: any) => o.status === 'TRANSIT' || o.status === 'OUT_FOR_DELIVERY');
        const activeVehicles = (vehiclesRes.data.data || []).filter((v: any) => v.status === 'IN_TRANSIT');

        setActiveOrders(transitOrders);
        setVehicles(activeVehicles);
      } catch (error) {
        console.error("Failed to load tracking data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrackingData();
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchTrackingData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 max-w-[1600px] mx-auto h-[calc(100vh-80px)] flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <header className="flex items-end justify-between shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <MapPin className="w-8 h-8 text-blue-500" />
            Live Tracking Center
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Real-time geospatial monitoring of fleet vehicles and active deliveries.</p>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        
        {/* Left Side: Map */}
        <div className="flex-1 h-full relative z-0">
          <TrackingMap orders={activeOrders} vehicles={vehicles} />
          
          <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur-md border border-slate-700 p-4 rounded-2xl shadow-xl flex gap-6">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse"></div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Active Fleet</p>
                <p className="text-xl text-white font-bold">{vehicles.length}</p>
              </div>
            </div>
            <div className="w-px h-10 bg-slate-700"></div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse"></div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">In Transit</p>
                <p className="text-xl text-white font-bold">{activeOrders.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Active Orders List */}
        <div className="w-full lg:w-96 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col overflow-hidden shrink-0">
          <div className="p-6 border-b border-slate-800 bg-slate-950/50">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Navigation className="w-5 h-5 text-indigo-400" />
              Live Routing Board
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="text-center text-slate-500 py-8">Syncing with satellites...</div>
            ) : activeOrders.length === 0 ? (
              <div className="text-center text-slate-500 py-8">No active orders in transit.</div>
            ) : (
              activeOrders.map((order, i) => (
                <div key={i} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 hover:border-indigo-500/50 transition-colors cursor-pointer group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md">
                      {order.orderId}
                    </span>
                    <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> ETA: 2h 15m
                    </span>
                  </div>
                  <p className="text-slate-200 font-bold text-sm mb-1 line-clamp-1">{order.deliveryAddress?.fullAddress || "Unknown Destination"}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Package className="w-3 h-3" />
                    Status: <span className="text-slate-300 font-medium">{order.status}</span>
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
