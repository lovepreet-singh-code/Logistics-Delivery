"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Package, MapPin, Truck, CheckCircle2, Clock, 
  Download, Printer, AlertTriangle, RefreshCcw, Image as ImageIcon,
  User, Phone, Mail, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock Fetch
    setTimeout(() => {
      setOrder({
        _id: id,
        orderId: id,
        status: 'IN_TRANSIT',
        createdAt: '2026-07-28T10:00:00Z',
        pickupAddress: { fullAddress: '123 Tech Park, Bangalore', pinCode: '560001', name: 'Amit Sender', phone: '+91 9876543210' },
        deliveryAddress: { fullAddress: '456 Marine Drive, Mumbai', pinCode: '400020', name: 'Priya Receiver', phone: '+91 8765432109' },
        parcelDetails: { weight: 12, length: 30, width: 20, height: 15 },
        pricing: { total: 450 },
        timeline: [
          { status: 'PENDING', timestamp: '2026-07-28T10:00:00Z', description: 'Order created' },
          { status: 'ASSIGNED', timestamp: '2026-07-28T10:30:00Z', description: 'Assigned to Hub' },
          { status: 'HUB_RECEIVED', timestamp: '2026-07-28T14:15:00Z', description: 'Received at Bangalore Hub' },
          { status: 'TRANSIT', timestamp: '2026-07-28T16:00:00Z', description: 'In transit to Mumbai' },
        ],
        driver: { name: 'Rahul Kumar', vehicle: 'DL 1M 1234' }
      });
      setLoading(false);
    }, 1000);
  }, [id]);

  if (loading) {
    return <div className="p-8 flex items-center justify-center h-full text-slate-500">Loading Order {id}...</div>;
  }

  if (!order) {
    return <div className="p-8 text-center text-red-500">Order not found</div>;
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'ASSIGNED': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      case 'HUB_RECEIVED': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'TRANSIT': case 'IN_TRANSIT': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'OUT_FOR_DELIVERY': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'DELIVERED': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const steps = [
    { label: 'Created', value: 'PENDING' },
    { label: 'Assigned', value: 'ASSIGNED' },
    { label: 'Hub Received', value: 'HUB_RECEIVED' },
    { label: 'In Transit', value: 'TRANSIT' },
    { label: 'Out For Delivery', value: 'OUT_FOR_DELIVERY' },
    { label: 'Delivered', value: 'DELIVERED' }
  ];

  const currentStepIndex = steps.findIndex(s => s.value === (order.status === 'IN_TRANSIT' ? 'TRANSIT' : order.status));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button onClick={() => router.back()} className="text-slate-400 hover:text-white flex items-center gap-2 mb-4 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Orders
          </button>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-white font-mono">{order.orderId}</h1>
            <span className={`px-3 py-1 text-xs font-bold uppercase rounded-md border ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>
          <p className="text-slate-400 mt-1">Placed on {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700 font-medium">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-medium shadow-lg shadow-indigo-500/20">
            <Download className="w-4 h-4" /> Invoice
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Details) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Customer & Route Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-6 relative overflow-hidden">
             <div className="absolute top-0 left-1/2 w-px h-full bg-slate-800/50 hidden md:block"></div>
             
             {/* Sender */}
             <div>
               <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                 <Package className="w-4 h-4" /> Sender Details
               </h3>
               <div className="space-y-3">
                 <p className="text-lg font-bold text-slate-200">{order.pickupAddress.name}</p>
                 <div className="flex items-start gap-3 text-slate-400">
                   <Phone className="w-4 h-4 mt-0.5 shrink-0" />
                   <span className="text-sm">{order.pickupAddress.phone}</span>
                 </div>
                 <div className="flex items-start gap-3 text-slate-400">
                   <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                   <span className="text-sm">{order.pickupAddress.fullAddress} <br/> <span className="font-mono mt-1 block">PIN: {order.pickupAddress.pinCode}</span></span>
                 </div>
               </div>
             </div>

             {/* Receiver */}
             <div>
               <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                 <MapPin className="w-4 h-4 text-indigo-400" /> Receiver Details
               </h3>
               <div className="space-y-3">
                 <p className="text-lg font-bold text-slate-200">{order.deliveryAddress.name}</p>
                 <div className="flex items-start gap-3 text-slate-400">
                   <Phone className="w-4 h-4 mt-0.5 shrink-0" />
                   <span className="text-sm">{order.deliveryAddress.phone}</span>
                 </div>
                 <div className="flex items-start gap-3 text-slate-400">
                   <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                   <span className="text-sm">{order.deliveryAddress.fullAddress} <br/> <span className="font-mono mt-1 block">PIN: {order.deliveryAddress.pinCode}</span></span>
                 </div>
               </div>
             </div>
          </div>

          {/* Parcel & Driver Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Parcel Specifications</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800/50">
                  <span className="text-slate-400 text-sm">Weight</span>
                  <span className="text-slate-200 font-mono font-bold">{order.parcelDetails.weight} kg</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-800/50">
                  <span className="text-slate-400 text-sm">Dimensions (L x W x H)</span>
                  <span className="text-slate-200 font-mono font-bold">{order.parcelDetails.length}x{order.parcelDetails.width}x{order.parcelDetails.height} cm</span>
                </div>
                <div className="flex justify-between items-center pb-1">
                  <span className="text-slate-400 text-sm">Total Cost</span>
                  <span className="text-emerald-400 font-bold">₹{order.pricing.total}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Active Assignment</h3>
              {order.driver ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-slate-200 font-bold">{order.driver.name}</p>
                      <p className="text-slate-400 text-sm font-mono">{order.driver.vehicle}</p>
                    </div>
                  </div>
                  <button className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors text-sm font-medium">
                    <RefreshCcw className="w-4 h-4" /> Re-assign Driver
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4">
                  <p className="text-slate-500 text-sm mb-4">No driver assigned yet.</p>
                  <Link href="/admin/planning" className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-xl transition-colors text-sm font-bold border border-indigo-500/30">
                    Go to Planning
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          {/* Delivery Proof */}
          {order.status === 'DELIVERED' ? (
             <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Proof of Delivery
                </h3>
                <div className="flex gap-4 overflow-x-auto">
                   <div className="w-48 h-32 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
                     <ImageIcon className="w-8 h-8 text-slate-600" />
                   </div>
                   <div className="w-48 h-32 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
                     <span className="text-slate-500 font-mono text-xl">Sign</span>
                   </div>
                </div>
             </div>
          ) : null}

        </div>

        {/* Right Column (Timeline & Actions) */}
        <div className="space-y-6">
          
          {/* Timeline */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl h-[500px] overflow-y-auto relative">
             <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2 sticky top-0 bg-slate-900 z-10 py-2">
               <Clock className="w-4 h-4" /> Tracking Timeline
             </h3>
             <div className="relative border-l border-slate-800 ml-3 space-y-8 pb-4">
               {order.timeline.map((event: any, index: number) => {
                 const isCompleted = index <= currentStepIndex;
                 const isCurrent = index === currentStepIndex;
                 
                 return (
                   <div key={index} className="pl-6 relative">
                     {/* Indicator Node */}
                     <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border-2 ${
                       isCurrent ? 'bg-indigo-500 border-indigo-400 ring-4 ring-indigo-500/20' :
                       isCompleted ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-900 border-slate-700'
                     }`}></div>
                     
                     <div className={`${isCompleted ? 'text-slate-200' : 'text-slate-500'}`}>
                       <h4 className="font-bold text-sm uppercase tracking-wide">{event.status}</h4>
                       <p className="text-xs mt-1 text-slate-400">{event.description}</p>
                       <span className="text-[10px] font-mono mt-2 block text-slate-500">
                         {new Date(event.timestamp).toLocaleString()}
                       </span>
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6">
            <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Danger Zone
            </h3>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors font-bold border border-red-500/20">
              Emergency Cancel
            </button>
            <p className="text-xs text-slate-500 mt-3 text-center">This action will immediately halt the delivery process and mark the order as cancelled.</p>
          </div>

        </div>

      </div>
    </div>
  );
}
