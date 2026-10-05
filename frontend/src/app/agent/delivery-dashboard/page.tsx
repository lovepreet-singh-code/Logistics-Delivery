"use client";
import apiClient from '@/lib/apiClient';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, MapPin, CheckCircle2, Loader2, X, FileSignature } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

export default function DeliveryDashboard() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [activeDelivery, setActiveDelivery] = useState<any | null>(null);
  const [otp, setOtp] = useState<string>("");
  const [signatureBase64, setSignatureBase64] = useState<string>("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/");
        return;
      }

      const agentId = localStorage.getItem("agentId");
      
      console.log("Logged-in Agent ID:", agentId);

      // If agentId is missing, fallback by fetching profile
      let finalAgentId = agentId;
      if (!finalAgentId) {
         const profileRes = await apiClient.get("/auth/me", {
            headers: { Authorization: `Bearer ${token}` }
         });
         if (profileRes.data.success && profileRes.data.data.user) {
            finalAgentId = profileRes.data.data.user.id || profileRes.data.data.user._id;
            localStorage.setItem("agentId", finalAgentId as string);
         }
      }

      console.log("Fetching deliveries for agent:", finalAgentId);

      const response = await apiClient.get(`/orders?status=OUT_FOR_DELIVERY`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Fetched Deliveries Response:", response.data);

      if (response.data.success && Array.isArray(response.data.data)) {
        setDeliveries(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch deliveries", err);
      toast.error("Failed to load deliveries.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignatureBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const executeDelivery = async () => {
    if (!activeDelivery) return;
    if (!otp) {
      toast.error("Delivery OTP is required!");
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await apiClient.patch(`/orders/${activeDelivery._id}/status`, {
        status: "DELIVERED",
        otp,
        signatureBase64: signatureBase64 || undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        toast.success("✅ Delivery Completed Successfully!");
        setDeliveries(prev => prev.filter(d => d._id !== activeDelivery._id));
        closeModal();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to confirm delivery.");
    } finally {
      setProcessing(false);
    }
  };

  const closeModal = () => {
    setActiveDelivery(null);
    setOtp("");
    setSignatureBase64("");
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 shrink-0 z-20 sticky top-0 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <Truck className="w-5 h-5 text-indigo-500" />
          Delivery Dashboard
        </h1>
        <div className="bg-indigo-500/10 border border-indigo-500/30 px-3 py-1.5 rounded-xl">
           <span className="text-xs font-bold text-indigo-400">{deliveries.length} Deliveries</span>
        </div>
      </div>

      <div className="px-4 py-6 pb-28">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <p className="text-sm font-medium">Loading deliveries...</p>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
             <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
             </div>
             <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
             <p className="text-slate-400 text-sm">You have no pending deliveries at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deliveries.map((order, index) => {
              const trackingId = order?._id?.toString().slice(-8).toUpperCase() || "UNKNOWN";
              const dropAddress = order?.deliveryAddress?.fullAddress || "Unknown Drop Location";
              const isCOD = order?.paymentMethod === "COD";
              const totalAmount = order?.totalAmount || 0;

              return (
                <div key={order._id} className="bg-slate-900/80 backdrop-blur-xl rounded-[2rem] p-5 border border-slate-700/50 shadow-xl relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                       <div className="flex items-center gap-2 mb-1">
                          <span className="bg-slate-800 text-slate-300 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">
                            Stop {index + 1}
                          </span>
                       </div>
                       <h3 className="font-mono text-lg font-black text-white mt-2">{trackingId}</h3>
                    </div>
                    {isCOD && (
                      <div className="text-right">
                         <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-0.5">Collect COD</p>
                         <p className="text-sm font-bold text-white">₹{totalAmount}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/50 mb-5 space-y-3">
                     <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                           <MapPin className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Drop Location</p>
                           <p className="text-sm font-medium text-slate-300">{dropAddress}</p>
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-wrap gap-3 relative z-10">
                     <button 
                        onClick={() => setActiveDelivery(order)}
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/25 mt-1"
                     >
                        Execute Delivery
                     </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Execution Modal */}
      {activeDelivery && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-end sm:justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 relative shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0">
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-800 text-slate-400 rounded-full hover:bg-slate-700 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-2">Execute Delivery</h2>
            <p className="font-mono text-sm text-indigo-400 mb-6 font-bold">{activeDelivery._id.slice(-8).toUpperCase()}</p>
            
            <div className="space-y-4">
              {activeDelivery.paymentMethod === "COD" && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex justify-between items-center">
                  <span className="text-sm font-bold text-rose-400 uppercase">Collect Cash</span>
                  <span className="text-lg font-black text-white">₹{activeDelivery.totalAmount || 0}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Customer Delivery OTP *</label>
                <input 
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit PIN"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono tracking-widest text-lg focus:outline-none focus:border-indigo-500 text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Proof of Delivery (Optional)</label>
                <div className="w-full bg-slate-950 border border-slate-800 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 relative">
                  {signatureBase64 ? (
                     <div className="text-emerald-400 text-sm font-bold flex items-center gap-2">
                       <CheckCircle2 className="w-5 h-5" /> Signature Uploaded
                     </div>
                  ) : (
                     <>
                        <FileSignature className="w-6 h-6 text-slate-500" />
                        <span className="text-sm text-slate-400 font-medium">Tap to upload signature</span>
                     </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <button 
                onClick={executeDelivery}
                disabled={processing || !otp || otp.length < 6}
                className="w-full py-4 mt-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Delivery"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
