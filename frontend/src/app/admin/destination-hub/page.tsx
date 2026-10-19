"use client";

import React, { useState, useRef, useEffect } from 'react';
import { DownloadCloud, ScanLine, CheckCircle2, AlertCircle, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/lib/apiClient';
import axios from 'axios';

interface ScannedItem {
  id: string;
  time: string;
  success: boolean;
  message?: string;
  status?: string;
  isDispatching?: boolean;
}

export default function DestinationHubInwardingPage() {
  const [trackingId, setTrackingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentScans, setRecentScans] = useState<ScannedItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleInward = async (e: React.FormEvent) => {
    e.preventDefault();
    const scannedAwb = trackingId.trim();
    if (!scannedAwb) return;

    setLoading(true);
    try {
      let res;
      try {
        // Primary: POST /api/orders/destination-inward with { awb }
        res = await apiClient.post('/orders/destination-inward', { awb: scannedAwb });
      } catch (postErr: any) {
        // Fallback 1: Direct Order Service port 4004
        try {
          res = await axios.post('http://localhost:4004/api/orders/destination-inward', { awb: scannedAwb });
        } catch (portErr: any) {
          // Fallback 2: PUT /orders/:trackingId/destination-inward
          res = await apiClient.put(`/orders/${scannedAwb}/destination-inward`);
        }
      }

      if (res?.data?.success) {
        const successMsg = res.data?.message || 'Reached Destination Hub. Preparing for final delivery.';
        toast.success(successMsg);
        setRecentScans((prev) => [
          {
            id: scannedAwb,
            time: new Date().toLocaleTimeString(),
            success: true,
            message: successMsg,
            status: 'DESTINATION_HUB',
          },
          ...prev,
        ]);
      } else {
        throw new Error(res?.data?.message || 'Failed to receive parcel');
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message || 'Error receiving parcel';
      toast.error(errMsg);
      setRecentScans((prev) => [
        {
          id: scannedAwb,
          time: new Date().toLocaleTimeString(),
          success: false,
          message: errMsg,
          status: 'FAILED',
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

  const handleOutForDelivery = async (awb: string) => {
    setRecentScans((prev) =>
      prev.map((s) => (s.id === awb ? { ...s, isDispatching: true } : s))
    );

    try {
      let res;
      try {
        // Primary: POST /api/orders/out-for-delivery with { awb }
        res = await apiClient.post('/orders/out-for-delivery', { awb });
      } catch (postErr: any) {
        // Fallback 1: Direct Order Service port 4004
        try {
          res = await axios.post('http://localhost:4004/api/orders/out-for-delivery', { awb });
        } catch (portErr: any) {
          // Fallback 2: PUT /orders/:trackingId/out-for-delivery
          res = await apiClient.put(`/orders/${awb}/out-for-delivery`);
        }
      }

      if (res?.data?.success) {
        toast.success(`Parcel ${awb} dispatched Out for Delivery!`);
        setRecentScans((prev) =>
          prev.map((s) =>
            s.id === awb
              ? {
                  ...s,
                  status: 'OUT_FOR_DELIVERY',
                  message: 'Parcel is out for delivery.',
                  isDispatching: false,
                }
              : s
          )
        );
      } else {
        throw new Error(res?.data?.message || 'Failed to dispatch out for delivery');
      }
    } catch (error: any) {
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        'Failed to dispatch out for delivery';
      toast.error(errMsg);
      setRecentScans((prev) =>
        prev.map((s) => (s.id === awb ? { ...s, isDispatching: false } : s))
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 font-sans text-slate-200">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
            <DownloadCloud className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Destination Hub Receiving</h1>
            <p className="text-slate-400 mt-1">Scan parcels arriving from mid-mile line-haul transit.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Scanner Area */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              
              <form onSubmit={handleInward} className="relative z-10">
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
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-6 py-4 text-xl text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all font-mono"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={loading || !trackingId.trim()}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-900/50 active:scale-95"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <DownloadCloud className="w-5 h-5" />
                        Receive Parcel
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
                  <p className="text-3xl font-black text-emerald-400">{recentScans.filter((s) => s.success).length}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Success</p>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-black text-red-400">{recentScans.filter((s) => !s.success).length}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Failed</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Scans */}
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Recently Received Parcels</h3>
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
                      <p className="text-xs text-slate-400 mt-0.5">
                        {scan.message || (scan.success ? 'Reached Destination Hub. Preparing for final delivery.' : 'Receive Failed')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {scan.success && scan.status !== 'OUT_FOR_DELIVERY' && (
                      <button
                        onClick={() => handleOutForDelivery(scan.id)}
                        disabled={scan.isDispatching}
                        className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 text-xs font-semibold rounded-lg border border-purple-500/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {scan.isDispatching ? (
                          <div className="w-3.5 h-3.5 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Truck className="w-3.5 h-3.5 text-purple-400" />
                            Out for Delivery
                          </>
                        )}
                      </button>
                    )}
                    {scan.success && scan.status === 'OUT_FOR_DELIVERY' && (
                      <span className="px-2.5 py-1 bg-purple-950 text-purple-400 border border-purple-700/50 rounded-lg text-xs font-semibold flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        Out for Delivery
                      </span>
                    )}
                    <div className="text-sm text-slate-400 font-mono">
                      {scan.time}
                    </div>
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

