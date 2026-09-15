"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Package, MapPin, CheckCircle, Loader2, Send } from 'lucide-react';

export default function BookParcelPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [weight, setWeight] = useState('');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/';
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Decode JWT to get customerId
      const payload = JSON.parse(atob(token.split('.')[1]));
      const customerId = payload.id || payload.userId || payload._id;

      const payloadData = {
        customerId,
        pickupAddress: {
          fullAddress: pickupAddress,
          pinCode: "000000",
        },
        deliveryAddress: {
          fullAddress: dropAddress,
          pinCode: "000000",
        },
        parcelDetails: {
          weightKg: parseFloat(weight),
          parcelType: "Box", // Default
          dimensions: {
            lengthCm: 20,
            widthCm: 20,
            heightCm: 20
          }
        }
      };

      const res = await axios.post('http://localhost:8080/api/orders', payloadData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data && res.data.success) {
        setSuccess('Order created successfully!');
        const orderId = res.data.data?._id || res.data.data?.id;
        
        setTimeout(() => {
          if (orderId) {
            router.push(`/customer/track?id=${orderId}`);
          } else {
            router.push('/customer/track');
          }
        }, 1500);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to book parcel. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-12">
        
        {/* Header */}
        <header className="text-center mb-8 mt-4 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2 drop-shadow-sm relative z-10 flex justify-center items-center gap-3">
            <Package className="w-8 h-8 text-indigo-500" />
            Book a Parcel
          </h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto relative z-10">
            Provide the basic details below to schedule your pickup and delivery.
          </p>
        </header>

        {/* Form Container */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 relative z-20">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex flex-col items-center text-center">
              <span className="text-red-700 text-sm font-bold">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center gap-3 text-emerald-700 animate-in fade-in zoom-in duration-300">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-bold">{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Pickup Address */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                <MapPin className="w-4 h-4 text-indigo-500" /> Pickup Details
              </h3>
              <div className="relative">
                <input 
                  type="text" 
                  required 
                  value={pickupAddress} 
                  onChange={(e) => setPickupAddress(e.target.value)} 
                  placeholder="Full Pickup Address" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium shadow-inner" 
                />
              </div>
            </div>

            {/* Drop Address */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2 mt-4">
                <MapPin className="w-4 h-4 text-emerald-500" /> Delivery Details
              </h3>
              <div className="relative">
                <input 
                  type="text" 
                  required 
                  value={dropAddress} 
                  onChange={(e) => setDropAddress(e.target.value)} 
                  placeholder="Full Drop Address" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium shadow-inner" 
                />
              </div>
            </div>

            {/* Parcel Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2 mt-4">
                <Package className="w-4 h-4 text-amber-500" /> Parcel Details
              </h3>
              <div className="relative w-full">
                <input 
                  type="number" 
                  step="0.1"
                  required 
                  value={weight} 
                  onChange={(e) => setWeight(e.target.value)} 
                  placeholder="Weight" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 pr-12 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium shadow-inner" 
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">kg</span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:bg-slate-300 flex items-center justify-center gap-3 shadow-lg shadow-indigo-200 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Book Parcel
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
