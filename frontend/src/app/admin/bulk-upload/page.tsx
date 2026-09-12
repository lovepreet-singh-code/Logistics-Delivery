"use client";

import React, { useState, useRef } from "react";
import axios from "axios";
import { Upload, FileText, CheckCircle2, XCircle, AlertCircle, Loader2, Download, PackageOpen, LayoutDashboard } from "lucide-react";
import Link from "next/link";

interface UploadResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: string[];
}

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [customerId, setCustomerId] = useState("000000000000000000000000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".csv")) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError("Please upload a valid .csv file.");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith(".csv")) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError("Please upload a valid .csv file.");
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const downloadTemplate = () => {
    const headers = "SenderName,SenderPhone,SenderPincode,SenderAddress,ReceiverName,ReceiverPhone,ReceiverPincode,ReceiverAddress,Weight,ServiceType\n";
    const sampleRow = "ACME Corp,9876543210,400001,Nariman Point Mumbai,Stark Industries,9123456789,110001,Connaught Place Delhi,5.5,Box\n";
    const csvContent = "data:text/csv;charset=utf-8," + headers + sampleRow;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "B2B_Order_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async () => {
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("customerId", customerId || "000000000000000000000000");

      const response = await axios.post("http://localhost:8080/api/orders/bulk-upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setResult(response.data.data);
      } else {
        setError(response.data.message || "Failed to process the file.");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.response?.data?.message || err.message || "An unexpected error occurred during upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-300 font-sans selection:bg-indigo-500/30 pb-20">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#151921]/50 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
              <PackageOpen className="w-7 h-7 text-indigo-500" />
              B2B Bulk Upload
            </h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">High-Volume Order Ingestion Engine</p>
          </div>
          <Link href="/admin/orders" className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm font-bold text-slate-300 rounded-lg transition-colors border border-slate-700">
            <LayoutDashboard className="w-4 h-4" /> Back to Dispatch
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Upload Form */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#151921] border border-slate-800 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
              
              <h2 className="text-lg font-black text-white mb-6">Upload Configuration</h2>
              
              <div className="space-y-6 relative z-10">
                {/* Client ID Input */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    B2B Client ID (Optional)
                  </label>
                  <input 
                    type="text" 
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    placeholder="000000000000000000000000"
                    className="w-full bg-[#0B0E14] border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-700"
                  />
                  <p className="text-xs text-slate-500 mt-2">All orders in this batch will be assigned to this customer.</p>
                </div>

                {/* Drag & Drop Zone */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Data Source (.CSV)
                  </label>
                  <div 
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                      dragActive ? 'border-indigo-500 bg-indigo-500/10' : file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700 bg-[#0B0E14] hover:bg-slate-800/50 hover:border-slate-600'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                  >
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept=".csv"
                      onChange={handleChange}
                      className="hidden"
                    />
                    
                    {file ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">{file.name}</p>
                          <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(2)} KB ready for ingestion.</p>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setFile(null); }}
                          className="text-xs font-bold text-red-400 hover:text-red-300 uppercase tracking-wider mt-2"
                        >
                          Remove File
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                          <Upload className="w-6 h-6 text-indigo-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-300">Drag & drop your CSV file here</p>
                        <p className="text-xs text-slate-500">or click to browse local files</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Template Download */}
                <div className="flex justify-end">
                  <button 
                    onClick={downloadTemplate}
                    className="flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider"
                  >
                    <Download className="w-3.5 h-3.5" /> Sample CSV Template
                  </button>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400 font-medium">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button 
                  onClick={handleSubmit}
                  disabled={!file || loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-600/20 disabled:shadow-none active:scale-[0.98] transition-all text-sm tracking-wider flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      INGESTING DATA...
                    </>
                  ) : (
                    "PROCESS DATA"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Processing Report */}
          <div className="lg:col-span-7">
            
            {!result ? (
              // Empty State
              <div className="h-full min-h-[400px] border-2 border-dashed border-slate-800 rounded-[2rem] flex flex-col items-center justify-center text-center p-8 bg-[#151921]/30">
                <FileText className="w-16 h-16 text-slate-800 mb-4" />
                <h3 className="text-lg font-bold text-slate-400">Awaiting Data Payload</h3>
                <p className="text-sm text-slate-600 mt-2 max-w-sm">
                  Upload a structured CSV file to view the real-time ingestion report, including successfully minted AWBs and validation errors.
                </p>
              </div>
            ) : (
              // Result Report
              <div className="bg-[#151921] border border-slate-800 rounded-[2rem] p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                <h2 className="text-xl font-black text-white mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  Ingestion Report
                </h2>
                <p className="text-sm text-slate-400 mb-8">Data payload has been processed by the Order Engine.</p>
                
                {/* Metric Cards */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-[#0B0E14] border border-slate-800 rounded-2xl p-5 flex flex-col">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Total Scanned</span>
                    <span className="text-3xl font-black text-white font-mono">{result.totalProcessed}</span>
                  </div>
                  <div className="bg-[#0B0E14] border border-emerald-500/30 rounded-2xl p-5 flex flex-col shadow-[0_0_15px_rgba(16,185,129,0.05)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/3"></div>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2 relative z-10">Successful AWBs</span>
                    <span className="text-3xl font-black text-emerald-400 font-mono relative z-10">{result.successful}</span>
                  </div>
                  <div className="bg-[#0B0E14] border border-red-500/30 rounded-2xl p-5 flex flex-col shadow-[0_0_15px_rgba(239,68,68,0.05)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/3"></div>
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-2 relative z-10">Failed Rows</span>
                    <span className="text-3xl font-black text-red-400 font-mono relative z-10">{result.failed}</span>
                  </div>
                </div>

                {/* Errors List */}
                {result.errors && result.errors.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <XCircle className="w-3.5 h-3.5 text-red-500" />
                      Validation Failures
                    </h3>
                    <div className="bg-[#0B0E14] border border-slate-800 rounded-xl p-4 max-h-[250px] overflow-y-auto custom-scrollbar">
                      <ul className="space-y-2">
                        {result.errors.map((err, index) => (
                          <li key={index} className="text-xs font-mono text-red-400/80 bg-red-500/5 p-2 rounded-lg border border-red-500/10">
                            {err}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                
                {result.errors.length === 0 && result.successful > 0 && (
                   <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                     <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                     <p className="text-sm font-bold text-emerald-400">100% Success Rate!</p>
                     <p className="text-xs text-emerald-500/70 mt-1">All records were perfectly parsed and ingested.</p>
                   </div>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
      
      {/* Custom Scrollbar Styles for the error list */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #334155;
          border-radius: 20px;
        }
      `}} />
    </div>
  );
}
