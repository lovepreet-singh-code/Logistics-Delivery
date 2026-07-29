"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  MapPin, 
  Package, 
  Truck, 
  User, 
  Download, 
  Calendar,
  Phone,
  CheckCircle2,
  Clock,
  Car,
  XCircle
} from "lucide-react";
import SkeletonLoader from "@/components/SkeletonLoader";

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return router.push("/");
        
        const res = await axios.get(`http://localhost:8080/api/orders/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setOrder(res.data.data);
      } catch (err: any) {
        console.error(err);
        setError("Failed to load order details.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto pb-12 pt-8">
        <SkeletonLoader type="card" count={3} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto pb-12 pt-8 text-center">
        <div className="bg-red-50 text-red-600 p-8 rounded-3xl border border-red-100">
          <p className="font-bold text-lg">{error || "Order not found"}</p>
          <button onClick={() => router.push("/customer/orders")} className="mt-4 underline hover:text-red-800">Back to Orders</button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "OUT_FOR_DELIVERY":
      case "IN_TRANSIT": return "bg-amber-100 text-amber-700 border-amber-200";
      case "CANCELLED": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-indigo-100 text-indigo-700 border-indigo-200";
    }
  };

  const isDelivered = order.status === "DELIVERED";
  const agent = order.agentId;
  const vehicle = order.vehicleId;

  return (
    <div className="max-w-5xl mx-auto pb-12 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/customer/orders")}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">#{order._id.slice(-8).toUpperCase()}</h1>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold border uppercase tracking-wider ${getStatusColor(order.status)}`}>
                {order.status.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-slate-500 mt-1 text-sm font-medium">Placed on {new Date(order.createdAt).toLocaleString()}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
            <button className="inline-flex items-center gap-2 bg-white text-red-600 border border-red-200 px-5 py-2.5 rounded-xl font-bold hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm active:scale-95">
              <XCircle className="w-4 h-4" /> Cancel Order
            </button>
          )}
          <button className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg hover:shadow-slate-900/20 active:scale-95">
            <Download className="w-4 h-4" /> Download Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Details) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Sender & Receiver */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -z-10" />
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-indigo-500" /> Pickup Details
              </h2>
              <div className="space-y-3">
                <p className="font-bold text-slate-900">{order.pickupAddress.senderName || "Sender"}</p>
                <div className="flex items-start gap-2 text-slate-600 text-sm">
                  <MapPin className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                  <p>{order.pickupAddress.fullAddress}, {order.pickupAddress.pinCode}</p>
                </div>
                {order.pickupAddress.senderPhone && (
                  <div className="flex items-center gap-2 text-slate-600 text-sm">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <p>{order.pickupAddress.senderPhone}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-10" />
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-emerald-500" /> Delivery Details
              </h2>
              <div className="space-y-3">
                <p className="font-bold text-slate-900">{order.deliveryAddress.receiverName || "Receiver"}</p>
                <div className="flex items-start gap-2 text-slate-600 text-sm">
                  <MapPin className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                  <p>{order.deliveryAddress.fullAddress}, {order.deliveryAddress.pinCode}</p>
                </div>
                {order.deliveryAddress.receiverPhone && (
                  <div className="flex items-center gap-2 text-slate-600 text-sm">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <p>{order.deliveryAddress.receiverPhone}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Parcel & Payment */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4" /> Parcel Info
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Parcel Type</p>
                  <p className="font-semibold text-slate-900">{order.parcelDetails?.parcelType || "Box"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Weight</p>
                  <p className="font-semibold text-slate-900">{order.parcelDetails?.weightKg || order.weight} kg</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Dimensions</p>
                  <p className="font-semibold text-slate-900">
                    {order.parcelDetails?.lengthCm}x{order.parcelDetails?.widthCm}x{order.parcelDetails?.heightCm} cm
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Declared Value</p>
                  <p className="font-semibold text-slate-900">₹{order.parcelDetails?.declaredValue || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="w-px bg-slate-100 hidden md:block"></div>
            
            <div className="flex-1 space-y-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Payment Details
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Fare</span>
                  <span className="font-bold text-slate-900">₹{order.fare || 50}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Payment Status</span>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase text-[10px] tracking-wider">Paid</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Payment Method</span>
                  <span className="font-semibold text-slate-700">Card ending in 4242</span>
                </div>
              </div>
            </div>
          </div>

          {/* Logistics Agent & Vehicle */}
          {(agent || vehicle) && (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-6">
                <Truck className="w-4 h-4" /> Logistics Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {agent && (
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-0.5">Assigned Agent</p>
                      <p className="font-bold text-slate-900">{agent.name}</p>
                      <p className="text-xs text-slate-500">{agent.phone || "+91 98765 43210"}</p>
                    </div>
                  </div>
                )}
                {vehicle && (
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                      <Car className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-0.5">Vehicle</p>
                      <p className="font-bold text-slate-900">{vehicle.make} {vehicle.model}</p>
                      <p className="text-xs text-slate-500 font-mono">{vehicle.licensePlate}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Column (Timeline) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm sticky top-28">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" /> Tracking Timeline
            </h2>

            <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              
              <div className="relative z-10">
                <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center absolute -left-[30px] border-4 border-white shadow-sm">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
                <p className="font-bold text-slate-900">Order Placed</p>
                <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
              </div>

              <div className="relative z-10">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center absolute -left-[30px] border-4 border-white shadow-sm ${["OUT_FOR_DELIVERY", "IN_TRANSIT", "DELIVERED"].includes(order.status) ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>
                  {["OUT_FOR_DELIVERY", "IN_TRANSIT", "DELIVERED"].includes(order.status) && <CheckCircle2 className="w-3 h-3" />}
                </div>
                <p className={`font-bold ${["OUT_FOR_DELIVERY", "IN_TRANSIT", "DELIVERED"].includes(order.status) ? 'text-slate-900' : 'text-slate-400'}`}>In Transit</p>
                {["OUT_FOR_DELIVERY", "IN_TRANSIT", "DELIVERED"].includes(order.status) && <p className="text-xs text-slate-500">Package has left the facility.</p>}
              </div>
              
              <div className="relative z-10">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center absolute -left-[30px] border-4 border-white shadow-sm ${isDelivered ? 'bg-emerald-500 text-white' : 'bg-slate-200'}`}>
                  {isDelivered && <CheckCircle2 className="w-3 h-3" />}
                </div>
                <p className={`font-bold ${isDelivered ? 'text-emerald-600' : 'text-slate-400'}`}>Delivered</p>
                {isDelivered && <p className="text-xs text-slate-500">Successfully delivered to recipient.</p>}
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
