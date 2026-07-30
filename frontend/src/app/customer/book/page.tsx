"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Package, User, Phone, MapPin, CheckCircle, Loader2, Send } from 'lucide-react';

export default function BookParcelPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderAddress, setSenderAddress] = useState('');
  const [senderPincode, setSenderPincode] = useState('');

  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [receiverPincode, setReceiverPincode] = useState('');

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
          fullAddress: senderAddress,
          pinCode: senderPincode,
          senderName: senderName,
          senderPhone: senderPhone,
        },
        deliveryAddress: {
          fullAddress: receiverAddress,
          pinCode: receiverPincode,
          receiverName: receiverName,
          receiverPhone: receiverPhone,
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
    <div className="min-h-screen bg-[#0B0E14] text-white p-6 font-sans selection:bg-indigo-500/30 pb-32">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="text-center mb-8 mt-4 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 drop-shadow-sm relative z-10 flex justify-center items-center gap-3">
            <Package className="w-8 h-8 text-indigo-500" />
            Book a Parcel
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto relative z-10">
            Fill in the details below to schedule a secure pickup and delivery.
          </p>
        </header>

        {/* Form Container */}
        <div className="bg-slate-900/50 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] shadow-2xl border border-slate-800 relative z-20">
          
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col items-center text-center">
              <span className="text-red-400 text-sm font-bold">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center gap-3 text-emerald-400 animate-in fade-in zoom-in duration-300">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-bold">{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Sender Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-2">
                <MapPin className="w-4 h-4 text-indigo-400" /> Sender Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type="text" 
                    required 
                    value={senderName} 
                    onChange={(e) => setSenderName(e.target.value)} 
                    placeholder="Sender Name" 
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" 
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type="tel" 
                    required 
                    value={senderPhone} 
                    onChange={(e) => setSenderPhone(e.target.value)} 
                    placeholder="Phone Number" 
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" 
                  />
                </div>
                <div className="relative md:col-span-2 flex gap-4">
                  <input 
                    type="text" 
                    required 
                    value={senderAddress} 
                    onChange={(e) => setSenderAddress(e.target.value)} 
                    placeholder="Full Pickup Address" 
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" 
                  />
                  <input 
                    type="text" 
                    required 
                    value={senderPincode} 
                    onChange={(e) => setSenderPincode(e.target.value)} 
                    placeholder="PIN Code" 
                    className="w-32 shrink-0 bg-slate-950/50 border border-slate-800 rounded-xl py-3 px-4 text-center text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" 
                  />
                </div>
              </div>
            </div>

            {/* Receiver Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-2">
                <MapPin className="w-4 h-4 text-emerald-400" /> Receiver Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type="text" 
                    required 
                    value={receiverName} 
                    onChange={(e) => setReceiverName(e.target.value)} 
                    placeholder="Receiver Name" 
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" 
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type="tel" 
                    required 
                    value={receiverPhone} 
                    onChange={(e) => setReceiverPhone(e.target.value)} 
                    placeholder="Phone Number" 
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" 
                  />
                </div>
                <div className="relative md:col-span-2 flex gap-4">
                  <input 
                    type="text" 
                    required 
                    value={receiverAddress} 
                    onChange={(e) => setReceiverAddress(e.target.value)} 
                    placeholder="Full Delivery Address" 
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" 
                  />
                  <input 
                    type="text" 
                    required 
                    value={receiverPincode} 
                    onChange={(e) => setReceiverPincode(e.target.value)} 
                    placeholder="PIN Code" 
                    className="w-32 shrink-0 bg-slate-950/50 border border-slate-800 rounded-xl py-3 px-4 text-center text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" 
                  />
                </div>
              </div>
            </div>

            {/* Parcel Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-2">
                <Package className="w-4 h-4 text-amber-400" /> Parcel Details
              </h3>
              <div className="relative w-1/2">
                <input 
                  type="number" 
                  step="0.1"
                  required 
                  value={weight} 
                  onChange={(e) => setWeight(e.target.value)} 
                  placeholder="Weight (kg)" 
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all" 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">kg</span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:bg-slate-800 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:shadow-none"
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
