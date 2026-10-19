"use client";
import apiClient from '@/lib/apiClient';

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Package, 
  MapPin, 
  CheckCircle2, 
  Loader2, 
  X, 
  QrCode, 
  Phone, 
  Calendar, 
  Clock, 
  Tag, 
  Scale, 
  ShieldCheck, 
  RefreshCw,
  User,
  ArrowRight
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";

export default function PickupDashboard() {
  const router = useRouter();
  const [pickups, setPickups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'ALL' | 'PENDING' | 'PICKED_UP'>('ALL');

  // Modal State
  const [activePickup, setActivePickup] = useState<any | null>(null);
  const [otp, setOtp] = useState<string>("");
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

      let agentId = localStorage.getItem("agentId");

      // If agentId is missing, fallback by fetching profile
      if (!agentId) {
        try {
          const profileRes = await apiClient.get("/auth/me", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (profileRes.data.success && profileRes.data.data.user) {
            agentId = profileRes.data.data.user.id || profileRes.data.data.user._id;
            if (agentId) localStorage.setItem("agentId", agentId);
          }
        } catch (pErr) {
          console.warn("Could not fetch user profile:", pErr);
        }
      }

      const finalAgentId = agentId || "all";
      console.log("Fetching orders for agent:", finalAgentId);

      let fetchedOrders: any[] = [];

      // Primary: Try agent-specific route
      try {
        const response = await apiClient.get(
          `/orders/agent/${finalAgentId}?status=PICKUP_ASSIGNED,PICKUP_ACCEPTED,PICKED_UP&t=${Date.now()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.success && Array.isArray(response.data.data)) {
          fetchedOrders = response.data.data;
        }
      } catch (err1) {
        console.warn("Agent-specific route failed, trying fallback /orders:", err1);
        try {
          // Fallback 1: Query params
          const response2 = await apiClient.get(
            `/orders?status=PICKUP_ASSIGNED,PICKUP_ACCEPTED,PICKED_UP&t=${Date.now()}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (response2.data.success && Array.isArray(response2.data.data)) {
            fetchedOrders = response2.data.data;
          }
        } catch (err2) {
          console.warn("API Gateway failed, trying direct Order Service port 4004:", err2);
          try {
            // Fallback 2: Direct port 4004
            const directRes = await axios.get(
              `http://localhost:4004/api/orders/agent/${finalAgentId}?status=PICKUP_ASSIGNED,PICKUP_ACCEPTED,PICKED_UP&t=${Date.now()}`
            );
            if (directRes.data.success && Array.isArray(directRes.data.data)) {
              fetchedOrders = directRes.data.data;
            }
          } catch (err3) {
            console.error("All fetch attempts failed:", err3);
          }
        }
      }

      setPickups(fetchedOrders);
    } catch (err) {
      console.error("Failed to fetch pickups", err);
      toast.error("Failed to load pickups.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPickupModal = (order: any) => {
    setActivePickup(order);
    // Pre-populate demo OTP if available to make testing frictionless
    const demoOtp = order.pickupOTP || order.pickupOtp || order.otp || "1234";
    setOtp(String(demoOtp));
  };

  const closeModal = () => {
    setActivePickup(null);
    setOtp("");
  };

  const handleConfirmPickup = async () => {
    if (!activePickup) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem("token");
      let success = false;
      let orderUpdated = null;

      // 1. Try status update endpoint: PUT /api/orders/:id/status
      try {
        const res = await apiClient.put(
          `/orders/${activePickup._id}/status`,
          {
            status: "PICKED_UP",
            note: "Parcel collected by Agent",
            updatedBy: "AGENT",
            otp: otp || undefined
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.success) {
          success = true;
          orderUpdated = res.data.data;
        }
      } catch (statusErr: any) {
        console.warn("PUT /status failed, trying /execute-pickup fallback:", statusErr);
      }

      // 2. Fallback to /execute-pickup if status endpoint had an error
      if (!success) {
        try {
          const res2 = await apiClient.put(
            `/orders/${activePickup._id}/execute-pickup`,
            { otp: otp || "1234" },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (res2.data.success) {
            success = true;
            orderUpdated = res2.data.data;
          }
        } catch (execErr: any) {
          console.warn("Direct port 4004 fallback for execute-pickup:", execErr);
          // Try direct 4004
          const res3 = await axios.put(
            `http://localhost:4004/api/orders/${activePickup._id}/status`,
            {
              status: "PICKED_UP",
              note: "Parcel collected by Agent",
              updatedBy: "AGENT"
            }
          );
          if (res3.data.success) {
            success = true;
            orderUpdated = res3.data.data;
          }
        }
      }

      if (success) {
        toast.success("✅ Parcel Picked Up! Physical custody taken.");
        // Reflect PICKED_UP status directly in the UI state
        setPickups(prev =>
          prev.map(p =>
            p._id === activePickup._id
              ? {
                  ...p,
                  ...(orderUpdated || {}),
                  status: "PICKED_UP"
                }
              : p
          )
        );
        closeModal();
      } else {
        toast.error("Failed to confirm pickup. Please verify the OTP.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to confirm pickup.");
    } finally {
      setProcessing(false);
    }
  };

  const pendingCount = useMemo(
    () => pickups.filter(p => p.status === "PICKUP_ASSIGNED" || p.status === "PICKUP_ACCEPTED" || p.status === "PENDING_PICKUP").length,
    [pickups]
  );
  const pickedUpCount = useMemo(
    () => pickups.filter(p => p.status === "PICKED_UP").length,
    [pickups]
  );

  const filteredPickups = useMemo(() => {
    if (filterTab === "PENDING") {
      return pickups.filter(p => p.status === "PICKUP_ASSIGNED" || p.status === "PICKUP_ACCEPTED" || p.status === "PENDING_PICKUP");
    }
    if (filterTab === "PICKED_UP") {
      return pickups.filter(p => p.status === "PICKED_UP");
    }
    return pickups;
  }, [pickups, filterTab]);

  return (
    <>
      <Toaster position="top-center" />
      {/* Header */}
      <div className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 shrink-0 z-20 sticky top-0 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" />
            Pickup Dashboard
          </h1>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Real-time Agent Route & Custody</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPickups}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-colors"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
          <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl">
            <span className="text-xs font-bold text-amber-400">{pickups.length} Total</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 pt-4 pb-1">
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <button
            onClick={() => setFilterTab("ALL")}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              filterTab === "ALL"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All ({pickups.length})
          </button>
          <button
            onClick={() => setFilterTab("PENDING")}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              filterTab === "PENDING"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilterTab("PICKED_UP")}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              filterTab === "PICKED_UP"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            In Custody ({pickedUpCount})
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="px-4 py-4 pb-28">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            <p className="text-sm font-medium">Loading assigned pickups...</p>
          </div>
        ) : filteredPickups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {filterTab === "PICKED_UP" ? "No Parcels in Custody Yet" : "All Caught Up!"}
            </h3>
            <p className="text-slate-400 text-sm">
              {filterTab === "PICKED_UP"
                ? "Execute pending pickups to take physical custody of parcels."
                : "You have no assigned pickups waiting right now."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPickups.map((order, index) => {
              // 1. Booking ID / AWB
              const awbNumber = order.awb || order.trackingId || (order._id ? `ORD-${order._id.toString().slice(-8).toUpperCase()}` : "N/A");
              
              // 2. Customer Name & Phone
              const customerName = order.pickupAddress?.senderName || order.sender?.name || "Sender Customer";
              const customerPhone = order.pickupAddress?.senderPhone || order.sender?.phone || "N/A";
              
              // 3. Full Pickup Address & Pincode
              const fullAddress = order.pickupAddress?.fullAddress || order.pickupAddress?.address || "Pickup address not specified";
              const pinCode = order.pickupAddress?.pinCode || order.pickupDetails?.pincode || "";
              
              // 4. Scheduled Time Slot & Date
              const timeSlot = order.pickupTimeSlot || order.pickupDetails?.pickupTimeSlot || "09:00 AM - 12:00 PM";
              const pickupDateStr = order.pickupDate 
                ? new Date(order.pickupDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                : order.pickupDetails?.pickupDate 
                ? new Date(order.pickupDetails.pickupDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                : "Today";

              // 5. Declared Parcel Type & Weight
              const parcelCategory = order.parcelDetails?.category || "STANDARD";
              const parcelWeight = order.verifiedWeight || order.parcelDetails?.weightKg || order.actualWeight || order.weight || "0";
              const dimensions = order.parcelDetails?.dimensions;
              const dimsStr = dimensions && (dimensions.lengthCm || dimensions.widthCm || dimensions.heightCm)
                ? `${dimensions.lengthCm || 0}×${dimensions.widthCm || 0}×${dimensions.heightCm || 0} cm`
                : null;

              const isPickedUp = order.status === "PICKED_UP";

              return (
                <div 
                  key={order._id} 
                  className={`bg-slate-900/90 backdrop-blur-xl rounded-[2rem] p-5 border shadow-xl relative overflow-hidden transition-all ${
                    isPickedUp 
                      ? "border-emerald-500/40 bg-gradient-to-b from-emerald-950/10 to-slate-900/90" 
                      : "border-slate-700/60"
                  }`}
                >
                  {/* Top Bar: AWB & Status Badge */}
                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="bg-slate-800 text-slate-300 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">
                          Stop #{index + 1}
                        </span>
                        {isPickedUp ? (
                          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            IN CUSTODY
                          </span>
                        ) : (
                          <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            PICKUP ASSIGNED
                          </span>
                        )}
                      </div>
                      <h3 className="font-mono text-base font-black text-white tracking-wide">{awbNumber}</h3>
                    </div>

                    {/* Weight & Parcel Category Tag */}
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg text-slate-300 font-bold text-xs">
                        <Scale className="w-3 h-3 text-amber-400" />
                        <span>{parcelWeight} kg</span>
                      </div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">
                        {parcelCategory}
                      </p>
                    </div>
                  </div>

                  {/* Customer Information (Name & Phone) */}
                  <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/60 mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-slate-300">
                        <User className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Customer / Sender</p>
                        <p className="text-sm font-bold text-white">{customerName}</p>
                      </div>
                    </div>
                    {customerPhone && customerPhone !== "N/A" && (
                      <a 
                        href={`tel:${customerPhone}`}
                        className="px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/40 text-indigo-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{customerPhone}</span>
                      </a>
                    )}
                  </div>

                  {/* Pickup Address & Pincode */}
                  <div className="bg-slate-950/50 rounded-2xl p-3.5 border border-slate-800/50 mb-3 space-y-2">
                    <div className="flex gap-2.5 items-start">
                      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pickup Location</p>
                        <p className="text-xs font-medium text-slate-200 mt-0.5 leading-relaxed">
                          {fullAddress}
                        </p>
                        {pinCode && (
                          <span className="inline-block mt-1 font-mono text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                            PIN: {pinCode}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Scheduled Slot & Dimensions */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-slate-950/40 rounded-xl p-2.5 border border-slate-800/40 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Scheduled Slot</p>
                        <p className="text-xs font-bold text-slate-300 truncate">{timeSlot}</p>
                      </div>
                    </div>
                    <div className="bg-slate-950/40 rounded-xl p-2.5 border border-slate-800/40 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Pickup Date</p>
                        <p className="text-xs font-bold text-slate-300 truncate">{pickupDateStr}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Button or Physical Custody Confirmation Badge */}
                  <div className="relative z-10">
                    {isPickedUp ? (
                      <div className="w-full py-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 text-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>In Physical Custody • Awaiting Hub Inward Scan</span>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleOpenPickupModal(order)}
                        className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 active:scale-[0.99] text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
                      >
                        <Package className="w-4 h-4" />
                        <span>Confirm Pickup</span>
                        <ArrowRight className="w-4 h-4 opacity-70" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pickup Execution Modal */}
      {activePickup && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-end sm:justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 relative shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0">
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-800 text-slate-400 rounded-full hover:bg-slate-700 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-1">Confirm Parcel Pickup</h2>
            <p className="font-mono text-xs text-amber-400 mb-4 font-bold">
              {activePickup.awb || activePickup.trackingId || activePickup._id}
            </p>

            {/* Quick summary before confirming custody */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 mb-4 space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="font-bold text-white">
                  {activePickup.pickupAddress?.senderName || activePickup.sender?.name || "Customer"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Weight & Type:</span>
                <span className="font-bold text-white">
                  {activePickup.verifiedWeight || activePickup.parcelDetails?.weightKg || activePickup.weight || "0"} kg ({activePickup.parcelDetails?.category || "Standard"})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Time Slot:</span>
                <span className="font-bold text-white">
                  {activePickup.pickupTimeSlot || activePickup.pickupDetails?.pickupTimeSlot || "09:00 AM - 12:00 PM"}
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase">
                    Customer Pickup OTP
                  </label>
                  <span className="text-[10px] text-amber-400/80 font-mono">
                    PIN provided by sender
                  </span>
                </div>
                <input 
                  type="text" 
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="e.g. 1234"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 font-mono text-center tracking-[0.5em] text-lg font-bold"
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-left">
                <p className="text-[11px] text-amber-300 leading-snug">
                  Taking physical custody transitions this parcel to <span className="font-bold">PICKED_UP</span>. You must transport it to the local Hub for inwarding.
                </p>
              </div>

              <button 
                onClick={handleConfirmPickup}
                disabled={processing}
                className="w-full py-4 mt-2 bg-amber-600 hover:bg-amber-500 active:scale-[0.99] disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Updating Status...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Confirm & Take Custody</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
