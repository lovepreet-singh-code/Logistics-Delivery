"use client";

import React, { useState } from 'react';
import { FileText, Download, FileJson, FileSpreadsheet, Activity, ChevronDown } from 'lucide-react';

export default function ReportsPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'pdf' | 'csv' | 'json') => {
    setIsExporting(true);
    try {
      // In a real app, this calls /api/analytics/reports/export?format=${format}
      // For this demo, we mock the delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const fileUrl = `/api/analytics/reports/export?format=${format}`;
      // Simulate download
      const link = document.createElement('a');
      link.href = fileUrl;
      link.setAttribute('download', `logistics_report.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error("Export failed", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-rose-500" />
            Reports Engine
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Generate, export, and download comprehensive logistics data.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        
        {/* Export Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl"></div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Master Orders Report</h2>
          <p className="text-slate-400 mb-8 max-w-sm">Export the complete ledger of all orders, statuses, and revenue generated across all hubs.</p>
          
          <div className="space-y-4 relative z-10">
            <button 
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              className="w-full flex items-center justify-between p-4 bg-slate-950 border border-slate-800 hover:border-rose-500/50 rounded-2xl transition-all group/btn"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-200">Export as PDF</p>
                  <p className="text-xs text-slate-500">Print-ready document</p>
                </div>
              </div>
              <Download className="w-5 h-5 text-slate-600 group-hover/btn:text-rose-400 transition-colors" />
            </button>

            <button 
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="w-full flex items-center justify-between p-4 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-2xl transition-all group/btn"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-200">Export as CSV</p>
                  <p className="text-xs text-slate-500">For Excel & Spreadsheets</p>
                </div>
              </div>
              <Download className="w-5 h-5 text-slate-600 group-hover/btn:text-emerald-400 transition-colors" />
            </button>

            <button 
              onClick={() => handleExport('json')}
              disabled={isExporting}
              className="w-full flex items-center justify-between p-4 bg-slate-950 border border-slate-800 hover:border-blue-500/50 rounded-2xl transition-all group/btn"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <FileJson className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-200">Export as JSON</p>
                  <p className="text-xs text-slate-500">Raw API Data</p>
                </div>
              </div>
              <Download className="w-5 h-5 text-slate-600 group-hover/btn:text-blue-400 transition-colors" />
            </button>
          </div>
        </div>

        {/* Info Panel */}
        <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/20 rounded-3xl p-8 shadow-xl flex flex-col justify-center relative overflow-hidden">
           <Activity className="absolute -right-8 -bottom-8 w-64 h-64 text-indigo-500/10" />
           <div className="relative z-10 space-y-6">
             <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
               <Activity className="w-6 h-6 text-indigo-400" />
             </div>
             <h3 className="text-2xl font-bold text-white">Live Generation</h3>
             <p className="text-slate-300 text-lg leading-relaxed">
               All reports are generated <span className="font-bold text-indigo-400">on-the-fly</span> directly from the live MongoDB data streams via our custom Analytics Engine. No stale data, no caching delays.
             </p>
             <p className="text-slate-400">
               Export formats are optimized server-side using <code>jspdf</code> and <code>json2csv</code>.
             </p>
           </div>
        </div>

      </div>
    </div>
  );
}
