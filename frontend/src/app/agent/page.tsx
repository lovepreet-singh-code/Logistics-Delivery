"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, CheckCircle, LogOut, Package, Navigation, Loader2 } from "lucide-react";

interface Order {
  _id: string;
  trackingId?: string;
  deliveryAddress: {
    street1: string;
    city: string;
    state: string;
    pinCode: string;
  };
  status: string;
  customerPhone: string;
  updatedAt?: string;
}

export default function DeliveryAgentDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    fetchManifest();
  }, []);

  const fetchManifest = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Using the exact endpoint we built on the backend:
      const response = await fetch(
        "http://localhost:8080/api/dispatch/agent/manifest",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      console.log("API Response:", result);
      
      if (result.success && result.data?.routeSequence) {
        const mappedOrders = result.data.routeSequence.map((seq: any) => seq.orderId || seq);
        setOrders(mappedOrders);
      } else if (result.success && Array.isArray(result.data)) {
        setOrders(result.data);
      } else {
        setOrders([]);
      }
    } catch (err: any) {
      setError("Failed to fetch route plan.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/login");
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const markAsDelivered = async (orderId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "DELIVERED" }),
      });
      
      const data = await res.json();
      if (data.success) {
        showToast("Order marked as Delivered!");
        fetchManifest(); // Refresh the list automatically
      } else {
        alert("Failed to update status: " + data.message);
      }
    } catch (err) {
      console.error("Failed to update status on server", err);
      alert("Failed to update status on server.");
    }
  };

  const formatAddress = (address: any) => {
    if (!address) return "Address not available";
    return `${address.street1}, ${address.city}, ${address.state} - ${address.pinCode}`;
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
      timeZoneName: "short",
    });
  };

  // Wait for client to mount before checking auth to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (!localStorage.getItem("token")) {
      router.push("/login");
    }
  }, [router]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-indigo-500/30">
      
      {/* ──── Header ──── */}
      <header className="bg-slate-950 text-white shadow-md sticky top-0 z-50 border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-400" />
            <span className="font-bold text-sm tracking-wide hidden sm:inline text-indigo-400">
              AGENT PORTAL
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-100">
            <Navigation className="w-5 h-5 opacity-80" />
            <h1 className="font-bold tracking-widest text-lg">MY ORDERS</h1>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-300 hover:text-white"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ──── Toast Notification ──── */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 animate-in slide-in-from-top-4 fade-in">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ──── Main Content ──── */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6 flex justify-between items-end">
          <h2 className="text-xl font-bold text-slate-100">
            Pending Deliveries
            <span className="block text-sm font-normal text-slate-400 mt-1">
              Currently Assigned Route
            </span>
          </h2>
          <span className="bg-indigo-900/50 text-indigo-300 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-500/30">
            {orders.length} Total
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
             <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-900/20 text-red-400 p-4 rounded-xl border border-red-900/50 flex items-start gap-3">
            <span className="mt-0.5">⚠️</span>
            <p>{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-800 backdrop-blur-sm">
            <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 text-lg font-medium">No active deliveries.</p>
            <p className="text-slate-500 text-sm mt-1">Check back later when a new manifest is routed!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isDelivered = order.status === "DELIVERED";

              return (
                <div
                  key={order._id}
                  className="bg-slate-800/50 rounded-2xl shadow-lg border border-slate-700/50 overflow-hidden backdrop-blur-md transition-all hover:bg-slate-800/80"
                >
                  {/* Status Indicator Line (Top border) */}
                  <div
                    className={`h-1.5 w-full ${
                      isDelivered ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />

                  <div className="p-5">
                    {/* Header Row */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Tracking ID
                        </p>
                        <p className="font-bold text-slate-100 font-mono text-sm sm:text-base">
                          {order.trackingId || order._id}
                        </p>
                      </div>
                      
                      {isDelivered ? (
                        <div className="flex flex-col items-end">
                           <span className="inline-flex items-center gap-1.5 bg-emerald-900/30 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-500/20">
                            <CheckCircle className="w-3.5 h-3.5" />
                            DELIVERED
                          </span>
                          <span className="text-[10px] text-slate-500 mt-1 font-medium">
                            {formatTime(order.updatedAt)}
                          </span>
                        </div>
                      ) : (
                         <span className="bg-amber-900/30 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-500/20">
                          PENDING
                        </span>
                      )}
                    </div>

                    {/* Address Row */}
                    <div className="flex items-start gap-3 mb-5 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                      <MapPin className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-slate-300 leading-relaxed font-medium">
                          {formatAddress(order.deliveryAddress)}
                        </p>
                        <p className="text-xs text-slate-400 mt-2 font-medium flex items-center gap-2">
                          <span>📞 {order.customerPhone || "N/A"}</span>
                        </p>
                      </div>
                    </div>

                    {/* Action Row */}
                    {!isDelivered && (
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => markAsDelivered(order._id)}
                          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold py-3 px-6 rounded-xl shadow-lg shadow-indigo-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 border border-indigo-500"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Mark as Delivered
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
