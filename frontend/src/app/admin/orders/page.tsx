"use client";

import React, { useState, useEffect } from 'react';
import { Package, Search, RefreshCw, Loader2, Navigation, AlertTriangle, Filter, Calendar, MapPin, Phone, User, Building, Truck, Car } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import axios from 'axios';
import { format } from 'date-fns';

interface AddressDetails {
  pinCode: string;
  fullAddress: string;
  senderName?: string;
  senderPhone?: string;
  receiverName?: string;
  receiverPhone?: string;
}

interface ParcelDetails {
  weightKg?: number;
  category?: string;
  declaredValue?: number;
  dimensions?: {
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
  };
  volumetricWeight?: number;
  chargeableWeight?: number;
}

interface Order {
  _id: string;
  trackingId?: string;
  awb?: string;
  customerId: string;
  pickupAddress: AddressDetails;
  deliveryAddress: AddressDetails;
  parcelDetails?: ParcelDetails;
  weight?: number;
  volumetricWeight?: number;
  chargeableWeight?: number;
  status: string;
  createdAt: string;
  paymentMethod?: string;
  paymentStatus?: string;
  totalAmount?: number;
  price?: number;
  driver?: string;
  vehicle?: string;
  routing?: {
    agentId?: string;
    vehicleId?: string;
    vehicleNumber?: string;
  };
}

