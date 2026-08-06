"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import 'leaflet/dist/leaflet.css';
import dynamic from 'next/dynamic';
import { Package, Truck, CheckCircle, Search, AlertTriangle, FileText, User, Phone, Clock, Car, Building, MapPin, ShieldAlert } from 'lucide-react';

const Map = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });

export default function CustomerDashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const [orderIdInput, setOrderIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const idFromQuery = params.get('id');
      if (idFromQuery) {
        setOrderIdInput(idFromQuery);
        handleTrackOrder(undefined, idFromQuery);
      }
    }
  }, []);

  const handleTrackOrder = async (e?: React.FormEvent, overrideId?: string) => {
    if (e) e.preventDefault();
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/';
      return;
    }

    const trackingId = overrideId || orderIdInput.trim();
    if (!trackingId) return;

    try {
      setLoading(true);
      setError('');
      setOrderData(null);
      
      const res = await axios.get(`http://localhost:8080/api/orders/${trackingId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // Ensure we extract the data object according to standard backend response { success: true, data: { ... } }
      setOrderData(res?.data?.data || res?.data);
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
  const getStepStatus = (step: 'ORDER_PLACED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DESTINATION_HUB' | 'OUT_FOR_DELIVERY' | 'DELIVERED', currentStatus: string) => {
    const statuses = ['ORDER_PLACED', 'PICKED_UP', 'IN_TRANSIT', 'DESTINATION_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    // Map legacy PENDING to ORDER_PLACED safely
    if (currentStatus === 'PENDING') currentStatus = 'ORDER_PLACED';
    
    const currentIndex = statuses.indexOf(currentStatus?.toUpperCase());
    if (currentIndex === -1) return 'pending'; // Unknown status defaults to pending
    
    const targetIndex = statuses.indexOf(step);
    
    if (currentIndex > targetIndex) return 'completed';
    if (currentIndex === targetIndex) return 'active';
    return 'pending';
  };

  if (!isMounted) return null; // Server par kuch render mat karo

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

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 pb-8 border-b border-slate-100 relative z-10 gap-6">
              <div>
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">Order Number</p>
                <p className="text-2xl font-bold text-slate-800 bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500 font-mono tracking-tight">
                  {orderData._id || orderData.id || orderIdInput}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4 md:text-right">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Driver Assigned</p>
                    <p className="text-sm font-bold text-slate-900">{orderData.agentId?.name || "Rajesh Kumar"}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" /> {orderData.agentId?.phone || "+91 98765 43210"}</p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <Car className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehicle Details</p>
                    <p className="text-sm font-bold text-slate-900">{orderData.vehicleId?.model || "Tata Ace"}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{orderData.vehicleId?.licensePlate || "MH-12-AB-3456"}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 md:text-right mt-4 md:mt-6">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Building className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Hub</p>
                    <p className="text-sm font-bold text-slate-900">Mumbai Central Sort Facility</p>
                    <p className="text-xs text-slate-500 mt-0.5">Processed 2 hours ago</p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Arrival</p>
                    <p className="text-sm font-bold text-slate-900">Today, 5:00 PM</p>
                    <div className="mt-1">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        orderData.status === 'DELIVERED' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : orderData.status === 'IN_TRANSIT' || orderData.status === 'OUT_FOR_DELIVERY'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {orderData.status?.replace(/_/g, ' ') || 'UNKNOWN'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Layout for Timeline and Map */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
              
              {/* Vertical Timeline */}
              <div className="relative pl-4 sm:pl-8 py-4 z-10 w-full max-w-md mx-auto lg:mx-0">
              
              {/* Vertical line connecting steps */}
              <div className="absolute left-[47px] top-8 bottom-8 w-1 bg-slate-100 rounded-full"></div>

              {/* Step 1: Order Placed */}
              <div className="relative flex items-start gap-8 mb-10 group">
                <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shrink-0 border-[4px] transition-all duration-500 ${
                  getStepStatus('ORDER_PLACED', orderData.status) === 'completed' || getStepStatus('ORDER_PLACED', orderData.status) === 'active'
                    ? 'bg-indigo-600 border-indigo-100 text-white shadow-lg shadow-indigo-200' 
                    : 'bg-white border-slate-200 text-slate-300'
                }`}>
                  <Package className="w-7 h-7" />
                </div>
                <div className="pt-2">
                  <h3 className={`text-lg font-bold transition-colors ${
                    getStepStatus('ORDER_PLACED', orderData.status) !== 'pending' ? 'text-slate-800' : 'text-slate-400'
                  }`}>Order Placed</h3>
                  <p className="text-sm text-slate-500 mt-1">Order received and processed.</p>
                </div>
              </div>

              {/* Step 2: Picked Up - Origin Hub */}
              <div className="relative flex items-start gap-8 mb-10 group">
                <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shrink-0 border-[4px] transition-all duration-500 ${
                  getStepStatus('PICKED_UP', orderData.status) === 'completed'
                    ? 'bg-indigo-600 border-indigo-100 text-white shadow-lg' 
                    : getStepStatus('PICKED_UP', orderData.status) === 'active'
                      ? 'bg-amber-500 border-amber-100 text-white shadow-[0_0_0_6px_rgba(245,158,11,0.15)] scale-105'
                      : 'bg-white border-slate-200 text-slate-300'
                }`}>
                  <Building className="w-6 h-6" />
                </div>
                <div className="pt-2">
                  <h3 className={`text-lg font-bold transition-colors ${
                    getStepStatus('PICKED_UP', orderData.status) !== 'pending' ? 'text-slate-800' : 'text-slate-400'
                  }`}>Picked Up - Origin Hub</h3>
                  <p className="text-sm text-slate-500 mt-1">Package collected and scanned at origin.</p>
                </div>
              </div>

              {/* Step 3: In Transit */}
              <div className="relative flex items-start gap-8 mb-10 group">
                <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shrink-0 border-[4px] transition-all duration-500 ${
                  getStepStatus('IN_TRANSIT', orderData.status) === 'completed'
                    ? 'bg-indigo-600 border-indigo-100 text-white shadow-lg' 
                    : getStepStatus('IN_TRANSIT', orderData.status) === 'active'
                      ? 'bg-amber-500 border-amber-100 text-white shadow-[0_0_0_6px_rgba(245,158,11,0.15)] scale-105'
                      : 'bg-white border-slate-200 text-slate-300'
                }`}>
                  <Truck className="w-6 h-6" />
                </div>
                <div className="pt-2">
                  <h3 className={`text-lg font-bold transition-colors ${
                    getStepStatus('IN_TRANSIT', orderData.status) !== 'pending' ? 'text-slate-800' : 'text-slate-400'
                  }`}>In Transit</h3>
                  <p className="text-sm text-slate-500 mt-1">Package is moving between facilities.</p>
                </div>
              </div>

              {/* Step 4: Reached Destination Hub */}
              <div className="relative flex items-start gap-8 mb-10 group">
                <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shrink-0 border-[4px] transition-all duration-500 ${
                  getStepStatus('DESTINATION_HUB', orderData.status) === 'completed'
                    ? 'bg-indigo-600 border-indigo-100 text-white shadow-lg' 
                    : getStepStatus('DESTINATION_HUB', orderData.status) === 'active'
                      ? 'bg-amber-500 border-amber-100 text-white shadow-[0_0_0_6px_rgba(245,158,11,0.15)] scale-105'
                      : 'bg-white border-slate-200 text-slate-300'
                }`}>
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="pt-2">
                  <h3 className={`text-lg font-bold transition-colors ${
                    getStepStatus('DESTINATION_HUB', orderData.status) !== 'pending' ? 'text-slate-800' : 'text-slate-400'
                  }`}>Reached Destination Hub</h3>
                  <p className="text-sm text-slate-500 mt-1">Arrived at final sorting facility.</p>
                </div>
              </div>

              {/* Step 5: Out for Delivery */}
              <div className="relative flex items-start gap-8 mb-10 group">
                <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shrink-0 border-[4px] transition-all duration-500 ${
                  getStepStatus('OUT_FOR_DELIVERY', orderData.status) === 'completed'
                    ? 'bg-indigo-600 border-indigo-100 text-white shadow-lg' 
                    : getStepStatus('OUT_FOR_DELIVERY', orderData.status) === 'active'
                      ? 'bg-amber-500 border-amber-100 text-white shadow-[0_0_0_6px_rgba(245,158,11,0.15)] scale-105'
                      : 'bg-white border-slate-200 text-slate-300'
                }`}>
                  <User className="w-6 h-6" />
                </div>
                <div className="pt-2">
                  <h3 className={`text-lg font-bold transition-colors ${
                    getStepStatus('OUT_FOR_DELIVERY', orderData.status) !== 'pending' ? 'text-slate-800' : 'text-slate-400'
                  }`}>Out For Delivery</h3>
                  <p className="text-sm text-slate-500 mt-1">Driver is out to deliver your package.</p>
                </div>
              </div>

              {/* Step 6: Delivered */}
              <div className="relative flex items-start gap-8 group">
                <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shrink-0 border-[4px] transition-all duration-500 ${
                  getStepStatus('DELIVERED', orderData.status) === 'completed' || getStepStatus('DELIVERED', orderData.status) === 'active'
                    ? 'bg-emerald-500 border-emerald-100 text-white shadow-[0_0_0_8px_rgba(16,185,129,0.15)] scale-110' 
                    : 'bg-white border-slate-200 text-slate-300'
                }`}>
                  <CheckCircle className="w-7 h-7" />
                </div>
                <div className="pt-2">
                  <h3 className={`text-lg font-bold transition-colors ${
                    getStepStatus('DELIVERED', orderData.status) !== 'pending' ? 'text-slate-800' : 'text-slate-400'
                  }`}>Delivered</h3>
                  <p className="text-sm text-slate-500 mt-1">Successfully delivered to the destination.</p>
                  
                  {(getStepStatus('DELIVERED', orderData.status) === 'completed' || getStepStatus('DELIVERED', orderData.status) === 'active') && (
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

              {/* Secure OTP Display */}
              {orderData.status !== 'DELIVERED' && orderData.otp && (
                <div className="mt-8 p-6 bg-indigo-50 border-2 border-indigo-100 rounded-2xl relative overflow-hidden group shadow-inner ml-4 sm:ml-8 max-w-sm">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                  <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-indigo-600" /> Secure Delivery OTP
                  </h4>
                  <p className="text-xs text-indigo-700/80 mb-4 font-medium">Share this pin with the delivery agent to receive your package.</p>
                  <div className="bg-white px-6 py-4 rounded-xl border border-indigo-100 shadow-sm inline-block">
                    <span className="text-3xl font-black text-indigo-600 tracking-[0.25em] font-mono">{orderData.otp}</span>
                  </div>
                </div>
              )}

            </div>

              {/* Map Container */}
              <div className="w-full h-full min-h-[500px] rounded-xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-200 relative z-10">
                <Map 
                  center={
                    orderData.deliveryAddress?.lat 
                      ? [orderData.deliveryAddress.lat, orderData.deliveryAddress.lng] 
                      : [28.6139, 77.2090]
                  } 
                  zoom={12} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                </Map>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
