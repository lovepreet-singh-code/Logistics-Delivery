"use client";

import { useEffect, useState } from "react";
import { Package, Truck, CheckCircle, Clock, MapPin, Search } from "lucide-react";
import { apiOrder } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const STATUS_STEPS = ["PENDING", "ROUTED", "MANIFESTED", "IN_TRANSIT", "DELIVERED"];

export default function TrackOrderPage({ params }: { params: { orderId: string } }) {
  const router = useRouter();
  const { orderId } = params;
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    if (orderId && orderId !== "search") {
      fetchOrder(orderId);
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrder = async (id: string) => {
    try {
      setLoading(true);
      const res = await apiOrder.get(`/${id}`);
      setOrder(res.data.data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Order not found");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/track/${searchInput.trim()}`);
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case "PENDING": return <Clock className="w-6 h-6" />;
      case "ROUTED": return <MapPin className="w-6 h-6" />;
      case "MANIFESTED": return <Package className="w-6 h-6" />;
      case "IN_TRANSIT": return <Truck className="w-6 h-6" />;
      case "DELIVERED": return <CheckCircle className="w-6 h-6" />;
      default: return <Clock className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8 flex flex-col items-center">
      
      {/* Header / Search */}
      <div className="w-full max-w-3xl flex justify-between items-center mb-12 mt-8">
        <div className="flex items-center gap-3 text-primary">
          <Truck className="w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">LogisTrack</h1>
        </div>
        
        <form onSubmit={handleSearch} className="relative hidden md:block">
          <input 
            type="text" 
            placeholder="Track another order..."
            className="pl-10 pr-4 py-2 rounded-full border border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary w-64 shadow-sm"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
        </form>
      </div>

      {orderId === "search" && !order && !loading ? (
        <div className="glass w-full max-w-md p-8 rounded-2xl shadow-xl flex flex-col items-center text-center mt-12 transform transition-all hover:scale-[1.02]">
          <Package className="w-16 h-16 text-primary mb-4 opacity-80" />
          <h2 className="text-2xl font-semibold mb-2">Track Your Parcel</h2>
          <p className="text-slate-500 mb-6">Enter your Order ID to see real-time status.</p>
          <form onSubmit={handleSearch} className="w-full relative">
            <input 
              type="text" 
              placeholder="e.g. 6696a0000000000000000001"
              className="w-full pl-4 pr-12 py-4 rounded-xl border border-slate-200 shadow-inner bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-lg"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              required
            />
            <button type="submit" className="absolute right-2 top-2 p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
              <Search className="w-6 h-6" />
            </button>
          </form>
        </div>
      ) : (
        <div className="w-full max-w-3xl glass rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
          {/* Order Banner */}
          <div className="bg-gradient-to-r from-primary to-blue-600 p-8 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-blue-100 font-medium mb-1">ORDER NUMBER</p>
                <h2 className="text-3xl font-bold tracking-wider">{orderId}</h2>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center px-4 py-2 bg-white/20 rounded-full backdrop-blur-md font-semibold tracking-wide border border-white/30">
                  {loading ? "Loading..." : error ? "Error" : order?.status}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-center py-20 text-red-500">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Order Not Found</h3>
                <p>{error}</p>
                <button 
                  onClick={() => router.push('/track/search')}
                  className="mt-6 px-6 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
                {/* Timeline */}
                <div className="relative mb-16 mt-4">
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 dark:bg-slate-700 -translate-y-1/2 z-0 rounded-full"></div>
                  
                  {/* Progress Line */}
                  <div 
                    className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(STATUS_STEPS.indexOf(order?.status) / (STATUS_STEPS.length - 1)) * 100}%` }}
                  ></div>

                  <div className="relative z-10 flex justify-between">
                    {STATUS_STEPS.map((step, index) => {
                      const isActive = STATUS_STEPS.indexOf(order?.status) >= index;
                      const isCurrent = order?.status === step;
                      return (
                        <div key={step} className="flex flex-col items-center">
                          <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 shadow-lg",
                            isActive 
                              ? "bg-primary border-white text-white dark:border-slate-800 scale-110" 
                              : "bg-white border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700",
                            isCurrent && "ring-4 ring-primary/30 animate-pulse"
                          )}>
                            {getStepIcon(step)}
                          </div>
                          <span className={cn(
                            "mt-3 text-xs md:text-sm font-semibold tracking-wider",
                            isActive ? "text-slate-800 dark:text-slate-200" : "text-slate-400"
                          )}>
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid md:grid-cols-2 gap-8 border-t border-slate-200 dark:border-slate-700 pt-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm text-slate-500 font-semibold mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> ORIGIN
                      </h4>
                      <p className="font-medium text-lg text-slate-800 dark:text-slate-200">{order?.pickupAddress?.fullAddress}</p>
                      <p className="text-sm text-slate-500">PIN: {order?.pickupAddress?.pinCode}</p>
                    </div>
                    <div>
                      <h4 className="text-sm text-slate-500 font-semibold mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" /> DESTINATION
                      </h4>
                      <p className="font-medium text-lg text-slate-800 dark:text-slate-200">{order?.deliveryAddress?.fullAddress}</p>
                      <p className="text-sm text-slate-500">PIN: {order?.deliveryAddress?.pinCode}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl space-y-4 shadow-inner">
                    <h4 className="text-sm text-slate-500 font-semibold mb-2">PARCEL DETAILS</h4>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-slate-600 dark:text-slate-400">Weight</span>
                      <span className="font-semibold">{order?.parcelDetails?.weightKg} kg</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-slate-600 dark:text-slate-400">Dimensions</span>
                      <span className="font-semibold">
                        {order?.parcelDetails?.dimensions?.lengthCm} x {order?.parcelDetails?.dimensions?.widthCm} x {order?.parcelDetails?.dimensions?.heightCm} cm
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Volume</span>
                      <span className="font-semibold">{order?.parcelDetails?.totalVolumeCm3} cm³</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
