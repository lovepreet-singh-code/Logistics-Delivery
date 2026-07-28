"use client";

import React, { useState, useEffect } from 'react';
import { Package, Search, RefreshCw, Loader2, Navigation, AlertTriangle, MapPin } from 'lucide-react';
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
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const adminToken = localStorage.getItem('adminToken') || '';
      
      const res = await axios.get('http://localhost:8080/api/orders', {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      setOrders(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => 
    order._id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold tracking-wider uppercase">Delivered</span>;
      case 'IN_TRANSIT':
      case 'OUT_FOR_DELIVERY':
        return <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold tracking-wider uppercase">{status.replace(/_/g, ' ')}</span>;
      case 'PENDING':
        return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold tracking-wider uppercase">Pending</span>;
      default:
        return <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-xs font-bold tracking-wider uppercase">{status.replace(/_/g, ' ')}</span>;
    }
  };

  return (
    <div className="p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Package className="w-8 h-8 text-indigo-400" />
            Order Management
          </h1>
          <p className="text-slate-400 mt-2">Track, search, and monitor all platform deliveries.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by Order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all w-64 shadow-inner"
            />
          </div>

          <button 
            onClick={fetchOrders}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center border border-slate-700 shadow-md active:scale-95"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-sm font-medium uppercase tracking-wider">
                <th className="p-5">Order ID</th>
                <th className="p-5">Customer ID</th>
                <th className="p-5">Route (Pincodes)</th>
                <th className="p-5">Status</th>
                <th className="p-5">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-24 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-4" />
                    <p className="text-slate-500">Loading master order ledger...</p>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-24 text-center">
                    <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-50" />
                    <p className="text-slate-400 text-lg">No orders found.</p>
                    {searchQuery && <p className="text-slate-500 text-sm mt-1">Try adjusting your search criteria.</p>}
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order._id} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                           <Package className="w-4 h-4 text-indigo-400" />
                        </div>
                        <span className="font-mono text-sm font-semibold text-white tracking-wide">
                          ...{order._id.slice(-6)}
                        </span>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="font-mono text-sm text-slate-400">
                        {order.customerId}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-2.5 py-1 bg-slate-950 rounded-md border border-slate-800 text-slate-300 font-mono flex items-center gap-1.5 shadow-inner">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {order.pickupAddress.pinCode}
                        </span>
                        <Navigation className="w-3 h-3 text-slate-600 rotate-90" />
                        <span className="px-2.5 py-1 bg-slate-950 rounded-md border border-slate-800 text-slate-300 font-mono flex items-center gap-1.5 shadow-inner">
                           <MapPin className="w-3 h-3 text-slate-500" />
                          {order.deliveryAddress.pinCode}
                        </span>
                      </div>
                    </td>
                    <td className="p-5">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="p-5 text-sm text-slate-400 font-medium">
                      {new Date(order.createdAt).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
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
