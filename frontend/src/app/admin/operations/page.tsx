"use client";

import React, { useState } from "react";
import { ScanBarcode, Package, CheckCircle2, AlertTriangle, Loader2, Printer, X } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import QrScanner from "@/components/QrScanner";
import apiClient from "@/lib/apiClient";
import { QRCodeSVG } from 'qrcode.react';

export default function OperationsPage() {
  const [scannedLogs, setScannedLogs] = useState<{ id: string; status: "success" | "error"; time: string }[]>([]);
  const [manualId, setManualId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Inwarding State
  const [pendingInwardOrder, setPendingInwardOrder] = useState<any>(null);
  const [dimensions, setDimensions] = useState({ lengthCm: '', widthCm: '', heightCm: '', actualWeightKg: '' });

  // Label State
  const [labelData, setLabelData] = useState<any>(null);

  const fetchOrderForInwarding = async (scannedId: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setLabelData(null);

    try {
      const res = await apiClient.get(`/orders/${scannedId}`);
      if (res.data.success && res.data.data) {
        const order = res.data.data;
        if (['ORDER_PLACED', 'PENDING_PICKUP', 'PICKUP_COMPLETED', 'PICKED_UP', 'PENDING_INWARD', 'AT_HUB'].includes(order.status)) {
           // Ready for inwarding or re-inwarding
           setPendingInwardOrder(order);
           setDimensions({
             lengthCm: order.parcelDetails?.dimensions?.lengthCm?.toString() || '',
             widthCm: order.parcelDetails?.dimensions?.widthCm?.toString() || '',
             heightCm: order.parcelDetails?.dimensions?.heightCm?.toString() || '',
             actualWeightKg: order.actualWeight?.toString() || order.parcelDetails?.weightKg?.toString() || ''
           });
        } else {
           toast.error(`Order ${scannedId} is in status ${order.status}, cannot inward.`);
           addLog(scannedId, "error");
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || `Invalid package ID: ${scannedId}`);
      addLog(scannedId, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const submitInwarding = async () => {
    if (!pendingInwardOrder) return;
    setIsProcessing(true);
    try {
      const res = await apiClient.patch(`/orders/${pendingInwardOrder._id}/inward`, {
        lengthCm: Number(dimensions.lengthCm),
        widthCm: Number(dimensions.widthCm),
        heightCm: Number(dimensions.heightCm),
        actualWeightKg: Number(dimensions.actualWeightKg)
      });

      if (res.data.success) {
        toast.success(`Parcel successfully inwarded!`);
        addLog(pendingInwardOrder.awb || pendingInwardOrder._id, "success");
        setLabelData(res.data.data);
        setPendingInwardOrder(null);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to inward parcel.");
    } finally {
      setIsProcessing(false);
    }
  };

  const addLog = (id: string, status: "success" | "error") => {
    setScannedLogs((prev) => [
      { id, status, time: new Date().toLocaleTimeString() },
      ...prev,
    ]);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6">
      <Toaster position="top-right" />
      <header className="print:hidden">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <ScanBarcode className="w-8 h-8 text-emerald-500" />
          Hub Inwarding Operations
        </h1>
        <p className="text-slate-400 mt-1">Scan physical packages arriving at the hub to record actual measurements, update billing, and print labels.</p>
      </header>

      {/* Main UI */}
      <div className="flex-1 flex flex-col lg:flex-row gap-8 print:hidden">
        {/* Left Pane: Scanner */}
        <div className="flex-[1.5] bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col shadow-xl relative overflow-hidden">
          <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2 mb-6">
            <ScanBarcode className="w-5 h-5 text-emerald-400" /> Active Scanner
          </h2>
          <div className="flex-1 flex flex-col items-center justify-center">
             {!pendingInwardOrder && !labelData && (
               <>
                 <QrScanner onScanSuccess={(text) => fetchOrderForInwarding(text)} />
                 <div className="mt-8 w-full max-w-sm">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Manual Entry Fallback</p>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={manualId}
                        onChange={(e) => setManualId(e.target.value.toUpperCase())}
                        placeholder="Enter AWB or ID..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-emerald-500 uppercase"
                      />
                      <button 
                        disabled={isProcessing}
                        onClick={() => {
                          if(manualId.trim()){
                            fetchOrderForInwarding(manualId.trim());
                            setManualId("");
                          }
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold px-6 rounded-xl transition-colors min-w-[100px]"
                      >
                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Lookup"}
                      </button>
                    </div>
                 </div>
               </>
             )}

             {/* Inwarding Form Modal */}
             {pendingInwardOrder && (
               <div className="w-full max-w-md bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-2xl relative">
                 <button onClick={() => setPendingInwardOrder(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                   <X className="w-6 h-6" />
                 </button>
                 <h3 className="text-xl font-bold text-white mb-2">Inward Package</h3>
                 <p className="text-sm text-emerald-400 font-mono mb-6 bg-emerald-950/30 p-2 rounded border border-emerald-900">
                   ID: {pendingInwardOrder.awb || pendingInwardOrder.trackingId || pendingInwardOrder._id}
                 </p>
                 
                 <div className="space-y-4">
                   <div className="grid grid-cols-3 gap-4">
                     <div>
                       <label className="block text-xs text-slate-400 font-bold mb-1">Length (cm)</label>
                       <input type="number" value={dimensions.lengthCm} onChange={(e) => setDimensions({...dimensions, lengthCm: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono" />
                     </div>
                     <div>
                       <label className="block text-xs text-slate-400 font-bold mb-1">Width (cm)</label>
                       <input type="number" value={dimensions.widthCm} onChange={(e) => setDimensions({...dimensions, widthCm: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono" />
                     </div>
                     <div>
                       <label className="block text-xs text-slate-400 font-bold mb-1">Height (cm)</label>
                       <input type="number" value={dimensions.heightCm} onChange={(e) => setDimensions({...dimensions, heightCm: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono" />
                     </div>
                   </div>
                   <div>
                     <label className="block text-xs text-slate-400 font-bold mb-1">Actual Weight (kg)</label>
                     <input type="number" value={dimensions.actualWeightKg} onChange={(e) => setDimensions({...dimensions, actualWeightKg: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono" />
                   </div>
                   <button 
                     onClick={submitInwarding} 
                     disabled={isProcessing}
                     className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold py-3 rounded-xl mt-4 flex justify-center items-center gap-2"
                   >
                     {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5"/> Complete Inwarding</>}
                   </button>
                 </div>
               </div>
             )}

             {/* Print Label UI */}
             {labelData && (
               <div className="w-full flex flex-col items-center gap-4 mt-8">
                 <div className="print-label-container bg-white p-6 rounded-2xl w-full max-w-sm text-black shadow-2xl relative">
                   <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-4">
                     <h2 className="font-black text-2xl tracking-tighter">AGY EXPRESS</h2>
                     <span className="font-mono text-sm font-bold border border-black px-2 py-1 rounded">LIFO: {new Date().getHours()}{new Date().getMinutes()}</span>
                   </div>
                   <div className="flex justify-center mb-4">
                     <QRCodeSVG value={labelData.awb || labelData.trackingId || labelData._id} size={160} level="H" />
                   </div>
                   <div className="text-center font-mono font-bold text-lg mb-4 tracking-wider">
                     {labelData.awb || labelData.trackingId || labelData._id}
                   </div>
                   <div className="grid grid-cols-2 gap-2 text-sm border-t border-black pt-4">
                     <div>
                       <p className="text-gray-500 font-bold text-xs uppercase">Destination</p>
                       <p className="font-black text-xl">{labelData.deliveryAddress?.pinCode || "N/A"}</p>
                     </div>
                     <div className="text-right">
                       <p className="text-gray-500 font-bold text-xs uppercase">Billing Wt</p>
                       <p className="font-bold text-lg">{Math.max(labelData.actualWeight || 1, (labelData.parcelDetails?.totalVolumeCm3 || 5000) / 5000).toFixed(1)} kg</p>
                     </div>
                   </div>
                 </div>
                 
                 <div className="flex gap-4 w-full max-w-sm">
                   <button onClick={() => window.print()} className="flex-1 bg-white text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200">
                     <Printer className="w-5 h-5" /> Print Label
                   </button>
                   <button onClick={() => setLabelData(null)} className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-700">
                     Next Scan
                   </button>
                 </div>
               </div>
             )}
          </div>
        </div>

        {/* Right Pane: Logs */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col shadow-xl hidden lg:flex">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-400" /> Session Logs
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3">
            {scannedLogs.map((log, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border flex justify-between items-center ${log.status === "success" ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"}`}>
                <div className="flex items-center gap-3">
                  {log.status === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertTriangle className="w-5 h-5 text-red-500" />}
                  <div>
                    <h4 className="font-mono font-bold text-slate-200">{log.id.length > 8 ? log.id.slice(-8).toUpperCase() : log.id}</h4>
                    <p className="text-xs text-slate-400">{log.status === "success" ? "Inwarded & Billed" : "Failed Lookup"}</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-500">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden !important; }
          .print-label-container, .print-label-container * { visibility: visible !important; }
          .print-label-container { position: absolute; left: 0; top: 0; width: 4in; height: 6in; margin: 0; padding: 0.5in; box-shadow: none; border-radius: 0; }
        }
      `}} />
    </div>
  );
}
