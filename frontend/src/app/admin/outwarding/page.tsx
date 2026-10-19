"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Truck, ScanLine, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/lib/apiClient';
import axios from 'axios';

export default function HubOutwardingPage() {
  const [trackingId, setTrackingId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentScans, setRecentScans] = useState<{ id: string; time: string; success: boolean; message?: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleOutward = async (e: React.FormEvent) => {
    e.preventDefault();
    const scannedAwb = trackingId.trim();
    if (!scannedAwb) return;

    setLoading(true);
    try {
      let res;
      const payload = {
        awb: scannedAwb,
        vehicleNumber: vehicleId.trim() || undefined,
        vehicleId: vehicleId.trim() || undefined,
      };

      try {
        // Primary: POST /api/orders/outward
        res = await apiClient.post('/orders/outward', payload);
      } catch (postErr: any) {
        // Fallback 1: Direct Order Service port 4004
        try {
          res = await axios.post('http://localhost:4004/api/orders/outward', payload);
        } catch (portErr: any) {
          // Fallback 2: PUT /orders/:trackingId/transit
          res = await apiClient.put(`/orders/${scannedAwb}/transit`, payload);
        }
      }

      if (res?.data?.success) {
        toast.success(res.data.message || 'Parcel Dispatched for Transit!');
        setRecentScans((prev) => [
          { 
            id: scannedAwb, 
            time: new Date().toLocaleTimeString(), 
            success: true,
            message: res.data.message || 'Dispatched Successfully'
          },
          ...prev,
        ]);
      } else {
        throw new Error(res?.data?.message || 'Failed to dispatch parcel');
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message || 'Error dispatching parcel';
      toast.error(errMsg);
      setRecentScans((prev) => [
        { 
          id: scannedAwb, 
          time: new Date().toLocaleTimeString(), 
          success: false,
          message: errMsg
        },
        ...prev,
      ]);
    } finally {
      setLoading(false);
      setTrackingId('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 font-sans text-slate-200">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-orange-600/20 flex items-center justify-center border border-orange-500/30">
            <Truck className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Hub Outwarding / Transit</h1>
            <p className="text-slate-400 mt-1">Scan parcels to load onto line-haul trucks for mid-mile transit.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Scanner Area */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              
              <form onSubmit={handleOutward} className="relative z-10">
                <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Line-Haul Vehicle ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    placeholder="e.g. TRUCK-992"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-6 py-4 text-lg text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-mono"
                  />
                </div>

                <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Scan AWB / Tracking ID
                </label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    ref={inputRef}
                    type="text"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    placeholder="e.g. TRK172731..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-6 py-4 text-xl text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-mono"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={loading || !trackingId.trim()}
                    className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-8 py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-orange-900/50 active:scale-95"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Truck className="w-5 h-5" />
                        Dispatch to Transit
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Session Stats */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl h-full flex flex-col">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Session Summary</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-black text-emerald-400">{recentScans.filter(s => s.success).length}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Success</p>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-black text-red-400">{recentScans.filter(s => !s.success).length}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Failed</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Scans */}
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Recently Dispatched Parcels</h3>
          </div>
          {recentScans.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <ScanLine className="w-12 h-12 text-slate-700 mb-4" />
              <p className="text-slate-500 font-medium">Waiting for scans...</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800 max-h-[400px] overflow-y-auto">
              {recentScans.map((scan, i) => (
                <div key={i} className="flex items-center justify-between p-4 px-6 hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    {scan.success ? (
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-white font-mono font-bold tracking-tight">{scan.id}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{scan.message || (scan.success ? 'Dispatched Successfully' : 'Dispatch Failed')}</p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-400 font-mono">
                    {scan.time}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
