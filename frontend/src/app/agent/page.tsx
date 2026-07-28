"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, CheckCircle, LogOut, Package, Navigation } from "lucide-react";

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

  useEffect(() => {
    fetchManifest();
  }, []);

  const fetchManifest = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/");
        return;
      }

      const response = await fetch(
        "http://localhost:8080/api/dispatch/agent/manifest",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      if (result.success && result.data?.routeSequence) {
        // Handle the case where orders are nested inside routeSequence (depending on backend implementation)
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
    // Also remove cookie if set
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/");
  };

  const markAsDelivered = async (orderId: string) => {
    // Optimistic UI Update
    setOrders((prev) =>
      prev.map((order) =>
        order._id === orderId
          ? {
              ...order,
              status: "DELIVERED",
              updatedAt: new Date().toISOString(),
            }
          : order
      )
    );

    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:8080/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "DELIVERED" }),
      });
    } catch (err) {
      console.error("Failed to update status on server", err);
      // In a real app, you might want to revert the optimistic update here
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

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* ──── Header ──── */}
      <header className="bg-blue-600 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6" />
            <span className="font-bold text-sm tracking-wide hidden sm:inline">
              DELHIVERY CLONE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 opacity-80" />
            <h1 className="font-bold tracking-widest text-lg">ROUTE PLAN</h1>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-blue-700 rounded-full transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ──── Main Content ──── */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6 flex justify-between items-end">
          <h2 className="text-xl font-bold text-gray-800">
            Current Shipments
            <span className="block text-sm font-normal text-gray-500 mt-1">
              Priority LIFO (Last In, First Out)
            </span>
          </h2>
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {orders.length} Orders
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-lg">No active shipments.</p>
            <p className="text-gray-400 text-sm mt-1">You are all caught up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isDelivered = order.status === "DELIVERED";

              return (
                <div
                  key={order._id}
                  className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 overflow-hidden"
                >
                  {/* Status Indicator Line (Top border) */}
                  <div
                    className={`h-1.5 w-full ${
                      isDelivered ? "bg-emerald-500" : "bg-orange-500"
                    }`}
                  />

                  <div className="p-5">
                    {/* Header Row */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          Tracking ID
                        </p>
                        <p className="font-bold text-gray-900 font-mono text-sm sm:text-base">
                          {order.trackingId || order._id}
                        </p>
                      </div>
                      
                      {isDelivered ? (
                        <div className="flex flex-col items-end">
                           <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-100">
                            <CheckCircle className="w-3.5 h-3.5" />
                            DELIVERED
                          </span>
                          <span className="text-[10px] text-gray-400 mt-1 font-medium">
                            {formatTime(order.updatedAt)}
                          </span>
                        </div>
                      ) : (
                         <span className="bg-orange-50 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full border border-orange-100">
                          IN TRANSIT
                        </span>
                      )}
                    </div>

                    {/* Address Row */}
                    <div className="flex items-start gap-3 mb-4 bg-gray-50 p-3 rounded-lg">
                      <MapPin className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-gray-800 leading-snug">
                          {formatAddress(order.deliveryAddress)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 font-medium">
                          📞 {order.customerPhone || "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Action Row */}
                    {!isDelivered && (
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => markAsDelivered(order._id)}
                          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold py-2.5 px-6 rounded-lg shadow-sm shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
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
