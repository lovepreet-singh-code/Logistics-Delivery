"use client";

import React, { useState, useEffect } from 'react';
import { Package, Search, RefreshCw, Loader2, Navigation, AlertTriangle, Filter, Calendar, MapPin, Phone, User, Building, Truck, Car, UserPlus, X, Check, Scale } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import axios from 'axios';
import { format } from 'date-fns';

interface Agent {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  vehicleNumber?: string;
  status?: string;
  availabilityStatus?: string;
}

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
  isWeightVerified?: boolean;
  verifiedWeight?: number;
  verifiedDimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  priceAdjustment?: number;
}

export default function MasterOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Agent Assignment State (Phase 3 Feature 2)
  const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);
  const [assignError, setAssignError] = useState<string>('');

  // Weight Verification State (Phase 3 Feature 3)
  const [verifyingOrder, setVerifyingOrder] = useState<Order | null>(null);
  const [actualWeightInput, setActualWeightInput] = useState<string>('');
  const [lengthInput, setLengthInput] = useState<string>('');
  const [widthInput, setWidthInput] = useState<string>('');
  const [heightInput, setHeightInput] = useState<string>('');
  const [isSubmittingWeight, setIsSubmittingWeight] = useState(false);
  const [verifyWeightError, setVerifyWeightError] = useState<string>('');

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
        driver: (o.driver && o.driver !== 'Unassigned') ? o.driver : (o.routing?.agentId ? 'Assigned Agent' : 'Unassigned'),
        vehicle: (o.vehicle && o.vehicle !== 'Unassigned') ? o.vehicle : (o.routing?.vehicleNumber || (o.routing?.vehicleId ? 'Assigned Vehicle' : 'Unassigned')),
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

  const openAssignModal = async (order: Order) => {
    setAssigningOrder(order);
    setSelectedAgentId('');
    setAssignError('');
    setLoadingAgents(true);
    try {
      let res;
      try {
        res = await apiClient.get('/users?role=agent&status=AVAILABLE');
      } catch (err) {
        try {
          res = await apiClient.get('/orders/available-agents');
        } catch (err2) {
          const directUrl = (process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:4004') + '/api/orders/available-agents';
          res = await axios.get(directUrl);
        }
      }
      const agentsList: Agent[] = res.data?.data || res.data || [];
      setAvailableAgents(agentsList);
      if (agentsList.length > 0) {
        setSelectedAgentId(agentsList[0]._id);
      }
    } catch (err) {
      console.error("Failed to fetch available agents", err);
      setAssignError("Could not load available agents. Please try again.");
    } finally {
      setLoadingAgents(false);
    }
  };

  const handleAssignAgent = async () => {
    if (!assigningOrder || !selectedAgentId) return;
    setIsSubmittingAssign(true);
    setAssignError('');
    try {
      const orderId = assigningOrder._id;
      let res;
      try {
        res = await apiClient.put(`/orders/${orderId}/assign-agent`, { agentId: selectedAgentId });
      } catch (gwErr) {
        const directUrl = (process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:4004') + `/api/orders/${orderId}/assign-agent`;
        res = await axios.put(directUrl, { agentId: selectedAgentId });
      }

      if (res.data?.success) {
        await fetchOrders();
        setAssigningOrder(null);
      } else {
        setAssignError(res.data?.message || "Failed to assign agent");
      }
    } catch (err: any) {
      console.error("Assignment failed:", err);
      setAssignError(err.response?.data?.message || err.message || "Failed to assign agent.");
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  const openVerifyWeightModal = (order: Order) => {
    setVerifyingOrder(order);
    setVerifyWeightError('');
    const dims = order.parcelDetails?.dimensions;
    setActualWeightInput(String(order.verifiedWeight || order.parcelDetails?.weightKg || order.weight || ''));
    setLengthInput(String(order.verifiedDimensions?.length || dims?.lengthCm || ''));
    setWidthInput(String(order.verifiedDimensions?.width || dims?.widthCm || ''));
    setHeightInput(String(order.verifiedDimensions?.height || dims?.heightCm || ''));
  };

  const handleVerifyWeightSubmit = async () => {
    if (!verifyingOrder) return;
    const parsedWeight = parseFloat(actualWeightInput);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      setVerifyWeightError("Please enter a valid physical weight greater than 0 kg.");
      return;
    }

    setIsSubmittingWeight(true);
    setVerifyWeightError('');
    try {
      const orderId = verifyingOrder._id;
      const payload = {
        actualWeight: parsedWeight,
        length: parseFloat(lengthInput) || 0,
        width: parseFloat(widthInput) || 0,
        height: parseFloat(heightInput) || 0,
      };

      let res;
      try {
        res = await apiClient.put(`/orders/${orderId}/verify-weight`, payload);
      } catch (gwErr) {
        const directUrl = (process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:4004') + `/api/orders/${orderId}/verify-weight`;
        res = await axios.put(directUrl, payload);
      }

      if (res.data?.success) {
        await fetchOrders();
        setVerifyingOrder(null);
      } else {
        setVerifyWeightError(res.data?.message || "Failed to verify weight.");
      }
    } catch (err: any) {
      console.error("Weight verification failed:", err);
      setVerifyWeightError(err.response?.data?.message || err.message || "Failed to verify weight.");
    } finally {
      setIsSubmittingWeight(false);
    }
  };

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
                            {order.verifiedWeight ?? order.parcelDetails?.weightKg ?? order.weight ?? 0} kg
                          </span>
                          {order.isWeightVerified && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1 text-[10px]">
                              <Check className="w-3 h-3" />
                              Verified
                            </span>
                          )}
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
                        {/* Verify Weight Action Button */}
                        {!order.isWeightVerified && order.status !== 'DELIVERED' && (
                          <div className="mt-1.5">
                            <button
                              onClick={() => openVerifyWeightModal(order)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 hover:text-amber-300 rounded-lg text-xs font-semibold transition-all active:scale-95 shadow-sm"
                            >
                              <Scale className="w-3.5 h-3.5" />
                              Verify Weight
                            </button>
                          </div>
                        )}
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
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 text-xs">
                            <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            {order.routing?.agentId || (order.driver && order.driver !== 'Unassigned') ? (
                              <span className="text-slate-200 font-semibold">{order.driver && order.driver !== 'Unassigned' ? order.driver : 'Assigned Agent'}</span>
                            ) : ['ORDER_PLACED', 'PENDING', 'PENDING_PICKUP', 'BOOKED'].includes(order.status?.toUpperCase()) ? (
                              <button
                                onClick={() => openAssignModal(order)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 hover:text-indigo-300 rounded-lg text-xs font-semibold transition-all active:scale-95 shadow-sm"
                              >
                                <UserPlus className="w-3 h-3" />
                                Assign Agent
                              </button>
                            ) : (
                              <span className="text-amber-500">Unassigned</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Car className="w-3.5 h-3.5 text-slate-500 shrink-0" />
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
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-sm font-bold text-slate-200">
                              ₹{order.totalAmount ?? order.price ?? 0}
                            </span>
                            {order.isWeightVerified && (order.priceAdjustment ?? 0) > 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-400">
                                +₹{order.priceAdjustment} Due
                              </span>
                            )}
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

      {/* Assign Agent Modal (Phase 3 Feature 2) */}
      {assigningOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-w-md w-full relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Assign Delivery Agent</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Order: {assigningOrder.trackingId || assigningOrder.awb || assigningOrder._id.slice(-8).toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssigningOrder(null)}
                disabled={isSubmittingAssign}
                className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {assignError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{assignError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Select Available Agent
                </label>
                {loadingAgents ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    <span>Fetching available agents...</span>
                  </div>
                ) : availableAgents.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <p className="text-xs text-slate-400">No available agents found in pool.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {availableAgents.map((agent) => (
                      <label
                        key={agent._id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedAgentId === agent._id
                            ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-inner'
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="selectedAgent"
                            value={agent._id}
                            checked={selectedAgentId === agent._id}
                            onChange={(e) => setSelectedAgentId(e.target.value)}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <div className="text-sm font-semibold">{agent.name}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                              {agent.phone && <span>{agent.phone}</span>}
                              {agent.vehicleNumber && (
                                <span className="font-mono text-[11px] text-slate-400">
                                  • {agent.vehicleNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {agent.status || 'AVAILABLE'}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setAssigningOrder(null)}
                disabled={isSubmittingAssign}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignAgent}
                disabled={isSubmittingAssign || !selectedAgentId || loadingAgents}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 active:scale-95"
              >
                {isSubmittingAssign ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Confirm Assignment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verify Weight & Adjust Price Modal (Phase 3 Feature 3) */}
      {verifyingOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-w-md w-full relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Weight Verification</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Order: {verifyingOrder.trackingId || verifyingOrder.awb || verifyingOrder._id.slice(-8).toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVerifyingOrder(null)}
                disabled={isSubmittingWeight}
                className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {verifyWeightError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{verifyWeightError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Actual Physical Weight (kg) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 2.5"
                  value={actualWeightInput}
                  onChange={(e) => setActualWeightInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white focus:outline-none focus:border-amber-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Dimensions (L × W × H in cm)
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Length</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="L (cm)"
                      value={lengthInput}
                      onChange={(e) => setLengthInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Width</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="W (cm)"
                      value={widthInput}
                      onChange={(e) => setWidthInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Height</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="H (cm)"
                      value={heightInput}
                      onChange={(e) => setHeightInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Live Calculation Card */}
              {(() => {
                const actW = parseFloat(actualWeightInput) || 0;
                const l = parseFloat(lengthInput) || 0;
                const w = parseFloat(widthInput) || 0;
                const h = parseFloat(heightInput) || 0;
                const volW = (l > 0 && w > 0 && h > 0) ? parseFloat(((l * w * h) / 5000).toFixed(2)) : 0;
                const chgW = parseFloat(Math.max(actW, volW).toFixed(2));
                const category = (verifyingOrder.parcelDetails?.category || 'OTHER').toUpperCase();
                const premium = (category === 'FRAGILE' || category === 'ELECTRONICS') ? 100 : 0;
                const baseCharge = parseFloat((chgW * 50).toFixed(2));
                const taxable = baseCharge + premium;
                const tax = parseFloat((taxable * 0.18).toFixed(2));
                const estTotal = parseFloat((taxable + tax).toFixed(2));
                const curTotal = verifyingOrder.totalAmount ?? verifyingOrder.price ?? 0;
                const diff = parseFloat((estTotal - curTotal).toFixed(2));

                return (
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Volumetric Weight:</span>
                      <span className="font-mono text-slate-300">{volW} kg</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Chargeable Weight:</span>
                      <span className="font-mono text-indigo-400 font-bold">{chgW} kg</span>
                    </div>
                    <div className="h-px bg-slate-800 my-1"></div>
                    <div className="flex justify-between text-slate-400">
                      <span>Current Total:</span>
                      <span className="font-mono text-slate-300">₹{curTotal}</span>
                    </div>
                    <div className="flex justify-between text-slate-300 font-semibold">
                      <span>Revised Total:</span>
                      <span className="font-mono text-white font-bold">₹{estTotal}</span>
                    </div>
                    <div className="flex justify-between text-amber-400 font-bold pt-1 border-t border-slate-800">
                      <span>Price Adjustment:</span>
                      <span className="font-mono">{diff >= 0 ? `+₹${diff} Due` : `-₹${Math.abs(diff)} Refund`}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setVerifyingOrder(null)}
                disabled={isSubmittingWeight}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyWeightSubmit}
                disabled={isSubmittingWeight || !actualWeightInput}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-amber-600/20 flex items-center gap-2 active:scale-95"
              >
                {isSubmittingWeight ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Confirm & Update Price
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
