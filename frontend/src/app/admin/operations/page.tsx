"use client";

import React, { useState, useEffect } from "react";
import { ScanBarcode, Package, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import QrScanner from "@/components/QrScanner";
import apiClient from "@/lib/apiClient";

export default function OperationsPage() {
  const [scannedLogs, setScannedLogs] = useState<{ id: string; status: "success" | "error"; time: string }[]>([]);
  const [manualId, setManualId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleScan = async (scannedId: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // Find order by ID to make sure it exists before updating status
      // In production, backend should handle the short ID resolution or just accept it directly
      
      const res = await apiClient.patch(`/orders/${scannedId}/status`, {
        status: "AT_HUB"
      });

      if (res.data.success) {
        toast.success(`Parcel ${scannedId} successfully inwarded!`);
        setScannedLogs((prev) => [
          { id: scannedId, status: "success", time: new Date().toLocaleTimeString() },
          ...prev,
        ]);
      } else {
        toast.error(`Failed to inward parcel ${scannedId}.`);
        setScannedLogs((prev) => [
          { id: scannedId, status: "error", time: new Date().toLocaleTimeString() },
          ...prev,
        ]);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || `Invalid package ID: ${scannedId}`);
      setScannedLogs((prev) => [
        { id: scannedId, status: "error", time: new Date().toLocaleTimeString() },
        ...prev,
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6">
      <Toaster position="top-right" />
      <header>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <ScanBarcode className="w-8 h-8 text-emerald-500" />
          Hub Inwarding Operations
        </h1>
        <p className="text-slate-400 mt-1">Scan physical packages arriving at the hub to update their status to AT_HUB.</p>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-8">
        
        {/* Left Pane: Camera Scanner */}
        <div className="flex-[1.5] bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
          
          <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2 mb-6 relative z-10">
            <ScanBarcode className="w-5 h-5 text-emerald-400" /> Active Scanner
          </h2>

          <div className="flex-1 flex flex-col items-center justify-center relative z-10">
             <QrScanner 
                onScanSuccess={(text) => {
                  handleScan(text);
                }}
             />

             <div className="mt-8 w-full max-w-sm">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Manual Entry Fallback</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value.toUpperCase())}
                    placeholder="Enter Tracking ID..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-emerald-500 uppercase"
                  />
                  <button 
                    disabled={isProcessing}
                    onClick={() => {
                      if(manualId.trim()){
                        handleScan(manualId.trim());
                        setManualId("");
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold px-6 rounded-xl transition-colors flex items-center justify-center min-w-[100px]"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Inward"}
                  </button>
                </div>
             </div>
          </div>
        </div>

        {/* Right Pane: Scan Logs */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-400" /> Scan Session Logs
            </h2>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold font-mono">
              {scannedLogs.length} Scanned
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {scannedLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center px-8">
                <ScanBarcode className="w-12 h-12 mb-4 opacity-50" />
                <p>Waiting for scans...</p>
                <p className="text-sm mt-2 opacity-75">Scanned packages will appear here.</p>
              </div>
            ) : (
              scannedLogs.map((log, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-2xl border flex justify-between items-center ${
                    log.status === "success" 
                      ? "bg-emerald-500/10 border-emerald-500/30" 
                      : "bg-red-500/10 border-red-500/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {log.status === "success" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <h4 className="font-mono font-bold text-slate-200">
                        {log.id.length > 8 ? log.id.slice(-8).toUpperCase() : log.id}
                      </h4>
                      <p className="text-xs text-slate-400">{log.status === "success" ? "Status updated to AT_HUB" : "Invalid or Not Found"}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-500">{log.time}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
