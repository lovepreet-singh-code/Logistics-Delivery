"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Phone, Navigation, Package, User as UserIcon, ShieldAlert, CheckCircle2, Loader2, MapPin, Camera, PenTool, Map as MapIcon, IndianRupee, Trash2, AlertTriangle, UploadCloud } from "lucide-react";
import apiClient from "@/lib/apiClient";
import axios from "axios";
import Link from "next/link";
import { io } from "socket.io-client";
import SignatureCanvas from "react-signature-canvas";
import { Toaster, toast } from 'react-hot-toast';

export default function DeliveryExecutionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [otp, setOtp] = useState("");
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  
  // Exception Modal State
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [exceptionReason, setExceptionReason] = useState("");
  const [damagedImageBase64, setDamagedImageBase64] = useState("");
  const [reportingException, setReportingException] = useState(false);
  
  // COD State
  const [cashCollected, setCashCollected] = useState(false);

  const sigCanvas = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [liveTracking, setLiveTracking] = useState(false);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    const newSocket = io("http://localhost:8080");
    setSocket(newSocket);
    return () => { newSocket.disconnect(); };
  }, []);

  useEffect(() => {
    let watchId: number;
    if (liveTracking && socket && id) {
      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            socket.emit("agentLocationUpdate", {
              trackingId: id,
              lat: latitude,
              lng: longitude,
            });
          },
          (err) => {
            console.error("GPS Error:", err);
            setSubmitError("Location tracking failed. Please enable GPS permissions.");
            setLiveTracking(false);
          },
          { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );
      } else {
        setSubmitError("Geolocation is not supported by your browser.");
        setLiveTracking(false);
      }
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [liveTracking, socket, id]);

  useEffect(() => {
    if (id) fetchDeliveryDetails();
  }, [id]);

  const fetchDeliveryDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/";
        return;
      }
      const response = await axios.get(`http://localhost:8080/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success && response.data.data) {
        setDelivery(response.data.data);
      } else {
        setError("Delivery not found or already completed.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load delivery details.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndDeliver = async () => {
    if (otp.length !== 6) {
      setSubmitError("Please enter a valid 6-digit OTP.");
      return;
    }
    if (sigCanvas.current?.isEmpty()) {
      setSubmitError("Customer signature is required.");
      return;
    }
    const signatureBase64 = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');

    setSubmitError("");
    setCompleting(true);
    try {
      const token = localStorage.getItem("token");
      
      const podResponse = await axios.post(`http://localhost:8080/api/orders/${id}/pod`, {
        signatureBase64
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!podResponse.data.success) {
        setSubmitError(podResponse.data.message || "Failed to upload signature to cloud.");
        setCompleting(false);
        return;
      }

      const response = await axios.patch(`http://localhost:8080/api/orders/${id}/status`, { 
        status: 'DELIVERED',
        otp,
        signatureBase64
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setShowSuccessToast(true);
        setTimeout(() => {
          router.push("/agent/routes");
        }, 1500); 
      } else {
        setSubmitError(response.data.message || "Failed to mark delivered.");
      }
    } catch (err: any) {
      if (err.response && err.response.status === 400 && err.response.data.message) {
        setSubmitError(err.response.data.message);
      } else {
        setSubmitError("Network error occurred during delivery completion.");
      }
    } finally {
      setCompleting(false);
    }
  };

  const handleReportException = async () => {
    if (!exceptionReason) return toast.error("Select a reason.");
    if (exceptionReason === "Parcel Damaged" && !damagedImageBase64) return toast.error("Damage photo required.");

    setReportingException(true);
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`http://localhost:8080/api/orders/${id}/exception`, {
        status: exceptionReason === "Parcel Damaged" ? "RTO" : "ATTEMPT_FAILED",
        exceptionReason,
        base64Image: damagedImageBase64
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Exception logged.");
      setShowExceptionModal(false);
      setTimeout(() => router.push("/agent/routes"), 1500);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to report exception.");
    } finally {
      setReportingException(false);
    }
  };

  const handleCaptureImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setDamagedImageBase64(reader.result as string);
      reader.readAsDataURL(file);
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

  const order = delivery.orderId || delivery;
  const trackingId = order?._id?.slice(-8).toUpperCase() || "UNKNOWN";
  const customerName = order?.pickupAddress?.senderName || "Customer"; 
  const customerPhone = order?.deliveryAddress?.receiverPhone || order?.customerPhone || "9999999999";
  const dropLat = order?.deliveryAddress?.lat;
  const dropLng = order?.deliveryAddress?.lng;
  const dropAddress = order?.deliveryAddress?.fullAddress || "Address not provided";
  const weight = order?.parcelDetails?.weightKg ? `${order.parcelDetails.weightKg}kg` : '1kg';
  const paymentMethod = order?.paymentMethod || "PREPAID";
  const totalAmount = order?.totalAmount || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-40 relative">
      <Toaster position="top-right" />
      
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

      {/* Exception Modal Overlay */}
      {showExceptionModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 border border-slate-800 animate-in slide-in-from-bottom-10 sm:zoom-in-95">
            <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" /> Report Issue
            </h3>
            <p className="text-sm text-slate-400 mb-6">Log an exception for this delivery. This updates the backend tracking.</p>
            
            <div className="space-y-4">
              <select
                value={exceptionReason}
                onChange={(e) => setExceptionReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-red-500 font-medium"
              >
                <option value="">Select Reason...</option>
                <option value="Customer Unavailable">Customer Unavailable</option>
                <option value="Address Not Found">Address Not Found</option>
                <option value="Parcel Damaged">Parcel Damaged (RTO)</option>
                <option value="Customer Refused">Customer Refused (RTO)</option>
              </select>

              {exceptionReason === "Parcel Damaged" && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Photographic Proof</p>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleCaptureImage}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-slate-950 border border-dashed border-slate-700 hover:border-indigo-500 rounded-xl py-6 flex flex-col items-center justify-center gap-2 transition-colors"
                  >
                    {damagedImageBase64 ? (
                      <div className="relative w-full h-32 px-4">
                         <img src={damagedImageBase64} alt="Damaged Parcel" className="w-full h-full object-contain rounded-lg" />
                         <span className="absolute top-2 right-6 bg-red-500 text-white text-[10px] px-2 py-1 rounded-full font-bold">Captured</span>
                      </div>
                    ) : (
                      <>
                        <Camera className="w-6 h-6 text-slate-400" />
                        <span className="text-xs font-bold text-slate-400">Tap to Capture Damaged Parcel</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowExceptionModal(false)} className="flex-1 py-4 bg-slate-800 text-white rounded-xl font-bold">Cancel</button>
              <button onClick={handleReportException} disabled={reportingException} className="flex-1 py-4 bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                {reportingException ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 shrink-0 sticky top-0 z-20 px-4 py-4 flex items-center gap-4">
        <Link href="/agent/routes" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </Link>
        <div>
          <h1 className="text-lg font-black tracking-tight text-white">Active Delivery</h1>
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{trackingId}</p>
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

           {/* Quick Action Buttons */}
           <div className="grid grid-cols-2 gap-3">
              <a 
                 href={`https://www.google.com/maps/dir/?api=1&destination=${dropLat},${dropLng}`}
                 target="_blank"
                 className="flex items-center justify-center gap-2 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 active:bg-slate-600 rounded-xl transition-colors min-h-[48px]">
                 <Navigation className="w-5 h-5 text-blue-400" />
                 <span className="font-bold text-sm text-white">Navigate</span>
              </a>
              <a 
                 href={`tel:${customerPhone}`}
                 className="flex items-center justify-center gap-2 py-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 active:bg-emerald-500/30 rounded-xl transition-colors min-h-[48px]">
                 <Phone className="w-5 h-5 text-emerald-400" />
                 <span className="font-bold text-sm text-emerald-400">Call Customer</span>
              </a>
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
        </div>

        {/* Section 3: Live Map Placeholder */}
        <div className="bg-slate-900 rounded-[2rem] border border-slate-800 shadow-xl overflow-hidden h-48 relative">
           <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%236366f1\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
           }}></div>
           <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <MapIcon className="w-10 h-10 text-indigo-500 mb-2 opacity-80" />
              <button 
                 onClick={() => setLiveTracking(!liveTracking)}
                 className={`px-4 py-2 rounded-full border text-xs font-bold flex items-center gap-2 ${
                    liveTracking ? "bg-slate-950/80 border-indigo-500 text-indigo-400" : "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                 }`}>
                 <span className={`w-2 h-2 rounded-full ${liveTracking ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`}></span>
                 {liveTracking ? "Live GPS Routing Active" : "Start Live Tracking"}
              </button>
           </div>
        </div>

        {/* COD Blocker */}
        {paymentMethod === "COD" && (
           <div className="bg-orange-500/10 border-2 border-orange-500 rounded-[2rem] p-5 shadow-xl shadow-orange-500/5">
             <div className="flex items-center gap-3 mb-4">
               <div className="bg-orange-500 p-2 rounded-full">
                 <IndianRupee className="w-6 h-6 text-white" />
               </div>
               <div>
                 <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Cash on Delivery</p>
                 <p className="text-xl font-black text-orange-400">Collect ₹{totalAmount}</p>
               </div>
             </div>
             
             <label className="flex items-center gap-3 p-4 bg-slate-950/50 rounded-xl cursor-pointer hover:bg-slate-950 transition-colors">
               <input 
                 type="checkbox" 
                 checked={cashCollected}
                 onChange={(e) => setCashCollected(e.target.checked)}
                 className="w-6 h-6 rounded border-orange-500 text-orange-500 focus:ring-orange-500 bg-transparent"
               />
               <span className="font-bold text-sm text-slate-300">I have collected ₹{totalAmount} in cash from the customer.</span>
             </label>
           </div>
        )}

        {/* Section 4: Proof of Delivery (PoD) Workflow */}
        <div className="bg-gradient-to-b from-slate-900 to-indigo-950/20 rounded-[2rem] p-5 border border-indigo-500/20 shadow-xl">
           <h3 className="text-lg font-black text-white text-center mb-1 flex justify-center items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Delivery Verification
           </h3>
           <p className="text-xs text-slate-400 text-center mb-6">Complete PoD requirements to mark as delivered.</p>
           
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

           {/* Customer Signature Pad */}
           <div className="mt-6 mb-2">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Customer Signature</p>
                <button 
                  onClick={() => sigCanvas.current?.clear()} 
                  className="text-[10px] font-bold text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors uppercase"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              </div>
              <div className="bg-slate-50 rounded-xl overflow-hidden border-2 border-indigo-500/30 touch-none">
                <SignatureCanvas 
                  ref={sigCanvas}
                  penColor="black"
                  canvasProps={{ className: "w-full h-40 cursor-crosshair" }}
                />
              </div>
           </div>
           {submitError && <p className="text-red-400 text-xs text-center mt-2 font-bold">{submitError}</p>}
        </div>
      </div>

      {/* Sticky Bottom Action Button */}
      <div className="fixed bottom-[72px] left-0 right-0 max-w-md mx-auto p-4 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14] to-transparent z-40">
         <div className="flex gap-2">
           <button 
              onClick={() => setShowExceptionModal(true)}
              className="px-4 bg-slate-900 border border-slate-800 text-red-500 rounded-xl active:bg-slate-800 transition-colors flex items-center justify-center shrink-0"
              title="Report Issue"
           >
              <AlertTriangle className="w-6 h-6" />
           </button>
           <button 
              onClick={handleVerifyAndDeliver}
              disabled={completing || otp.length !== 6 || (paymentMethod === 'COD' && !cashCollected)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
           >
              {completing ? (
                 <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                 <>
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span>Verify & Deliver</span>
                 </>
              )}
           </button>
         </div>
      </div>

    </div>
  );
}
