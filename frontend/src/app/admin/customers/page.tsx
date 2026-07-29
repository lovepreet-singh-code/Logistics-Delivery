"use client";

import React from 'react';
import { Users } from 'lucide-react';

export default function CustomersPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-400" />
            Customers
          </h1>
          <p className="text-slate-400 mt-1">View and manage customer accounts.</p>
        </div>
      </div>
      
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center shadow-xl">
         <Users className="w-16 h-16 text-slate-700 mx-auto mb-4" />
         <h2 className="text-xl font-bold text-slate-300">Customers Module</h2>
         <p className="text-slate-500 mt-2 max-w-md mx-auto">This module is part of the Enterprise Logistics System. Data integration is pending in the next sprint.</p>
      </div>
    </div>
  );
}
