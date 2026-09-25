"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Package, CheckCircle2, Loader2, MapPin, ScanBarcode } from "lucide-react";
import apiClient from "@/lib/apiClient";
import Link from "next/link";
import { Toaster, toast } from 'react-hot-toast';

export default function PickupExecutionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  
  const [actualWeight, setActualWeight] = useState("");
  const [scannedQR, setScannedQR] = useState("");

  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
      try {
        const res = await apiClient.get(`/orders/${id}`);
        setOrder(res.data.data);
        if(res.data.data.parcelDetails?.weightKg) {
            setActualWeight(res.data.data.parcelDetails.weightKg.toString());
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load pickup details");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleCompletePickup = async () => {
    if (!actualWeight || parseFloat(actualWeight) <= 0) {
      toast.error("Please enter a valid actual weight.");
      return;
    }

    try {
      setCompleting(true);
      await apiClient.post(`/orders/${id}/pickup`, {
        actualWeight: parseFloat(actualWeight),
        scannedQR: scannedQR || order.awb
      });
      
      toast.success("Pickup completed successfully!");
      setTimeout(() => router.push("/agent/routes"), 1500);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to complete pickup.");
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-4" />
        <p className="text-slate-400 font-medium">Loading pickup details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
          <span className="text-red-500 text-2xl font-bold">!</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Error</h2>
        <p className="text-slate-400 mb-6">{error || "Pickup task not found"}</p>
        <Link href="/agent/routes" className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold">
          Go Back
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-32">
      <Toaster position="top-center" />
      
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 px-4 py-4 flex items-center gap-4 shadow-xl">
        <button onClick={() => router.push('/agent/routes')} className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-white shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">Complete Pickup</h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">{order.awb || id}</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Location Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center shrink-0 border border-amber-500/30">
              <MapPin className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Pickup Address</p>
              <p className="text-white text-sm font-medium leading-relaxed">{order.pickupAddress.fullAddress}</p>
              <p className="text-slate-400 text-xs mt-2">{order.pickupAddress.senderName} • {order.pickupAddress.senderPhone}</p>
            </div>
          </div>
        </div>

        {/* Input Actual Weight */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
           <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
             <Package className="w-4 h-4 text-amber-400" /> Actual Weight Verification
           </h3>
           <div className="relative">
              <input 
                type="number" 
                step="0.1" 
                value={actualWeight}
                onChange={(e) => setActualWeight(e.target.value)}
                placeholder="Enter measured weight..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 font-bold"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">kg</span>
           </div>
        </div>

        {/* QR Scan */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
           <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
             <ScanBarcode className="w-4 h-4 text-amber-400" /> Parcel QR/Barcode
           </h3>
           <input 
              type="text" 
              value={scannedQR}
              onChange={(e) => setScannedQR(e.target.value)}
              placeholder="Scan or enter manually (Optional)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 font-mono text-sm"
           />
        </div>

      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 z-40">
        <button
          onClick={handleCompletePickup}
          disabled={completing}
          className="w-full h-14 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 disabled:opacity-50 text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(217,119,6,0.3)]"
        >
          {completing ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
          ) : (
            <><CheckCircle2 className="w-5 h-5" /> Mark as Picked Up</>
          )}
        </button>
      </div>
    </div>
  );
}
