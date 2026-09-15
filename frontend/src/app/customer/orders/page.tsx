"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ListOrdered, Calendar, ChevronRight, Package, AlertTriangle, Loader2 } from 'lucide-react';
import apiClient from '@/lib/apiClient';

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await apiClient.get('/orders');
        const data = res.data.data || res.data;
        setOrders(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to load orders.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch(status?.toUpperCase()) {
      case "PENDING": 
      case "ORDER_PLACED": return "bg-purple-100 text-purple-700 border-purple-200";
      case "IN_TRANSIT": 
      case "OUT_FOR_DELIVERY": return "bg-amber-100 text-amber-700 border-amber-200";
      case "DELIVERED": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "CANCELLED": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        
        <header className="mb-8 mt-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2 flex items-center gap-3">
            <ListOrdered className="w-8 h-8 text-indigo-500" />
            My Orders
          </h1>
          <p className="text-slate-500 text-sm">
            View and track your entire order history.
          </p>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-bold">{error}</span>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          {orders.length === 0 && !error ? (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 text-lg font-medium">You haven't placed any orders yet.</p>
              <button 
                onClick={() => router.push('/customer/book')}
                className="mt-6 px-6 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-lg hover:bg-indigo-100 transition-colors"
              >
                Book a Parcel
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-100">
                    <th className="p-5 pl-8">Tracking ID</th>
                    <th className="p-5">Date</th>
                    <th className="p-5">Status</th>
                    <th className="p-5 pr-8 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr key={order._id || order.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-5 pl-8">
                        <span className="font-mono font-bold text-slate-800">
                          {(order._id || order.id || "").substring(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-5">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                          {(order.status || "UNKNOWN").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-5 pr-8 text-right">
                        <button 
                          onClick={() => router.push(`/customer/track?id=${order._id || order.id}`)}
                          className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Track Package"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