export default function MasterOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      let res;
      try {
        res = await apiClient.get(`/orders?${params.toString()}`);
      } catch (gwErr) {
        // Fallback to direct Order Service port 4004
        const directUrl = (process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:4004') + `/api/orders?${params.toString()}`;
        res = await axios.get(directUrl);
      }
      
      const realOrdersData = res.data.data?.map((o: any) => ({
        ...o,
        driver: o.driver || (o.routing?.agentId ? 'Assigned Agent' : 'Unassigned'),
        vehicle: o.vehicle || o.routing?.vehicleNumber || (o.routing?.vehicleId ? 'Assigned Vehicle' : 'Unassigned'),
      })) || [];
      
      setOrders(realOrdersData);
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, startDate, endDate]);

  const filteredOrders = orders.filter(order => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const trackId = order.trackingId || order.awb || order._id || '';
    const sender = order.pickupAddress?.senderName || '';
    const receiver = order.deliveryAddress?.receiverName || '';
    const senderPhone = order.pickupAddress?.senderPhone || '';
    const receiverPhone = order.deliveryAddress?.receiverPhone || '';
    const pickupPin = order.pickupAddress?.pinCode || '';
    const dropPin = order.deliveryAddress?.pinCode || '';
    return (
      trackId.toLowerCase().includes(q) ||
      sender.toLowerCase().includes(q) ||
      receiver.toLowerCase().includes(q) ||
      senderPhone.includes(q) ||
      receiverPhone.includes(q) ||
      pickupPin.includes(q) ||
      dropPin.includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-[10px] font-bold tracking-wider uppercase">Delivered</span>;
      case 'IN_TRANSIT':
      case 'OUT_FOR_DELIVERY':
      case 'DESTINATION_HUB':
      case 'PICKED_UP':
      case 'AT_HUB':
        return <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-[10px] font-bold tracking-wider uppercase">{status.replace(/_/g, ' ')}</span>;
      case 'ORDER_PLACED':
      case 'PENDING':
        return <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-[10px] font-bold tracking-wider uppercase">{status.replace(/_/g, ' ')}</span>;
      default:
        return <span className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-[10px] font-bold tracking-wider uppercase">{status.replace(/_/g, ' ')}</span>;
    }
  };

  return (
    <div className="p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1600px] mx-auto">
      <header className="mb-8 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Package className="w-8 h-8 text-indigo-500" />
            Master Orders
          </h1>
          <p className="text-slate-400 mt-2">Comprehensive view of all logistics orders.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Filters */}
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl shadow-inner">
            <div className="flex items-center gap-2 px-3">
              <Filter className="w-4 h-4 text-indigo-400" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-sm text-slate-300 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="ORDER_PLACED">Order Placed</option>
                <option value="PICKED_UP">Picked Up</option>
                <option value="AT_HUB">At Hub</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERED">Delivered</option>
              </select>
            </div>
            <div className="w-px h-6 bg-slate-800"></div>
            <div className="flex items-center gap-2 px-3">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm text-slate-300 focus:outline-none"
              />
              <span className="text-slate-500">-</span>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-sm text-slate-300 focus:outline-none"
              />
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by Tracking ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all w-64 shadow-inner text-sm"
            />
          </div>

          <button 
            onClick={fetchOrders}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20 active:scale-95"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto min-h-[500px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="p-5 pl-6">Order Details</th>
                <th className="p-5">Sender</th>
                <th className="p-5">Receiver</th>
                <th className="p-5">Route & Fleet</th>
                <th className="p-5">Status & Finance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-24 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Loading Master Orders...</p>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-24 text-center">
                    <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-50" />
                    <p className="text-slate-400 text-lg font-medium">No orders found.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-5 pl-6 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-sm font-bold text-white tracking-wide">
                          {order.trackingId || order.awb || order._id.slice(-8).toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {order.createdAt ? format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                        </span>
                        {/* Real Parcel Details: Weight, Category, Volumetric Wt */}
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-indigo-300 font-semibold">
                            {order.parcelDetails?.weightKg ?? order.weight ?? 0} kg
                          </span>
                          {order.parcelDetails?.category && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-400">
                              {order.parcelDetails.category}
                            </span>
                          )}
                          {(order.volumetricWeight || order.parcelDetails?.volumetricWeight) ? (
                            <span className="text-[10px] text-slate-500">
                              (Vol: {order.volumetricWeight ?? order.parcelDetails?.volumetricWeight} kg)
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="p-5 align-top">
                      <div className="flex flex-col gap-1 max-w-[200px]">
                        <div className="flex items-center gap-2 text-sm text-slate-200">
                          <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{order.pickupAddress.senderName || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{order.pickupAddress.senderPhone || 'N/A'}</span>
                        </div>
                        <div className="flex items-start gap-2 text-xs text-slate-500 mt-1">
                          <MapPin className="w-3 h-3 text-slate-600 shrink-0 mt-0.5" />
                          <span className="truncate whitespace-normal line-clamp-2">{order.pickupAddress.fullAddress}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 align-top">
                      <div className="flex flex-col gap-1 max-w-[200px]">
                        <div className="flex items-center gap-2 text-sm text-slate-200">
                          <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{order.deliveryAddress.receiverName || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{order.deliveryAddress.receiverPhone || 'N/A'}</span>
                        </div>
                        <div className="flex items-start gap-2 text-xs text-slate-500 mt-1">
                          <MapPin className="w-3 h-3 text-slate-600 shrink-0 mt-0.5" />
                          <span className="truncate whitespace-normal line-clamp-2">{order.deliveryAddress.fullAddress}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 align-top">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2 py-0.5 bg-slate-950 rounded border border-slate-800 text-slate-400 font-mono">
                            {order.pickupAddress.pinCode}
                          </span>
                          <Navigation className="w-3 h-3 text-indigo-500 rotate-90 shrink-0" />
                          <span className="px-2 py-0.5 bg-slate-950 rounded border border-slate-800 text-slate-400 font-mono">
                            {order.deliveryAddress.pinCode}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs">
                            <User className="w-3 h-3 text-slate-500" />
                            <span className={order.driver === 'Unassigned' ? 'text-amber-500' : 'text-slate-300'}>{order.driver}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Car className="w-3 h-3 text-slate-500" />
                            <span className={order.vehicle === 'Unassigned' ? 'text-amber-500' : 'text-slate-400'}>{order.vehicle}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 align-top">
                      <div className="flex flex-col gap-2 items-start">
                        {getStatusBadge(order.status)}
                        {order.paymentMethod && (
                          <div className="text-xs font-medium text-slate-400 mt-1 flex gap-1">
                            Payment: <span className={order.paymentMethod === 'COD' ? 'text-amber-400 font-semibold' : 'text-indigo-400 font-semibold'}>{order.paymentMethod}</span>
                          </div>
                        )}
                        {order.paymentStatus && (
                          <div className="text-[10px] font-semibold tracking-wider uppercase text-slate-500">
                            Status: <span className={order.paymentStatus === 'PAID' ? 'text-emerald-400' : 'text-amber-400'}>{order.paymentStatus.replace(/_/g, ' ')}</span>
                          </div>
                        )}
                        {(order.totalAmount !== undefined || order.price !== undefined) && (
                          <div className="text-sm font-bold text-slate-200">
                            ₹{order.totalAmount ?? order.price ?? 0}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
