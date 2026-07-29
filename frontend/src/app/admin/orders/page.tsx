"use client";

import React, { useState, useEffect } from 'react';
import { Package, Search, RefreshCw, Loader2, Navigation, AlertTriangle, MapPin, Filter, Calendar, Building, MoreVertical, Eye, Truck, Printer, Car, User } from 'lucide-react';
import axios from 'axios';

interface Order {
  _id: string;
  customerId: string;
  pickupAddress: {
    pinCode: string;
    fullAddress: string;
  };
  deliveryAddress: {
    pinCode: string;
    fullAddress: string;
  };
  status: string;
  createdAt: string;
  driver?: string;
  vehicle?: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const adminToken = localStorage.getItem('adminToken') || '';
      
      const res = await axios.get('http://localhost:8080/api/orders', {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      // Mocking some extra fields for the UI
      const mockEnhancedData = res.data.data?.map((o: any) => ({
        ...o,
        driver: o.status !== 'PENDING' ? 'Rahul Kumar' : 'Unassigned',
        vehicle: o.status !== 'PENDING' ? 'V-101 (Tata Ace)' : 'Unassigned',
      })) || [];
      setOrders(mockEnhancedData);
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleDropdown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  const filteredOrders = orders.filter(order => 
    order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-[10px] font-bold tracking-wider uppercase">Delivered</span>;
      case 'IN_TRANSIT':
      case 'OUT_FOR_DELIVERY':
        return <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-[10px] font-bold tracking-wider uppercase">{status.replace(/_/g, ' ')}</span>;
      case 'PENDING':
        return <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-[10px] font-bold tracking-wider uppercase">Pending</span>;
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
            Dispatch Engine
          </h1>
          <p className="text-slate-400 mt-2">Centralized command for order assignment and tracking.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Filters */}
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl shadow-inner">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
              <Filter className="w-4 h-4 text-indigo-400" /> Status
            </button>
            <div className="w-px h-6 bg-slate-800"></div>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
              <Calendar className="w-4 h-4 text-indigo-400" /> Today
            </button>
            <div className="w-px h-6 bg-slate-800"></div>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
              <Building className="w-4 h-4 text-indigo-400" /> All Hubs
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search Tracking or Customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all w-64 md:w-80 shadow-inner text-sm"
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
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="p-5 pl-6">Tracking ID</th>
                <th className="p-5">Customer</th>
                <th className="p-5">Route (Pickup → Delivery)</th>
                <th className="p-5">Fleet Assignment</th>
                <th className="p-5">Status</th>
                <th className="p-5 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-24 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Loading Dispatch Engine...</p>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-24 text-center">
                    <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-50" />
                    <p className="text-slate-400 text-lg font-medium">No orders found.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order._id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="p-5 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 transition-all">
                           <Package className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                        </div>
                        <div>
                          <span className="font-mono text-sm font-bold text-white tracking-wide">
                            {order._id.slice(-8).toUpperCase()}
                          </span>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-600" />
                        <span className="text-sm font-medium text-slate-300">
                          {order.customerId.slice(0, 12)}...
                        </span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2 text-sm max-w-[250px]">
                        <span className="px-2.5 py-1 bg-slate-950 rounded-lg border border-slate-800 text-slate-300 font-mono shadow-inner text-xs truncate">
                          {order.pickupAddress.fullAddress.substring(0, 15)}...
                        </span>
                        <Navigation className="w-3 h-3 text-indigo-500 rotate-90 shrink-0" />
                        <span className="px-2.5 py-1 bg-slate-950 rounded-lg border border-slate-800 text-slate-300 font-mono shadow-inner text-xs truncate">
                          {order.deliveryAddress.fullAddress.substring(0, 15)}...
                        </span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs">
                          <User className="w-3 h-3 text-slate-500" />
                          <span className={order.driver === 'Unassigned' ? 'text-amber-500 font-medium' : 'text-slate-300 font-medium'}>{order.driver}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Car className="w-3 h-3 text-slate-500" />
                          <span className={order.vehicle === 'Unassigned' ? 'text-amber-500 font-medium' : 'text-slate-400 font-mono'}>{order.vehicle}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="p-5 pr-6 text-right relative">
                      <button 
                        onClick={(e) => toggleDropdown(e, order._id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      
                      {activeDropdown === order._id && (
                        <div className="absolute right-12 top-10 w-48 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                          <div className="p-1">
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white rounded-xl transition-colors">
                              <Eye className="w-4 h-4 text-slate-400" /> View Details
                            </button>
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white rounded-xl transition-colors">
                              <User className="w-4 h-4 text-emerald-400" /> Assign Driver
                            </button>
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white rounded-xl transition-colors">
                              <Truck className="w-4 h-4 text-blue-400" /> Assign Vehicle
                            </button>
                            <div className="h-px bg-slate-700 my-1 mx-2"></div>
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white rounded-xl transition-colors">
                              <Printer className="w-4 h-4 text-slate-400" /> Print Label
                            </button>
                          </div>
                        </div>
                      )}
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
