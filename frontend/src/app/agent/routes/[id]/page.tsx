"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Phone, Navigation, Package, User as UserIcon, ShieldAlert, CheckCircle2, Loader2, MapPin, Camera, PenTool, Map as MapIcon, IndianRupee } from "lucide-react";
import apiClient from "@/lib/apiClient";
import Link from "next/link";

export default function DeliveryExecutionPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [otp, setOtp] = useState("");
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    fetchDeliveryDetails();
  }, [params.id]);

  const fetchDeliveryDetails = async () => {
    try {
      const response = await apiClient.get("/agent/deliveries/active");
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
      const res = await apiClient.post(`/agent/deliveries/${params.id}/verify`, { 
        otp, 
        photoUrl: null, 
        signatureUrl: null 
      });
      if (res.data.success) {
        setShowSuccessToast(true);
        setTimeout(() => {
          router.push("/agent/history");
        }, 1500); // Wait for toast animation
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
  const customerName = "Rahul Verma"; // Mocked if missing
  const customerPhone = order?.customerPhone || "+91 98765 43210";
  const dropAddress = order?.deliveryAddress?.fullAddress || "Sector 17, Chandigarh, 160017";
  const weight = order?.parcelDetails?.weight ? `${order.parcelDetails.weight}kg` : '2.5kg';
  const isFragile = true; // Hardcoded for UI showcase
  const codAmount = 0; // Set to >0 to show COD UI

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-32 relative">
      
      {/* Success Animation Overlay */}
      {showSuccessToast && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-emerald-500 text-white p-6 rounded-3xl shadow-2xl flex flex-col items-center animate-in zoom-in-50 duration-500 bounce">
               <CheckCircle2 className="w-16 h-16 mb-4" />
               <h2 className="text-2xl font-black">Delivered!</h2>
               <p className="font-medium text-emerald-100 mt-1">Redirecting...</p>
            </div>
         </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 shrink-0 sticky top-0 z-20 px-4 py-4 flex items-center gap-4">
        <Link href="/agent/routes" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </Link>
        <div>
          <h1 className="text-lg font-black tracking-tight text-white">{trackingId}</h1>
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Execution View</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Section 1: Customer Info Card */}
        <div className="bg-slate-900 rounded-[2rem] p-5 border border-slate-800 shadow-xl relative overflow-hidden">
           <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Customer Details</h3>
           <div className="flex gap-4 items-start mb-5">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center shrink-0">
                 <UserIcon className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                 <p className="text-lg font-bold text-white leading-tight">{customerName}</p>
                 <p className="text-sm text-slate-400 font-mono mt-0.5">{customerPhone}</p>
              </div>
           </div>
           
           <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 flex gap-3 mb-5">
              <MapPin className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-slate-300 leading-snug">{dropAddress}</p>
           </div>

           {/* Action Buttons */}
           <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 active:bg-slate-600 rounded-xl transition-colors min-h-[48px]">
                 <Navigation className="w-5 h-5 text-blue-400" />
                 <span className="font-bold text-sm text-white">Navigate</span>
              </button>
              <button className="flex items-center justify-center gap-2 py-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 active:bg-emerald-500/30 rounded-xl transition-colors min-h-[48px]">
                 <Phone className="w-5 h-5 text-emerald-400" />
                 <span className="font-bold text-sm text-emerald-400">Call Customer</span>
              </button>
           </div>
        </div>

        {/* Section 2: Parcel Info Card */}
        <div className="bg-slate-900 rounded-[2rem] p-5 border border-slate-800 shadow-xl">
           <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Parcel Information</h3>
           
           <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tracking ID</p>
                 <p className="font-mono text-sm font-bold text-white">{trackingId}</p>
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Weight</p>
                 <p className="text-sm font-bold text-white">{weight}</p>
              </div>
           </div>

           <div className="flex items-center gap-2">
              {isFragile && (
                 <span className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 shrink-0">
                    <ShieldAlert className="w-3.5 h-3.5" /> Fragile
                 </span>
              )}
              {codAmount > 0 ? (
                 <span className="px-3 py-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5" /> Collect ₹{codAmount}
                 </span>
              ) : (
                 <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5">
                    Prepaid
                 </span>
              )}
           </div>
        </div>

        {/* Section 3: Live Map Placeholder */}
        <div className="bg-slate-900 rounded-[2rem] border border-slate-800 shadow-xl overflow-hidden h-48 relative">
           {/* Mocked Map Background */}
           <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%236366f1\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
           }}></div>
           <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <MapIcon className="w-10 h-10 text-indigo-500 mb-2 opacity-80" />
              <div className="bg-slate-950/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-800">
                 <p className="text-xs font-bold text-indigo-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live GPS Routing Active
                 </p>
              </div>
           </div>
        </div>

        {/* Section 4: Proof of Delivery (PoD) Workflow */}
        <div className="bg-gradient-to-b from-slate-900 to-indigo-950/20 rounded-[2rem] p-5 border border-indigo-500/20 shadow-xl">
           <h3 className="text-lg font-black text-white text-center mb-1 flex justify-center items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Delivery Verification
           </h3>
           <p className="text-xs text-slate-400 text-center mb-6">Complete PoD requirements to mark as delivered.</p>
           
           <div className="grid grid-cols-2 gap-3 mb-6">
              <button className="flex flex-col items-center justify-center gap-2 py-4 bg-slate-950/50 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors min-h-[48px]">
                 <Camera className="w-6 h-6 text-indigo-400" />
                 <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Take Photo</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 py-4 bg-slate-950/50 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors min-h-[48px]">
                 <PenTool className="w-6 h-6 text-amber-400" />
                 <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Signature</span>
              </button>
           </div>

           <div className="mb-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 text-center">Customer OTP</p>
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
                 className="w-full bg-slate-950 border-2 border-indigo-500/30 rounded-2xl py-4 text-center text-3xl tracking-[1em] font-mono font-black text-white focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
              />
           </div>
           {error && <p className="text-red-400 text-xs text-center mt-2 font-bold">{error}</p>}
        </div>
      </div>

      {/* Sticky Bottom Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 z-30 pb-safe">
         <div className="max-w-md mx-auto">
            <button 
               onClick={handleVerifyAndDeliver}
               disabled={completing || otp.length !== 6}
               className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-2xl font-black text-lg transition-all disabled:opacity-50 disabled:bg-slate-800 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(16,185,129,0.3)] disabled:shadow-none min-h-[48px] relative overflow-hidden group"
            >
               {completing ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
               ) : (
                  <>
                     <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                     <CheckCircle2 className="w-6 h-6 relative z-10" />
                     <span className="relative z-10">Verify OTP & Mark Delivered</span>
                  </>
               )}
            </button>
         </div>
      </div>

    </div>
  );
}
