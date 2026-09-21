"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, MapPin, CheckCircle, Loader2, Send, AlertTriangle, IndianRupee, Calendar, Wallet, CreditCard } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { Toaster, toast } from 'react-hot-toast';

export default function BookParcelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Section 1: Pickup & Delivery Details
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupPincode, setPickupPincode] = useState('');

  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [dropPincode, setDropPincode] = useState('');

  // Section 2: Parcel Details
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [category, setCategory] = useState('DOCUMENT');

  const CATEGORIES = ['DOCUMENT', 'ELECTRONICS', 'CLOTHING', 'FRAGILE', 'LIQUID', 'OTHER'];

  // Section 3: Scheduling
  const [pickupDate, setPickupDate] = useState(new Date().toISOString().split('T')[0]);

  // Section 4: Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'PREPAID' | 'COD'>('PREPAID');

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
      const token = localStorage.getItem('token');
      const initRes = await apiClient.post(`/orders/${orderId}/pay`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!initRes.data.success) {
        throw new Error("Failed to initialize payment");
      }

      const razorpayOrder = initRes.data.data;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_fallback",
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "LogiCore Logistics",
        description: "Parcel Delivery Fee",
        order_id: razorpayOrder.id,
        handler: async function (response: any) {
          try {
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
          name: senderName || "Customer",
          contact: senderPhone || "9999999999",
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
      rzp1.on("payment.failed", function () {
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

  const validateForm = () => {
    if (!/^\d{10}$/.test(senderPhone) || !/^\d{10}$/.test(receiverPhone)) {
      setError("Phone numbers must be exactly 10 digits.");
      return false;
    }
    if (!/^\d{6}$/.test(pickupPincode) || !/^\d{6}$/.test(dropPincode)) {
      setError("Pincodes must be exactly 6 digits.");
      return false;
    }
    if (!pickupDate) {
      setError("Please select a pickup date.");
      return false;
    }
    if (!category) {
      setError("Parcel category is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      // Decode JWT to get customerId
      let customerId = "000000000000000000000000";
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        customerId = tokenPayload.id || tokenPayload.userId || tokenPayload._id || customerId;
      } catch(e) {}

      const payloadData = {
        customerId,
        sender: {
          name: senderName,
          phone: senderPhone,
          fullAddress: pickupAddress,
          pinCode: pickupPincode,
        },
        receiver: {
          name: receiverName,
          phone: receiverPhone,
          fullAddress: dropAddress,
          pinCode: dropPincode,
        },
        parcelDetails: {
          weightKg: parseFloat(weight),
          category: category,
          dimensions: { 
            lengthCm: parseFloat(length), 
            widthCm: parseFloat(width), 
            heightCm: parseFloat(height) 
          }
        },
        pickupDate,
        paymentMethod
      };

      const res = await apiClient.post('/orders', payloadData);

      if (res.data && res.data.success) {
        const orderId = res.data.data?._id || res.data.data?.id;
        
        if (paymentMethod === 'COD') {
          toast.success('Order booked successfully via COD!');
          setTimeout(() => {
            router.push(`/customer/track?id=${orderId}`);
          }, 1500);
        } else {
          toast.success('Order drafted! Redirecting to payment...');
          const totalAmount = res.data.data?.totalAmount || 50;
          handlePayment(orderId, totalAmount);
        }
      }
    } catch (error: any) {
      console.error("Booking Error:", error.response?.data);
      setError(error.response?.data?.message || "Failed to book parcel");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 flex justify-center">
      <Toaster position="top-right" />
      <div className="w-full max-w-5xl space-y-8">
        
        <header className="text-center mb-8 relative pt-8">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3 relative z-10 flex justify-center items-center gap-3">
            <Package className="w-8 h-8 text-indigo-400" />
            Book a Parcel
          </h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto relative z-10">
            Provide the shipment details below to calculate pricing and schedule your pickup slot.
          </p>
        </header>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 backdrop-blur-md relative z-20">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-bold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-20">
          
          {/* Section 1: Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Sender */}
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-3 mb-5">
                <MapPin className="w-5 h-5 text-indigo-400" /> Pickup Details
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" required value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="Sender Name" className="bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
                  <input type="tel" required maxLength={10} value={senderPhone} onChange={e => setSenderPhone(e.target.value.replace(/\D/g, ''))} placeholder="10-digit Phone" className="bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
                </div>
                <input type="text" required value={pickupAddress} onChange={e => setPickupAddress(e.target.value)} placeholder="Full Pickup Address" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
                <input type="text" required maxLength={6} value={pickupPincode} onChange={e => setPickupPincode(e.target.value.replace(/\D/g, ''))} placeholder="6-digit Pincode" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
              </div>
            </div>

            {/* Receiver */}
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-3 mb-5">
                <MapPin className="w-5 h-5 text-emerald-400" /> Delivery Details
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" required value={receiverName} onChange={e => setReceiverName(e.target.value)} placeholder="Receiver Name" className="bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
                  <input type="tel" required maxLength={10} value={receiverPhone} onChange={e => setReceiverPhone(e.target.value.replace(/\D/g, ''))} placeholder="10-digit Phone" className="bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
                </div>
                <input type="text" required value={dropAddress} onChange={e => setDropAddress(e.target.value)} placeholder="Full Drop Address" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
                <input type="text" required maxLength={6} value={dropPincode} onChange={e => setDropPincode(e.target.value.replace(/\D/g, ''))} placeholder="6-digit Pincode" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
              </div>
            </div>

          </div>

          {/* Section 2 & 3: Parcel Details & Scheduling */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Parcel Details */}
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-3 mb-5">
                <Package className="w-5 h-5 text-amber-400" /> Parcel Details
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <input type="number" step="0.1" required value={weight} onChange={e => setWeight(e.target.value)} placeholder="Weight" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">kg</span>
                  </div>
                  <select name="category" value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-amber-500 appearance-none">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="relative">
                    <input type="number" step="0.1" required value={length} onChange={e => setLength(e.target.value)} placeholder="L" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 text-xs">cm</span>
                  </div>
                  <div className="relative">
                    <input type="number" step="0.1" required value={width} onChange={e => setWidth(e.target.value)} placeholder="W" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 text-xs">cm</span>
                  </div>
                  <div className="relative">
                    <input type="number" step="0.1" required value={height} onChange={e => setHeight(e.target.value)} placeholder="H" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 text-xs">cm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scheduling & Payment */}
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-3 mb-5">
                  <Calendar className="w-5 h-5 text-pink-400" /> Scheduling & Payment
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Pickup Date</label>
                    <input type="date" required value={pickupDate} onChange={e => setPickupDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-pink-500" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Payment Method</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setPaymentMethod('PREPAID')} className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all border ${paymentMethod === 'PREPAID' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}>
                        <CreditCard className="w-4 h-4" /> Prepaid
                      </button>
                      <button type="button" onClick={() => setPaymentMethod('COD')} className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all border ${paymentMethod === 'COD' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}>
                        <Wallet className="w-4 h-4" /> COD
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-16 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-2xl font-bold text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(79,70,229,0.3)] hover:shadow-[0_0_60px_rgba(79,70,229,0.5)]"
            >
              {loading ? (
                <><Loader2 className="w-6 h-6 animate-spin" /> Processing...</>
              ) : paymentMethod === 'PREPAID' ? (
                <><IndianRupee className="w-6 h-6" /> Calculate Fare & Pay Now</>
              ) : (
                <><CheckCircle className="w-6 h-6" /> Confirm COD Booking</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
