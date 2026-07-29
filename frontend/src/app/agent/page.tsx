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
} from "lucide-react";

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

      const response = await fetch("http://localhost:8080/api/deliveries/today", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setDeliveries(result.data);
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
      const token = localStorage.getItem("token");
      const url = `http://localhost:8080/api/deliveries/${deliveryId}/${action}`;

      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          action === "start"
            ? "Delivery started!"
            : "Delivery completed successfully!"
        );
        // Optimistically update the UI instead of fetching again
        setDeliveries((prev) =>
          prev.map((del) => {
            if (del._id === deliveryId) {
              return {
                ...del,
                status: action === "start" ? "OUT_FOR_DELIVERY" : "DELIVERED",
              };
            }
            return del;
          })
        );
      } else {
        alert("Failed to update status: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Network error updating status.");
    } finally {
      setActionLoading(null);
    }
  };

  // Filter out DELIVERED items if we only want to show pending routes
  const pendingDeliveries = deliveries.filter(
    (d) => d.status !== "DELIVERED"
  );
  
  const completedDeliveries = deliveries.filter(
    (d) => d.status === "DELIVERED"
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-blue-500">
      {/* Container restricted to mobile width for optimal outdoor use */}
      <div className="max-w-md mx-auto min-h-screen bg-neutral-900 shadow-2xl relative pb-24 overflow-hidden flex flex-col">
        {/* Header */}
        <header className="bg-neutral-950 px-6 py-5 border-b border-neutral-800 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Agent Portal
            </h1>
            <p className="text-sm text-neutral-400 font-medium mt-1">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-neutral-400 hover:text-red-400 transition-colors bg-neutral-900 rounded-full"
            aria-label="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4">
            <div className="bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-semibold whitespace-nowrap">
              <CheckCircle className="w-5 h-5" />
              {toastMessage}
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Navigation className="w-5 h-5 text-blue-400" />
              Assigned Routes
            </h2>
            <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-1 rounded-full">
              {pendingDeliveries.length} Left
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-500 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm font-medium">Syncing routes...</p>
            </div>
          ) : pendingDeliveries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">All Done!</h3>
              <p className="text-neutral-400 text-sm">
                You have completed all assigned deliveries for today.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingDeliveries.map((delivery, index) => {
                const isOutForDelivery =
                  delivery.status === "OUT_FOR_DELIVERY";
                const isActionLoading = actionLoading === delivery._id;
                const order = delivery.orderId;

                // Fallback rendering in case Order population fails
                const displayAddress =
                  order?.deliveryAddress?.fullAddress ||
                  "Address not available";
                const customerPhone =
                  order?.customerPhone || "Phone not available";
                const customerDisplay = order?.customerId
                  ? `Customer ID: ${order.customerId.toString().slice(-4)}`
                  : "Customer Info Missing";

                return (
                  <div
                    key={delivery._id}
                    className="bg-neutral-950 rounded-2xl p-5 border border-neutral-800 shadow-sm relative overflow-hidden group"
                  >
                    {/* Status Indicator Bar */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 ${
                        isOutForDelivery ? "bg-blue-500" : "bg-yellow-500"
                      }`}
                    />

                    {/* Header: Stop Number & Status */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <span className="bg-neutral-800 text-neutral-300 text-xs font-bold px-2 py-1 rounded-md">
                          Stop {index + 1}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-md ${
                            isOutForDelivery
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {isOutForDelivery ? "ON THE WAY" : "PENDING"}
                        </span>
                      </div>
                    </div>

                    {/* Address Block */}
                    <div className="mb-5">
                      <div className="flex gap-3">
                        <div className="mt-1 flex-shrink-0">
                          <MapPin className="w-5 h-5 text-neutral-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium text-base leading-tight mb-1">
                            {displayAddress}
                          </p>
                          <p className="text-neutral-400 text-sm">
                            {customerDisplay} • {customerPhone}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 mt-2">
                      <button className="flex items-center justify-center gap-2 w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl font-semibold text-sm transition-colors">
                        <Navigation className="w-4 h-4" />
                        Open in Google Maps
                      </button>

                      {!isOutForDelivery ? (
                        <button
                          onClick={() =>
                            updateDeliveryStatus(delivery._id, "start")
                          }
                          disabled={!!actionLoading}
                          className="flex items-center justify-center gap-2 w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                        >
                          {isActionLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              Start Delivery
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            updateDeliveryStatus(delivery._id, "complete")
                          }
                          disabled={!!actionLoading}
                          className="flex items-center justify-center gap-2 w-full py-3.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                        >
                          {isActionLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Mark Delivered
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {completedDeliveries.length > 0 && (
             <div className="mt-10">
             <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-4 px-2">
               Completed ({completedDeliveries.length})
             </h2>
             <div className="space-y-3 opacity-60">
                {completedDeliveries.map((delivery) => {
                   const order = delivery.orderId;
                   const displayAddress =
                     order?.deliveryAddress?.fullAddress ||
                     "Address not available";
                     
                   return (
                      <div key={delivery._id} className="bg-neutral-950 rounded-xl p-4 border border-neutral-800 flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-green-500" />
                         </div>
                         <p className="text-neutral-300 text-sm font-medium line-clamp-1">{displayAddress}</p>
                      </div>
                   );
                })}
             </div>
           </div>
          )}
        </main>
      </div>
    </div>
  );
}
