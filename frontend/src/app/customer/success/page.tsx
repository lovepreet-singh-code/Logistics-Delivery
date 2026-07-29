"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, ArrowRight, Package, MapPin, CalendarDays, ExternalLink } from "lucide-react";
import Link from "next/link";
import Confetti from "react-confetti";
import { useEffect, useState } from "react";

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const trackingId = searchParams.get("id");
  
  const [windowDimension, setWindowDimension] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowDimension({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  if (!trackingId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-slate-500">No tracking ID provided.</p>
        <button onClick={() => router.push("/customer")} className="text-indigo-600 font-bold mt-4">Go Home</button>
      </div>
    );
  }

  // Calculate ETA dynamically (e.g. 2-3 days)
  const etaDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toDateString();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
      {windowDimension.width > 0 && (
        <Confetti 
          width={windowDimension.width} 
          height={windowDimension.height} 
          recycle={false} 
          numberOfPieces={400} 
          gravity={0.15}
        />
      )}

      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 md:p-12 max-w-lg w-full text-center relative overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-emerald-50 to-white -z-10" />
        
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-emerald-50 relative">
          <div className="absolute inset-0 rounded-full border-4 border-white animate-ping opacity-20"></div>
          <CheckCircle className="w-12 h-12 text-emerald-600" />
        </div>
        
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">Booking Successful!</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Your shipment has been registered successfully. Our delivery partner will arrive for pickup shortly.
        </p>
        
        <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tracking ID</p>
          <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 mb-4 shadow-sm">
            <span className="font-mono font-bold text-indigo-600 text-lg tracking-wider">{trackingId}</span>
            <Package className="w-5 h-5 text-slate-400" />
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-600">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
              <CalendarDays className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Estimated Delivery</p>
              <p className="text-xs text-slate-500">{etaDate}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link 
            href={`/customer/track?id=${trackingId}`}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] hover:-translate-y-0.5"
          >
            Track Parcel <MapPin className="w-5 h-5" />
          </Link>
          <Link 
            href="/customer/orders"
            className="flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 px-6 py-4 rounded-xl font-bold transition-all hover:bg-slate-50 hover:text-slate-900 shadow-sm"
          >
            View Orders <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
