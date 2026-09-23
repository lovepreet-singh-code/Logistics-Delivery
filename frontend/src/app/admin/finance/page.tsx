"use client";

import React, { useState, useEffect } from 'react';
import { IndianRupee, RefreshCw, Loader2, User, AlertTriangle, CheckCircle } from 'lucide-react';
import apiClient from '@/lib/apiClient';

interface Order {
  _id: string;
  trackingId?: string;
  awb?: string;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  totalAmount?: number;
  routing?: {
    agentId?: string;
  };
  driver?: string; // from frontend mock or backend population
}

interface AgentSettlement {
  agentId: string;
  agentName: string;
  totalOrders: number;
  expectedCod: number;
}

export default function FinancePage() {
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState<string | null>(null);
  const [settlements, setSettlements] = useState<AgentSettlement[]>([]);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      // Fetch DELIVERED orders for today
      // For demonstration, we just fetch all delivered and filter locally
      const today = new Date().toISOString().split('T')[0];
      const res = await apiClient.get(`/orders?status=DELIVERED&startDate=${today}&endDate=${today}`);
      
      const orders: Order[] = res.data.data || [];
      
      // Filter COD orders that are pending payment
      const codOrders = orders.filter(
        o => o.paymentMethod === 'COD' && o.paymentStatus !== 'PAID'
      );

      // Group by agent
      const grouped = codOrders.reduce((acc, order) => {
        const agentId = order.routing?.agentId || 'unknown_agent_id';
        // Mock agent name if not available
        const agentName = order.driver || (agentId === 'unknown_agent_id' ? 'Unassigned' : 'Rahul Kumar');
        
        if (!acc[agentId]) {
          acc[agentId] = { agentId, agentName, totalOrders: 0, expectedCod: 0 };
        }
        
        acc[agentId].totalOrders += 1;
        acc[agentId].expectedCod += (order.totalAmount || 0);
        
        return acc;
      }, {} as Record<string, AgentSettlement>);

      setSettlements(Object.values(grouped));
    } catch (error) {
      console.error("Failed to fetch settlements", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, []);

  const handleSettleCash = async (agentId: string) => {
    try {
      setSettling(agentId);
      await apiClient.post('/orders/settle-agent-cod', { agentId });
      // Remove from list after settlement
      setSettlements(prev => prev.filter(s => s.agentId !== agentId));
      alert('COD Cash Settled Successfully!');
    } catch (error) {
      console.error("Failed to settle cash", error);
      alert('Failed to settle COD cash. Please try again.');
    } finally {
      setSettling(null);
    }
  };

  return (
    <div className="p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1200px] mx-auto">
      <header className="mb-8 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <IndianRupee className="w-8 h-8 text-emerald-500" />
            Finance & COD Settlement
          </h1>
          <p className="text-slate-400 mt-2">Manage daily cash collections from delivery agents.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={fetchSettlements}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20 active:scale-95"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="p-5 pl-6">Agent Name</th>
                <th className="p-5">Pending COD Orders</th>
                <th className="p-5">Expected Cash (₹)</th>
                <th className="p-5 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-24 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Loading Settlements...</p>
                  </td>
                </tr>
              ) : settlements.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-24 text-center">
                    <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-4 opacity-50" />
                    <p className="text-slate-400 text-lg font-medium">All COD cash settled for today.</p>
                  </td>
                </tr>
              ) : (
                settlements.map((settlement) => (
                  <tr key={settlement.agentId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-5 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                           <User className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <span className="font-bold text-white tracking-wide">
                            {settlement.agentName}
                          </span>
                          <p className="text-xs text-slate-500 mt-0.5">
                            ID: {settlement.agentId.slice(-8).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg text-sm font-bold">
                        {settlement.totalOrders} Orders
                      </span>
                    </td>
                    <td className="p-5">
                      <span className="text-lg font-bold text-emerald-400">
                        ₹{settlement.expectedCod}
                      </span>
                    </td>
                    <td className="p-5 pr-6 text-right">
                      <button 
                        onClick={() => handleSettleCash(settlement.agentId)}
                        disabled={settling === settlement.agentId}
                        className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white px-6 py-2 rounded-xl text-sm font-bold tracking-wide transition-all disabled:opacity-50 flex items-center gap-2 ml-auto"
                      >
                        {settling === settlement.agentId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <IndianRupee className="w-4 h-4" />
                        )}
                        Settle Cash
                      </button>
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
