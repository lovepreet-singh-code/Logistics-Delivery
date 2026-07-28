"use client";

import { useState } from 'react';

export default function CustomerDashboard() {
  const [orderId, setOrderId] = useState('');
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // SVG Icons for the timeline
  const Icons = {
    Package: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>,
    Truck: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path></svg>,
    MapPin: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>,
    CheckCircle: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
    Search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
  };

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setLoading(true);
    setError('');
    setTrackingData(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/orders/${orderId}/track`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to track order. Please check the Order ID.');
      }

      // Setting the actual order data from the response
      setTrackingData(result.data || result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Status logic based on standard logistics flow
  const getStepStatus = (stepName: string, currentStatus: string) => {
    const statuses = ['PENDING', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    const currentIndex = statuses.indexOf(currentStatus || 'PENDING');
    const stepIndex = statuses.indexOf(stepName);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white font-sans flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="w-full max-w-2xl text-center mb-10">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 mb-4">
          Track Your Delivery
        </h1>
        <p className="text-slate-400">Enter your Order ID below to get real-time tracking updates.</p>
      </div>

      {/* Search Bar */}
      <div className="w-full max-w-2xl bg-[#151921] border border-slate-800 rounded-2xl p-4 shadow-2xl mb-8">
        <form onSubmit={handleTrackOrder} className="flex gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Icons.Search />
            </div>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. 6a67897408f2d1600fd74e94"
              className="block w-full pl-10 pr-3 py-4 border border-slate-700 rounded-xl bg-[#0B0E14] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center min-w-[120px]"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="w-full max-w-2xl p-4 mb-8 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-center">
          {error}
        </div>
      )}

      {/* Tracking Results */}
      {trackingData && (
        <div className="w-full max-w-2xl bg-[#151921] border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Glassy Background Glows */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>

          <div className="flex justify-between items-start mb-8 border-b border-slate-800 pb-6 relative z-10">
            <div>
              <p className="text-slate-400 text-sm mb-1">Order ID</p>
              <h3 className="text-lg font-mono font-semibold text-slate-200">{trackingData._id}</h3>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm mb-1">Current Status</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                trackingData.status === 'DELIVERED' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                'bg-blue-500/10 text-blue-400 border-blue-500/20'
              }`}>
                {trackingData.status || 'PENDING'}
              </span>
            </div>
          </div>

          {/* Vertical Timeline */}
          <div className="relative pl-4 sm:pl-6 space-y-8 z-10 before:absolute before:inset-0 before:ml-[33px] sm:before:ml-[41px] before:w-0.5 before:bg-slate-800 before:z-[-1]">
            
            {/* Step 1: Order Placed */}
            <div className="relative flex items-center group">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#151921] shrink-0 mr-4 shadow-lg transition-colors ${
                getStepStatus('PENDING', trackingData.status) === 'completed' || getStepStatus('PENDING', trackingData.status) === 'current' 
                ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'
              }`}>
                <Icons.Package />
              </div>
              <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 flex-1">
                <h4 className="font-bold text-slate-200">Order Placed</h4>
                <p className="text-sm text-slate-400 mt-1">
                  Origin: {trackingData.pickupAddress?.fullAddress || trackingData.pickupAddress?.city || 'Awaiting Details'}
                </p>
              </div>
            </div>

            {/* Step 2: In Transit */}
            <div className="relative flex items-center group">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#151921] shrink-0 mr-4 shadow-lg transition-colors ${
                getStepStatus('IN_TRANSIT', trackingData.status) === 'completed' || getStepStatus('IN_TRANSIT', trackingData.status) === 'current' 
                ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-400'
              }`}>
                <Icons.Truck />
              </div>
              <div className={`p-4 rounded-xl border flex-1 transition-colors ${
                 getStepStatus('IN_TRANSIT', trackingData.status) !== 'pending' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-slate-900/20 border-transparent opacity-50'
              }`}>
                <h4 className={`font-bold ${getStepStatus('IN_TRANSIT', trackingData.status) !== 'pending' ? 'text-slate-200' : 'text-slate-500'}`}>In Transit</h4>
                <p className="text-sm text-slate-400 mt-1">Package is on the move</p>
              </div>
            </div>

            {/* Step 3: Delivered */}
            <div className="relative flex items-center group">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#151921] shrink-0 mr-4 shadow-lg transition-colors ${
                getStepStatus('DELIVERED', trackingData.status) === 'completed' || getStepStatus('DELIVERED', trackingData.status) === 'current' 
                ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-400'
              }`}>
                <Icons.CheckCircle />
              </div>
              <div className={`p-4 rounded-xl border flex-1 transition-colors ${
                 getStepStatus('DELIVERED', trackingData.status) !== 'pending' ? 'bg-slate-800/30 border-green-500/20' : 'bg-slate-900/20 border-transparent opacity-50'
              }`}>
                <h4 className={`font-bold ${getStepStatus('DELIVERED', trackingData.status) !== 'pending' ? 'text-green-400' : 'text-slate-500'}`}>Delivered Successfully</h4>
                <p className="text-sm text-slate-400 mt-1">
                  Destination: {trackingData.deliveryAddress?.fullAddress || trackingData.deliveryAddress?.city || 'Awaiting Details'}
                </p>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}