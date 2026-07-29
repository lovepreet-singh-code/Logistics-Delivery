"use client";

import { useState } from "react";
import { MapPin, Plus, Home, Briefcase, Building, Edit2, Trash2 } from "lucide-react";

export default function AddressesPage() {
  const [addresses, setAddresses] = useState([
    {
      id: 1,
      type: "Home",
      name: "John Doe",
      phone: "+91 98765 43210",
      address: "123 Palm Avenue, Apartment 4B",
      city: "Mumbai, Maharashtra",
      pinCode: "400050",
      icon: Home,
      color: "text-indigo-500",
      bg: "bg-indigo-100",
      border: "border-indigo-200"
    },
    {
      id: 2,
      type: "Office",
      name: "John Doe (Logistics Inc)",
      phone: "+91 87654 32109",
      address: "Tech Park, Building C, Floor 9",
      city: "Bangalore, Karnataka",
      pinCode: "560100",
      icon: Briefcase,
      color: "text-amber-500",
      bg: "bg-amber-100",
      border: "border-amber-200"
    },
    {
      id: 3,
      type: "Warehouse",
      name: "Delhivery Hub",
      phone: "+91 99999 88888",
      address: "Plot No. 45, Industrial Estate Phase 2",
      city: "Pune, Maharashtra",
      pinCode: "411057",
      icon: Building,
      color: "text-emerald-500",
      bg: "bg-emerald-100",
      border: "border-emerald-200"
    }
  ]);

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Saved Addresses</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">Manage your pickup and delivery locations for faster booking.</p>
        </div>
        
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm active:scale-95">
          <Plus className="w-5 h-5" /> Add Address
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Add New Card */}
        <button className="border-2 border-dashed border-slate-300 rounded-3xl p-8 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors h-full min-h-[250px] group">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4 group-hover:bg-indigo-100 group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6" />
          </div>
          <p className="font-bold">Add New Location</p>
          <p className="text-sm mt-1">Save a new address to your book</p>
        </button>

        {/* Saved Addresses */}
        {addresses.map((addr) => (
          <div key={addr.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full -z-10 opacity-30 ${addr.bg}`} />
            
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${addr.border} ${addr.bg}`}>
                  <addr.icon className={`w-6 h-6 ${addr.color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{addr.type}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{addr.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="space-y-3 mt-6">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-600 leading-relaxed">
                  {addr.address}<br />
                  {addr.city}<br />
                  <span className="font-bold text-slate-900">{addr.pinCode}</span>
                </p>
              </div>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
