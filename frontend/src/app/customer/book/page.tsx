"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, MapPin, CheckCircle, Loader2, Send, AlertTriangle, IndianRupee } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { Toaster, toast } from 'react-hot-toast';

export default function BookParcelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [pickupAddress, setPickupAddress] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [weight, setWeight] = useState('');

  // Dynamically load Razorpay SDK
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async (orderId: string, amount: number) => {
    try {
      // 1. Initialize Payment on Backend
      const token = localStorage.getItem('token');
      const initRes = await apiClient.post(`/orders/${orderId}/pay`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!initRes.data.success) {
        throw new Error("Failed to initialize payment");
      }

      const razorpayOrder = initRes.data.data;

      // 2. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_fallback",
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "LogiCore Logistics",
        description: "Parcel Delivery Fee",
        order_id: razorpayOrder.id,
        handler: async function (response: any) {
          try {
            // 3. Verify Payment
            const verifyRes = await apiClient.post(`/orders/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (verifyRes.data.success) {
              toast.success("Payment successful! Order booked.");
              setTimeout(() => {
                router.push(`/customer/track?id=${orderId}`);
              }, 1500);
            }
          } catch (verifyErr) {
            console.error(verifyErr);
            toast.error("Payment verification failed.");
            setLoading(false);
          }
        },
        prefill: {
          name: "Customer",
          email: "customer@logicore.com",
          contact: "9999999999",
        },
        theme: {
          color: "#4f46e5",
        },
        modal: {
          ondismiss: function () {
            toast.error("Payment was cancelled.");
            setLoading(false);
          }
        }
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.on("payment.failed", function (response: any) {
        toast.error("Payment failed. Please try again.");
        setLoading(false);
      });
      rzp1.open();

    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to process payment");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      // Decode JWT to get customerId
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const customerId = tokenPayload.id || tokenPayload.userId || tokenPayload._id;

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
          parcelType: "Box",
          dimensions: { lengthCm: 20, widthCm: 20, heightCm: 20 }
        }
      };

      // Step 1: Create Order
      const res = await apiClient.post('/orders', payloadData);

      if (res.data && res.data.success) {
        toast.success('Order drafted! Redirecting to payment...');
        const orderId = res.data.data?._id || res.data.data?.id;
        const totalAmount = res.data.data?.totalAmount || 50; // Fallback
        
        // Step 2 & 3: Handle Razorpay Payment
        handlePayment(orderId, totalAmount);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to book parcel. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <Toaster position="top-right" />
      <div className="w-full max-w-2xl space-y-12">
        <header className="text-center mb-8 mt-4 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2 drop-shadow-sm relative z-10 flex justify-center items-center gap-3">
            <Package className="w-8 h-8 text-indigo-500" />
            Book a Parcel
          </h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto relative z-10">
            Provide the basic details below to calculate dynamic pricing and schedule your delivery.
          </p>
        </header>

        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 relative z-20">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-bold">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                <MapPin className="w-4 h-4 text-indigo-500" /> Pickup Details
              </h3>
              <input 
                type="text" 
                required 
                value={pickupAddress} 
                onChange={(e) => setPickupAddress(e.target.value)} 
                placeholder="Full Pickup Address" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium shadow-inner" 
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2 mt-4">
                <MapPin className="w-4 h-4 text-emerald-500" /> Delivery Details
              </h3>
              <input 
                type="text" 
                required 
                value={dropAddress} 
                onChange={(e) => setDropAddress(e.target.value)} 
                placeholder="Full Drop Address" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium shadow-inner" 
              />
            </div>

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

            <div className="pt-6">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:bg-slate-300 flex items-center justify-center gap-3 shadow-lg shadow-indigo-200 disabled:shadow-none"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                ) : (
                  <><IndianRupee className="w-5 h-5" /> Calculate Fare & Pay</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
