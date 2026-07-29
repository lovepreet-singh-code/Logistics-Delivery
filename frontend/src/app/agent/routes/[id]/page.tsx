"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Phone, Navigation, Package, User as UserIcon, ShieldAlert, CheckCircle2, Loader2, MapPin } from "lucide-react";
import apiClient from "@/lib/apiClient";
import Link from "next/link";

export default function DeliveryExecutionPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [otp, setOtp] = useState("");
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDeliveryDetails();
  }, [params.id]);

  const fetchDeliveryDetails = async () => {
    try {
      const response = await apiClient.get("/deliveries/today");
      if (response.data.success && Array.isArray(response.data.data)) {
        const found = response.data.data.find((d: any) => d._id === params.id);
        if (found) {
          setDelivery(found);
        } else {
          setError("Delivery not found or already completed.");
        }
      }
    } catch (err) {
      setError("Failed to load delivery details.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndDeliver = async () => {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }
    setError("");
    setCompleting(true);
    try {
      // Typically you'd verify OTP in backend, but patching status for now
      const res = await apiClient.patch(`/deliveries/${params.id}`, { status: "DELIVERED" });
      if (res.data.success) {
        alert("🎉 OTP Verified! Delivery marked as complete.");
        router.push("/agent/routes");
      } else {
        setError(res.data.message || "Failed to mark delivered.");
      }
    } catch (err) {
      setError("Network error occurred.");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-indigo-500 gap-4">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="text-slate-400 font-medium">Loading details...</p>
      </div>
    );
  }

  if (error || !delivery) {
    return (
      <div className="p-6 bg-slate-950 h-screen flex flex-col items-center justify-center text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Error</h2>
        <p className="text-slate-400 mb-8">{error}</p>
        <Link href="/agent/routes" className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold">Go Back</Link>
      </div>
    );
  }

  const order = delivery.orderId;
  const trackingId = order?._id?.slice(-8).toUpperCase() || "UNKNOWN";
  const customerName = "Customer Profile"; // Mocked if missing
  const customerPhone = order?.customerPhone || "+91 98765 43210";
  const dropAddress = order?.deliveryAddress?.fullAddress || "Address not available";
  const weight = order?.parcelDetails?.weight ? `${order.parcelDetails.weight}kg` : '2.5kg';
  const isFragile = true; // Hardcoded for UI showcase

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-safe">
      
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 shrink-0 sticky top-0 z-20 px-4 py-4 flex items-center gap-4">
        <Link href="/agent/routes" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </Link>
        <div>
          <h1 className="text-lg font-black tracking-tight text-white">{trackingId}</h1>
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Execution View</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Customer Details */}
        <div className="bg-slate-900 rounded-[2rem] p-5 border border-slate-800 shadow-xl relative overflow-hidden">
           <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Drop Information</h3>
           <div className="flex gap-4 items-start mb-5">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center shrink-0">
                 <UserIcon className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                 <p className="text-lg font-bold text-white leading-tight">{customerName}</p>
                 <p className="text-sm text-slate-400 font-mono mt-0.5">{customerPhone}</p>
              </div>
           </div>
           
           <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 flex gap-3">
              <MapPin className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-slate-300 leading-snug">{dropAddress}</p>
           </div>
        </div>

        {/* Parcel Details */}
        <div className="bg-slate-900 rounded-[2rem] p-5 border border-slate-800 shadow-xl">
           <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Parcel Details</h3>
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-slate-400" />
                 </div>
                 <div>
                    <p className="text-sm font-bold text-white">Standard Box</p>
                    <p className="text-xs text-slate-400 font-mono">Weight: {weight}</p>
                 </div>
              </div>
              {isFragile && (
                 <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> Fragile
                 </span>
              )}
           </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-3">
           <button className="flex items-center justify-center gap-2 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 active:bg-slate-700 rounded-2xl transition-colors shadow-lg">
              <Phone className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-sm text-white">Call Customer</span>
           </button>
           <button className="flex items-center justify-center gap-2 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 active:bg-slate-700 rounded-2xl transition-colors shadow-lg">
              <Navigation className="w-5 h-5 text-blue-400" />
              <span className="font-bold text-sm text-white">Navigate</span>
           </button>
        </div>

        {/* OTP Workflow */}
        <div className="bg-gradient-to-b from-indigo-900/40 to-slate-900 rounded-[2rem] p-6 border border-indigo-500/20 shadow-xl shadow-indigo-500/5 mt-4">
           <h3 className="text-lg font-black text-white text-center mb-1">Verify Delivery</h3>
           <p className="text-xs text-slate-400 text-center mb-6">Ask the customer for their 6-digit delivery pin.</p>
           
           <div className="mb-6 relative">
              <input 
                 type="text" 
                 inputMode="numeric" 
                 maxLength={6}
                 value={otp}
                 onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setOtp(val);
                    setError("");
                 }}
                 placeholder="------"
                 className="w-full bg-slate-950/80 border-2 border-indigo-500/30 rounded-2xl py-4 text-center text-3xl tracking-[1em] font-mono font-black text-white focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
              />
           </div>

           <button 
              onClick={handleVerifyAndDeliver}
              disabled={completing || otp.length !== 6}
              className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-2xl font-black text-base uppercase tracking-widest transition-all disabled:opacity-50 disabled:bg-slate-800 flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/25 relative overflow-hidden group"
           >
              {completing ? (
                 <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                 <>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <CheckCircle2 className="w-6 h-6 relative z-10" />
                    <span className="relative z-10">Verify & Deliver</span>
                 </>
              )}
           </button>
        </div>
      </div>
    </div>
  );
}
