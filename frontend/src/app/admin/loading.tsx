import React from 'react';

export default function Loading() {
  return (
    <div className="p-6 md:p-10 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Skeleton */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="h-10 w-64 bg-slate-800 rounded-lg mb-4"></div>
            <div className="h-5 w-48 bg-slate-800/50 rounded-md"></div>
          </div>
        </header>

        {/* Metrics Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-3xl bg-slate-900 border border-slate-800 p-6 h-36 shadow-xl flex justify-between items-start">
              <div>
                <div className="h-4 w-24 bg-slate-800 rounded mb-4"></div>
                <div className="h-10 w-16 bg-slate-700 rounded-lg"></div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-800"></div>
            </div>
          ))}
        </div>

        {/* Chart Section Skeleton */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 h-[450px] shadow-xl">
           <div className="h-6 w-48 bg-slate-800 rounded mb-6"></div>
           <div className="w-full h-80 bg-slate-800/50 rounded-xl"></div>
        </div>

      </div>
    </div>
  );
}
