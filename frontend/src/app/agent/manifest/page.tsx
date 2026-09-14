"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  ArrowLeft,
  Truck,
  MapPin,
  ListOrdered,
  Camera,
  X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";

interface Order {
  _id: string;
  deliveryAddress?: {
    fullAddress?: string;
    city?: string;
  };
  receiverName?: string;
}

interface LoadItem extends Order {
  isLoaded: boolean;
  loadSequence: number;
}

export default function LoadingManifest() {
  const router = useRouter();
  const [loadPlan, setLoadPlan] = useState<LoadItem[]>([]);
  const [loadedItems, setLoadedItems] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const [scannerActive, setScannerActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const fetchAssignedOrders = async () => {
      try {
        if (typeof window === "undefined") return;
        
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await axios.get(`http://localhost:8080/api/orders?t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = res.data.data || res.data;
        let orders: Order[] = Array.isArray(data) ? data : [];

        // Keep active pending orders
        orders = orders.filter(o => !["DELIVERED", "CANCELLED"].includes((o as any).status));

        // Fallback dummy data if API returns empty for testing
        if (orders.length === 0) {
          orders = [
            { _id: "STOP1-A7X92Q", receiverName: "Stop 1", deliveryAddress: { fullAddress: "742 Evergreen Terrace", city: "Springfield" } },
            { _id: "STOP2-B8Y33R", receiverName: "Stop 2", deliveryAddress: { fullAddress: "308 Negra Arroyo Lane", city: "Albuquerque" } },
            { _id: "STOP3-C9Z44S", receiverName: "Stop 3", deliveryAddress: { fullAddress: "31 Spooner Street", city: "Quahog" } }
          ];
        }

        // CRITICAL LIFO LOGIC: Reverse the array so last delivery is loaded first.
        const reversedOrders = [...orders].reverse();
        
        const initialLoadPlan: LoadItem[] = reversedOrders.map((order, index) => ({
          ...order,
          isLoaded: false,
          loadSequence: index + 1 // 1-based sequence
        }));

        setLoadPlan(initialLoadPlan);
        setLoadedItems({});
      } catch (error) {
        console.error("Failed to fetch manifest", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssignedOrders();
  }, [router]);

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.error("Audio beep failed", e);
    }
  };

  const startScanner = async () => {
    setScannerActive(true);
    setTimeout(() => {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader");
      }
      scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // Match decodedText with loadPlan _id
          // Either exact match or if ID is embedded (e.g. tracking URL)
          setLoadPlan(currentPlan => {
            const matchedItem = currentPlan.find(item => 
              item._id === decodedText || 
              decodedText.includes(item._id) || 
              item._id.includes(decodedText)
            );
            
            if (matchedItem) {
              setLoadedItems(prev => {
                if (!prev[matchedItem._id]) {
                  playBeep();
                  return { ...prev, [matchedItem._id]: true };
                }
                return prev;
              });
            }
            return currentPlan;
          });
        },
        (errorMessage) => {
          // ignore scan stream errors
        }
      ).catch(err => {
        console.error("Scanner failed to start", err);
        setScannerActive(false);
      });
    }, 200);
  };

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => {
        scannerRef.current?.clear();
        setScannerActive(false);
      }).catch(err => {
        console.error(err);
        setScannerActive(false);
      });
    } else {
      setScannerActive(false);
    }
  };
  
  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const toggleLoaded = (id: string) => {
    setLoadedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const allLoaded = loadPlan.length > 0 && loadPlan.every(item => !!loadedItems[item._id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-medium animate-pulse">Generating Load Manifest...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-40">
      
      {/* SCANNER OVERLAY */}
      {scannerActive && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center animate-in fade-in">
          <div className="w-full h-full relative max-w-lg mx-auto bg-black flex items-center justify-center">
            
            {/* The actual video feed container */}
            <div id="reader" className="w-full h-full object-cover"></div>
            
            {/* Custom Overlay (Targeting Reticle) */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
               <div className="w-64 h-64 border border-indigo-500/20 relative shadow-[inset_0_0_30px_rgba(99,102,241,0.2)]">
                 {/* Corner Accents */}
                 <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-indigo-500"></div>
                 <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-indigo-500"></div>
                 <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-indigo-500"></div>
                 <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-indigo-500"></div>
                 
                 {/* Scanning laser line (simulated via pulse) */}
                 <div className="w-full h-0.5 bg-indigo-500 absolute top-1/2 left-0 shadow-[0_0_10px_rgba(99,102,241,1)] animate-pulse"></div>
               </div>
            </div>

            {/* Close Button */}
            <button 
              onClick={stopScanner}
              className="absolute top-8 right-6 w-12 h-12 bg-slate-900/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-slate-700 z-20 hover:bg-slate-800 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            
            <div className="absolute bottom-12 inset-x-0 text-center z-20">
               <p className="text-white font-medium bg-slate-950/80 border border-slate-800 inline-block px-6 py-3 rounded-full backdrop-blur-md shadow-lg">
                 Position AWB/QR code in frame
               </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-30 px-6 py-4 flex items-center gap-4 shadow-md">
        <Link href="/agent" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Load Manifest</h1>
          <p className="text-xs text-indigo-400 font-bold flex items-center gap-1 mt-0.5 uppercase tracking-widest">
            <ListOrdered className="w-3.5 h-3.5" /> LIFO Protocol Active
          </p>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-lg mx-auto mt-2">
        {/* Warning Banner */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-8 shadow-lg shadow-amber-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-black text-amber-500 text-sm tracking-wide uppercase">Reverse Loading Required</h3>
              <p className="text-amber-500/90 text-xs mt-1.5 leading-relaxed font-medium">
                Load boxes exactly in this order. The first box loaded will be placed at the back of the truck, ensuring the first delivery is accessible at the front.
              </p>
            </div>
          </div>
        </div>

        {/* Load Plan List */}
        <div className="space-y-3">
          {loadPlan.map((item) => {
            const isLoaded = !!loadedItems[item._id];
            
            return (
              <div 
                key={item._id}
                onClick={() => toggleLoaded(item._id)}
                className={`
                  relative p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden
                  ${isLoaded 
                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]' 
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-xl'}
                `}
              >
                {isLoaded && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -translate-y-10 translate-x-10 pointer-events-none"></div>
                )}
                
                <div className="flex items-center gap-4 relative z-10">
                  {/* Sequence Indicator */}
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shrink-0 transition-all duration-300
                    ${isLoaded ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-800 text-slate-400'}
                  `}>
                    {isLoaded ? <CheckCircle className="w-6 h-6 animate-in zoom-in" /> : item.loadSequence}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`font-mono text-xs font-bold ${isLoaded ? 'text-emerald-400' : 'text-indigo-400'}`}>
                        {item._id.substring(0, 8).toUpperCase()}
                      </p>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isLoaded ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                        {isLoaded ? 'Loaded' : 'Pending'}
                      </span>
                    </div>
                    <h4 className={`font-bold truncate text-sm md:text-base ${isLoaded ? 'text-emerald-50' : 'text-white'}`}>
                      {item.receiverName || "Unknown Receiver"}
                    </h4>
                    <div className={`flex items-center gap-1.5 mt-1 text-xs truncate font-medium ${isLoaded ? 'text-emerald-200/70' : 'text-slate-500'}`}>
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.deliveryAddress?.fullAddress || item.deliveryAddress?.city || "Address unavailable"}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent z-40">
        <div className="max-w-lg mx-auto flex flex-col gap-3">
          
          {/* CAMERA SCANNER FAB */}
          {!allLoaded && (
            <button 
              onClick={startScanner}
              className="w-full h-16 p-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <Camera className="w-6 h-6" />
              OPEN CAMERA TO SCAN PARCEL
            </button>
          )}

          {allLoaded ? (
            <a 
              href="/agent"
              className="w-full h-16 p-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-widest shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 animate-in slide-in-from-bottom-2 active:scale-95"
            >
              <Truck className="w-6 h-6 animate-pulse" />
              START DELIVERY ROUTE
            </a>
          ) : (
            <a 
              href="#"
              className="w-full h-16 p-4 rounded-2xl bg-slate-800 text-slate-500 font-bold text-sm uppercase tracking-widest pointer-events-none flex items-center justify-center gap-3"
            >
              <Package className="w-5 h-5" />
              LOAD ALL PACKAGES TO START
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
