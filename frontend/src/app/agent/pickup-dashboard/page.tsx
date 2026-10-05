"use client";
import apiClient from '@/lib/apiClient';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, MapPin, CheckCircle2, Loader2, X, QrCode } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

export default function PickupDashboard() {
  const router = useRouter();
  const [pickups, setPickups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [activePickup, setActivePickup] = useState<any | null>(null);
  const [actualWeight, setActualWeight] = useState<string>("");
  const [scannedQR, setScannedQR] = useState<string>("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPickups();
  }, []);

  const fetchPickups = async () => {
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

      console.log("Fetching orders for agent:", finalAgentId);

      const response = await apiClient.get(`/orders?status=PICKUP_ASSIGNED&t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Fetched Orders Response:", response.data);

      if (response.data.success && Array.isArray(response.data.data)) {
        let fetchedOrders = response.data.data;
        if (fetchedOrders.length === 0) {
            console.log("Injecting fallback order for demo...");
            fetchedOrders = [{ 
                _id: "demo-order-123", 
                trackingId: "AWB-DEMO-999", 
                status: "PICKUP_ASSIGNED", 
                sender: { name: "Demo Sender", phone: "1234567890", address: "Demo Source Address" },
                receiver: { name: "Test User", phone: "0987654321", address: "Demo Dest Address" },
                parcelDetails: { weight: 5, dimensions: "10x10x10" }
            }];
        }
        setPickups(fetchedOrders);
      }
    } catch (err) {
      console.error("Failed to fetch pickups", err);
      toast.error("Failed to load pickups.");
    } finally {
      setLoading(false);
    }
  };

  const executePickup = async () => {
    if (!activePickup) return;
    
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await apiClient.patch(`/orders/${activePickup._id}/status`, {
        status: "PICKED_UP",
        actualWeight: actualWeight ? Number(actualWeight) : undefined,
        scannedQR: scannedQR || undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        toast.success("✅ Parcel Picked Up Successfully!");
        setPickups(prev => prev.filter(p => p._id !== activePickup._id));
        closeModal();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to confirm pickup.");
    } finally {
      setProcessing(false);
    }
  };

  const closeModal = () => {
    setActivePickup(null);
    setActualWeight("");
    setScannedQR("");
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 shrink-0 z-20 sticky top-0 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-amber-500" />
          Pickup Dashboard
        </h1>
        <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl">
           <span className="text-xs font-bold text-amber-400">{pickups.length} Pickups</span>
        </div>
      </div>

      <div className="px-4 py-6 pb-28">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            <p className="text-sm font-medium">Loading pickups...</p>
          </div>
        ) : pickups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
             <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
             </div>
             <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
             <p className="text-slate-400 text-sm">You have no pending pickups at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pickups.map((order, index) => {
              const trackingId = order?._id?.toString().slice(-8).toUpperCase() || "UNKNOWN";
              const pickupAddress = order?.pickupAddress?.fullAddress || "Unknown Pickup Location";
              const weight = order?.parcelDetails?.weightKg ? `${order.parcelDetails.weightKg}kg (Est)` : 'N/A';

              return (
                <div key={order._id} className="bg-slate-900/80 backdrop-blur-xl rounded-[2rem] p-5 border border-slate-700/50 shadow-xl relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                       <div className="flex items-center gap-2 mb-1">
                          <span className="bg-slate-800 text-slate-300 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">
                            Pickup {index + 1}
                          </span>
                       </div>
                       <h3 className="font-mono text-lg font-black text-white mt-2">{trackingId}</h3>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Est. Weight</p>
                       <p className="text-sm font-bold text-slate-300">{weight}</p>
                    </div>
                  </div>

                  <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/50 mb-5 space-y-3">
                     <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                           <MapPin className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Pickup Location</p>
                           <p className="text-sm font-medium text-slate-300">{pickupAddress}</p>
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-wrap gap-3 relative z-10">
                     <button 
                        onClick={() => setActivePickup(order)}
                        className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-amber-500/25 mt-1"
                     >
                        Execute Pickup
                     </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Execution Modal */}
      {activePickup && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-end sm:justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 relative shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0">
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-800 text-slate-400 rounded-full hover:bg-slate-700 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-2">Execute Pickup</h2>
            <p className="font-mono text-sm text-amber-400 mb-6 font-bold">{activePickup._id.slice(-8).toUpperCase()}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Actual Parcel Weight (kg)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={actualWeight}
                  onChange={(e) => setActualWeight(e.target.value)}
                  placeholder={`Est: ${activePickup.parcelDetails?.weightKg || 1} kg`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                  <QrCode className="w-4 h-4" /> Scan Parcel QR
                </label>
                <input 
                  type="text"
                  value={scannedQR}
                  onChange={(e) => setScannedQR(e.target.value)}
                  placeholder="Enter or Scan QR code"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono tracking-widest text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <button 
                onClick={executePickup}
                disabled={processing || !actualWeight}
                className="w-full py-4 mt-4 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Pickup"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
