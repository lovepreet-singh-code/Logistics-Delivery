"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Package, Truck, CheckCircle, Search, AlertTriangle, FileText } from 'lucide-react';

const LogisticsMap = dynamic(() => import('@/components/LogisticsMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 font-medium">Loading Map Engine...</div>
});

export default function CustomerDashboard() {
  const searchParams = useSearchParams();
  const idFromQuery = searchParams.get('id') || '';
  
  const [orderIdInput, setOrderIdInput] = useState(idFromQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState<any>(null);

  // Auto-fetch if ID provided in URL
  useEffect(() => {
    if (idFromQuery) {
      handleTrackOrder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idFromQuery]);

  const handleTrackOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!orderIdInput.trim()) return;

    try {
      setLoading(true);
      setError('');
      setOrderData(null);
      
      const res = await axios.get(`http://localhost:8080/api/orders/${orderIdInput.trim()}`);
      // Ensure we extract the data object according to standard backend response { success: true, data: { ... } }
      setOrderData(res.data.data || res.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Order not found. Please check your tracking number and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!orderData) return;
    const url = `http://localhost:8080/api/orders/${orderData._id || orderData.id}/invoice`;
    window.open(url, '_blank');
  };

  // Helper to determine step states
  const getStepStatus = (step: 'PLACED' | 'TRANSIT' | 'DELIVERED', currentStatus: string) => {
    const statuses = ['PENDING', 'ROUTED', 'MANIFESTED', 'IN_TRANSIT', 'DELIVERED'];
    const currentIndex = statuses.indexOf(currentStatus?.toUpperCase());
    
    if (step === 'PLACED') return currentIndex >= 0 ? 'completed' : 'pending';
    if (step === 'TRANSIT') {
      if (currentIndex >= statuses.indexOf('IN_TRANSIT')) return 'completed';
      if (currentIndex > 0) return 'active';
      return 'pending';
    }
    if (step === 'DELIVERED') {
      if (currentIndex === statuses.indexOf('DELIVERED')) return 'completed';
      return 'pending';
    }
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4 drop-shadow-sm">
            Track Your Package
          </h1>
          <p className="text-slate-500 text-lg max-w-lg mx-auto">
            Enter your order ID below to get real-time tracking updates and see exactly where your package is.
          </p>
        </header>

        {/* Search Bar */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative z-20">
          <form onSubmit={handleTrackOrder} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
              <input 
                type="text" 
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                placeholder="Enter Order ID (e.g., 60d5ecb8...)"
                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-lg font-medium shadow-inner"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="py-4 px-8 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center disabled:opacity-70 active:scale-95 group"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span className="flex items-center gap-2">
                  Track
                  <Truck className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 shadow-sm">
            <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
            <div>
              <h3 className="text-red-800 font-bold mb-1">Could not track package</h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Tracking Results */}
        {orderData && !error && (
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-12 animate-in fade-in zoom-in-95 relative overflow-hidden">
            
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 pb-8 border-b border-slate-100 relative z-10 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">Order Number</p>
                <p className="text-2xl font-bold text-slate-800 bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500">
                  {orderData._id || orderData.id || orderIdInput}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">Current Status</p>
                <div className={`inline-flex px-4 py-2 rounded-full text-sm font-bold uppercase tracking-widest ${
                  orderData.status === 'DELIVERED' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : orderData.status === 'IN_TRANSIT'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {orderData.status || 'UNKNOWN'}
                </div>
              </div>
            </div>

            {/* Grid Layout for Timeline and Map */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              
              {/* Vertical Timeline */}
              <div className="relative pl-8 py-4 z-10 w-full max-w-md mx-auto sm:mx-0">
              
              {/* Vertical line connecting steps */}
              <div className="absolute left-[47px] top-8 bottom-8 w-1 bg-slate-100 rounded-full"></div>

              {/* Step 1: Placed */}
              <div className="relative flex items-start gap-8 mb-14 group">
                <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shrink-0 border-[4px] transition-all duration-500 ${
                  getStepStatus('PLACED', orderData.status) === 'completed' 
                    ? 'bg-indigo-600 border-indigo-100 text-white shadow-lg shadow-indigo-200' 
                    : 'bg-white border-slate-200 text-slate-300'
                }`}>
                  <Package className="w-7 h-7" />
                </div>
                <div className="pt-2">
                  <h3 className={`text-xl font-bold transition-colors ${
                    getStepStatus('PLACED', orderData.status) === 'completed' ? 'text-slate-800' : 'text-slate-400'
                  }`}>Order Processed</h3>
                  <p className="text-slate-500 mt-2 leading-relaxed">Your package details have been received and it is being prepared for dispatch.</p>
                </div>
              </div>

              {/* Step 2: Transit */}
              <div className="relative flex items-start gap-8 mb-14 group">
                <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shrink-0 border-[4px] transition-all duration-500 ${
                  getStepStatus('TRANSIT', orderData.status) === 'completed' 
                    ? 'bg-indigo-600 border-indigo-100 text-white shadow-lg shadow-indigo-200' 
                    : getStepStatus('TRANSIT', orderData.status) === 'active'
                      ? 'bg-amber-500 border-amber-100 text-white shadow-[0_0_0_8px_rgba(245,158,11,0.15)] scale-110'
                      : 'bg-white border-slate-200 text-slate-300'
                }`}>
                  <Truck className="w-7 h-7" />
                </div>
                <div className="pt-2">
                  <h3 className={`text-xl font-bold transition-colors ${
                    getStepStatus('TRANSIT', orderData.status) !== 'pending' ? 'text-slate-800' : 'text-slate-400'
                  }`}>In Transit</h3>
                  <p className="text-slate-500 mt-2 leading-relaxed">The package has left the facility and is on its way to your delivery address.</p>
                </div>
              </div>

              {/* Step 3: Delivered */}
              <div className="relative flex items-start gap-8 group">
                <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shrink-0 border-[4px] transition-all duration-500 ${
                  getStepStatus('DELIVERED', orderData.status) === 'completed' 
                    ? 'bg-emerald-500 border-emerald-100 text-white shadow-[0_0_0_8px_rgba(16,185,129,0.15)] scale-110' 
                    : 'bg-white border-slate-200 text-slate-300'
                }`}>
                  <CheckCircle className="w-7 h-7" />
                </div>
                <div className="pt-2">
                  <h3 className={`text-xl font-bold transition-colors ${
                    getStepStatus('DELIVERED', orderData.status) === 'completed' ? 'text-slate-800' : 'text-slate-400'
                  }`}>Delivered</h3>
                  <p className="text-slate-500 mt-2 leading-relaxed">Your package has been successfully delivered to the destination.</p>
                  
                  {getStepStatus('DELIVERED', orderData.status) === 'completed' && (
                    <button
                      onClick={handleDownloadInvoice}
                      className="mt-6 flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
                    >
                      <FileText className="w-5 h-5" />
                      Download Invoice
                    </button>
                  )}
                </div>
              </div>

            </div>

              {/* Map Container */}
              <div className="w-full h-80 lg:h-auto min-h-[350px] rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-200 relative z-10">
                <LogisticsMap 
                  pickupCoords={orderData.pickupAddress?.lat ? [orderData.pickupAddress.lat, orderData.pickupAddress.lng] : undefined}
                  deliveryCoords={orderData.deliveryAddress?.lat ? [orderData.deliveryAddress.lat, orderData.deliveryAddress.lng] : undefined}
                />
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
