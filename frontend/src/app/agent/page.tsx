"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  CheckCircle,
  LogOut,
  Play,
  Loader2,
  Navigation,
  Check,
  Home,
  Route,
  ScanBarcode,
  IndianRupee,
  User as UserIcon,
  Phone,
  Camera,
  QrCode,
  Package,
  Clock
} from "lucide-react";
import apiClient from "@/lib/apiClient";

interface Address {
  fullAddress: string;
  pinCode: string;
}

interface Order {
  _id: string;
  customerId: string;
  customerPhone?: string;
  deliveryAddress: Address;
  pickupAddress: Address;
  parcelDetails?: {
    weight?: number;
    type?: string;
  };
}

interface Delivery {
  _id: string;
  status: string;
  orderId: Order;
}

export default function DeliveryAgentPortal() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    fetchTodayDeliveries();
  }, []);

  const fetchTodayDeliveries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await apiClient.get("/deliveries/today");
      if (response.data.success && Array.isArray(response.data.data)) {
        setDeliveries(response.data.data);
      } else {
        setDeliveries([]);
      }
    } catch (err: any) {
      console.error("Failed to fetch deliveries", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("agentId");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/";
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const updateDeliveryStatus = async (
    deliveryId: string,
    action: "start" | "complete"
  ) => {
    try {
      setActionLoading(deliveryId);
      const newStatus = action === "start" ? "IN_TRANSIT" : "DELIVERED";

      const res = await apiClient.patch(`/deliveries/${deliveryId}`, { status: newStatus });

      if (res.data.success) {
        showToast(
          action === "start"
            ? "Delivery started!"
            : "Delivery completed successfully!"
        );
        // Optimistically update the UI
        setDeliveries((prev) =>
          prev.map((del) => {
            if (del._id === deliveryId) {
              return {
                ...del,
                status: newStatus,
              };
            }
            return del;
          })
        );
      } else {
        alert("Failed to update status: " + res.data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Network error updating status.");
    } finally {
      setActionLoading(null);
    }
  };

  const pendingDeliveries = deliveries.filter(
    (d) => d.status !== "DELIVERED"
  );
  
  const completedDeliveries = deliveries.filter(
    (d) => d.status === "DELIVERED"
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500">
      {/* Mobile-First Container */}
      <div className="max-w-md mx-auto h-screen bg-slate-900 shadow-2xl relative overflow-hidden flex flex-col border-x border-slate-800">
        
        {/* Header & Metrics */}
        <div className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 shrink-0 z-20">
          <header className="px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-500" />
                Agent Portal
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-400 transition-colors bg-slate-900 border border-slate-800 rounded-full"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </header>

          {/* Top Summary Metrics */}
          <div className="px-4 pb-4 overflow-x-auto no-scrollbar">
            <div className="flex gap-3 min-w-max">
              <div className="bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl flex flex-col gap-1 min-w-[100px] shadow-sm">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Stops</span>
                <span className="text-xl font-black text-white">{deliveries.length}</span>
              </div>
              <div className="bg-slate-900 border border-emerald-500/30 px-4 py-3 rounded-2xl flex flex-col gap-1 min-w-[100px] shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500/5"></div>
                <span className="text-xs text-emerald-500 font-bold uppercase tracking-wider relative z-10">Done</span>
                <span className="text-xl font-black text-emerald-400 relative z-10">{completedDeliveries.length}</span>
              </div>
              <div className="bg-slate-900 border border-amber-500/30 px-4 py-3 rounded-2xl flex flex-col gap-1 min-w-[100px] shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-amber-500/5"></div>
                <span className="text-xs text-amber-500 font-bold uppercase tracking-wider relative z-10">Pending</span>
                <span className="text-xl font-black text-amber-400 relative z-10">{pendingDeliveries.length}</span>
              </div>
              <div className="bg-slate-900 border border-indigo-500/30 px-4 py-3 rounded-2xl flex flex-col gap-1 min-w-[110px] shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-500/5"></div>
                <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider relative z-10">Earnings</span>
                <span className="text-xl font-black text-indigo-400 relative z-10">₹850</span>
              </div>
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-36 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 w-[90%] max-w-sm">
            <div className="bg-emerald-500 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-bold border border-emerald-400">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span className="truncate">{toastMessage}</span>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6 relative z-0 pb-32">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
              <p className="text-sm font-medium">Syncing live routes...</p>
            </div>
          ) : pendingDeliveries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20 relative">
                <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
                <Check className="w-12 h-12 text-white relative z-10" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">🎉 Great Work!</h2>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                You completed all assigned deliveries today. Take a well-deserved rest!
              </p>
              
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full shadow-inner space-y-4">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">Today's Summary</h3>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm font-medium">Deliveries</span>
                  <span className="text-white font-bold">{completedDeliveries.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm font-medium">Distance</span>
                  <span className="text-white font-bold">64 km</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm font-medium">Active Time</span>
                  <span className="text-white font-bold">7h 32m</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingDeliveries.map((delivery, index) => {
                const isOutForDelivery = delivery.status === "OUT_FOR_DELIVERY" || delivery.status === "IN_TRANSIT";
                const isActionLoading = actionLoading === delivery._id;
                const order = delivery.orderId;

                const displayAddress = order?.deliveryAddress?.fullAddress || "Address not available";
                const customerName = "Customer"; // You could fetch real name if populated
                const customerPhone = order?.customerPhone || "Phone not available";
                const weight = order?.parcelDetails?.weight ? `${order.parcelDetails.weight}kg` : 'N/A';
                const type = order?.parcelDetails?.type || 'Standard';

                return (
                  <div key={delivery._id} className="bg-slate-900/80 backdrop-blur-xl rounded-[2rem] p-5 border border-slate-700/50 shadow-xl relative overflow-hidden group">
                    {/* Glossy overlay */}
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                    
                    {/* Header */}
                    <div className="flex justify-between items-start mb-5 relative z-10">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-slate-800 text-slate-300 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">
                            Stop {index + 1}
                          </span>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                            isOutForDelivery ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          }`}>
                            {isOutForDelivery ? "In Transit" : "Pending"}
                          </span>
                        </div>
                        <h3 className="font-mono text-sm text-slate-400 mt-2 font-bold">{order?._id?.slice(-8).toUpperCase()}</h3>
                      </div>
                      <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs font-bold text-amber-500">14:30 ETA</span>
                      </div>
                    </div>

                    {/* Timeline Indicator */}
                    <div className="mb-6 relative z-10">
                      <div className="flex justify-between items-center relative">
                        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-800 -z-10 -translate-y-1/2"></div>
                        <div className={`absolute left-0 top-1/2 h-0.5 bg-indigo-500 -z-10 -translate-y-1/2 transition-all ${isOutForDelivery ? 'w-2/3' : 'w-1/3'}`}></div>
                        
                        <div className="flex flex-col items-center gap-1 bg-slate-900">
                          <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.5)]"><Check className="w-2.5 h-2.5 text-white" /></div>
                        </div>
                        <div className="flex flex-col items-center gap-1 bg-slate-900">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isOutForDelivery ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-800 border-2 border-slate-700'}`}>
                            {isOutForDelivery && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1 bg-slate-900">
                          <div className="w-4 h-4 rounded-full bg-slate-800 border-2 border-slate-700"></div>
                        </div>
                      </div>
                      <div className="flex justify-between mt-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        <span className="text-indigo-400">Assigned</span>
                        <span className={isOutForDelivery ? "text-indigo-400" : ""}>Transit</span>
                        <span>Delivered</span>
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/50 mb-5 relative z-10">
                      <div className="flex justify-between items-start mb-3 border-b border-slate-800/50 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-indigo-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{customerName}</p>
                            <p className="text-xs text-slate-400">{customerPhone}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-500 uppercase">Parcel</p>
                          <p className="text-sm font-bold text-slate-300">{weight} • {type}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <MapPin className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium text-slate-300 leading-snug">
                          {displayAddress}
                        </p>
                      </div>
                    </div>

                    {/* Action Grid */}
                    <div className="grid grid-cols-4 gap-2 mb-3 relative z-10">
                      <button className="flex flex-col items-center justify-center gap-1.5 p-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-2xl transition-colors">
                        <Phone className="w-5 h-5 text-emerald-400" />
                        <span className="text-[10px] font-bold text-slate-300">Call</span>
                      </button>
                      <button className="flex flex-col items-center justify-center gap-1.5 p-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-2xl transition-colors">
                        <Navigation className="w-5 h-5 text-blue-400" />
                        <span className="text-[10px] font-bold text-slate-300">Nav</span>
                      </button>
                      <button className="flex flex-col items-center justify-center gap-1.5 p-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-2xl transition-colors">
                        <Camera className="w-5 h-5 text-amber-400" />
                        <span className="text-[10px] font-bold text-slate-300">Photo</span>
                      </button>
                      <button className="flex flex-col items-center justify-center gap-1.5 p-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-2xl transition-colors">
                        <QrCode className="w-5 h-5 text-purple-400" />
                        <span className="text-[10px] font-bold text-slate-300">Scan</span>
                      </button>
                    </div>

                    {/* Main CTA */}
                    <div className="relative z-10">
                      {!isOutForDelivery ? (
                        <button
                          onClick={() => updateDeliveryStatus(delivery._id, "start")}
                          disabled={!!actionLoading}
                          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
                        >
                          {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Play className="w-5 h-5" /> Start Trip</>}
                        </button>
                      ) : (
                        <button
                          onClick={() => updateDeliveryStatus(delivery._id, "complete")}
                          disabled={!!actionLoading}
                          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-2xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
                        >
                          {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5" /> Verify OTP & Deliver</>}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Floating Action Button (FAB) */}
        <button className="absolute bottom-24 right-6 w-14 h-14 bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(99,102,241,0.4)] z-30 transition-transform hover:scale-105 active:scale-95">
          <ScanBarcode className="w-6 h-6" />
        </button>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 pb-safe z-40">
          <div className="flex justify-between items-center px-6 py-4">
            <button className="flex flex-col items-center gap-1 text-indigo-400 group">
              <div className="p-2 bg-indigo-500/20 rounded-xl group-active:scale-95 transition-transform"><Home className="w-6 h-6" /></div>
              <span className="text-[10px] font-bold">Home</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-300 group">
              <div className="p-2 rounded-xl group-active:scale-95 transition-transform"><Route className="w-6 h-6" /></div>
              <span className="text-[10px] font-bold">Routes</span>
            </button>
            <div className="w-12"></div> {/* Spacer for symmetry, optional since FAB is hovering */}
            <button className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-300 group">
              <div className="p-2 rounded-xl group-active:scale-95 transition-transform"><IndianRupee className="w-6 h-6" /></div>
              <span className="text-[10px] font-bold">Earnings</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-300 group">
              <div className="p-2 rounded-xl group-active:scale-95 transition-transform"><UserIcon className="w-6 h-6" /></div>
              <span className="text-[10px] font-bold">Profile</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
