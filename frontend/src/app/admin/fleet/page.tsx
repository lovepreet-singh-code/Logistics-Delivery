"use client";

import React, { useState, useEffect } from 'react';
import { Truck, Loader2, Plus, CheckCircle, AlertTriangle, MapPin, Navigation, User, Calendar, Fuel, PenTool } from 'lucide-react';
import axios from 'axios';
import apiClient from '@/lib/apiClient';

interface Franchise {
  _id: string;
  name: string;
  region: string;
  basePinCode: string;
}

interface Vehicle {
  _id: string;
  registrationNumber: string;
  franchiseId: string | Franchise; // Depending on populate
  capacity: {
    maxWeightKg: number;
    maxVolumeCm3: number;
  };
  status: string;
  createdAt: string;
}

export default function FleetPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [hubs, setHubs] = useState<Franchise[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    registrationNumber: '',
    type: 'TRUCK', // Only for UI, stripped by strict-mode backend
    weight: '',
    volume: '',
    franchiseId: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vehiclesRes, hubsRes] = await Promise.all([
        apiClient.get('/fleet/vehicles'),
        apiClient.get('/topology/franchises')
      ]);
      setVehicles(vehiclesRes.data.data || []);
      setHubs(hubsRes.data.data || []);
    } catch (error) {
      console.error("Failed to fetch data", error);
      showToast('error', 'Failed to load fleet data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.franchiseId) {
      showToast('error', 'Please select an assigned hub.');
      return;
    }

    try {
      setSubmitting(true);
      const adminToken = localStorage.getItem('adminToken') || '';
      
      // Structure exactly matching backend schema
      const payload = {
        registrationNumber: formData.registrationNumber,
        franchiseId: formData.franchiseId,
        type: formData.type, // UI placebo, ignored by mongoose
        capacity: {
          maxWeightKg: Number(formData.weight),
          maxVolumeCm3: Number(formData.volume)
        },
        status: "AVAILABLE"
      };

      await apiClient.post('/fleet/vehicles', payload);
      
      showToast('success', 'Vehicle registered successfully!');
      setFormData({ registrationNumber: '', type: 'TRUCK', weight: '', volume: '', franchiseId: '' });
      fetchData(); // Refresh the list
    } catch (error: any) {
      console.error("Registration failed", error);
      showToast('error', error.response?.data?.message || 'Failed to register vehicle.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl transition-all animate-in slide-in-from-top-10 ${toast.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="font-semibold">{toast.message}</span>
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Truck className="w-8 h-8 text-indigo-400" />
          Fleet Management
        </h1>
        <p className="text-slate-400 mt-2">Provision vehicles and monitor fleet capacity.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              Register New Vehicle
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Registration Number</label>
                <input 
                  type="text" 
                  name="registrationNumber"
                  required
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  placeholder="e.g. AB-12-CD-3456"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Assigned Hub</label>
                <div className="relative">
                  <select 
                    name="franchiseId"
                    required
                    value={formData.franchiseId}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none"
                  >
                    <option value="" disabled>Select a hub...</option>
                    {hubs.map(hub => (
                      <option key={hub._id} value={hub._id}>{hub.name} ({hub.region})</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Vehicle Type</label>
                <div className="relative">
                  <select 
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none"
                  >
                    <option value="TRUCK">Heavy Truck</option>
                    <option value="VAN">Delivery Van</option>
                    <option value="BIKE">Motorbike</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Weight Cap (kg)</label>
                  <input 
                    type="number" 
                    name="weight"
                    required
                    min="0"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="1000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Volume Cap (cm³)</label>
                  <input 
                    type="number" 
                    name="volume"
                    required
                    min="0"
                    value={formData.volume}
                    onChange={handleChange}
                    placeholder="5000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                {submitting ? 'Registering...' : 'Register Vehicle'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Active Fleet */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl min-h-[500px]">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-indigo-400" />
              Active Fleet
            </h2>

            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
                <p>Loading fleet data from microservices...</p>
              </div>
            ) : vehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800">
                <Truck className="w-12 h-12 mb-4 opacity-50" />
                <p>No vehicles provisioned yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {vehicles.map(vehicle => (
                  <div key={vehicle._id} className="bg-slate-950 border border-slate-800 rounded-3xl p-6 hover:border-indigo-500/50 transition-all group relative overflow-hidden flex flex-col shadow-lg">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full -z-10 transition-all group-hover:scale-110"></div>
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 transition-all shadow-inner">
                          <Truck className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white mb-0.5 group-hover:text-indigo-300 transition-colors uppercase tracking-wider">{vehicle.registrationNumber}</h3>
                          <div className="flex items-center gap-2">
                             <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase
                              ${vehicle.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-400' : 
                                vehicle.status === 'IN_TRANSIT' ? 'bg-blue-500/20 text-blue-400' : 
                                'bg-amber-500/20 text-amber-400'}`}>
                              {vehicle.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 space-y-5">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assigned Driver</p>
                          <p className="text-sm font-semibold text-slate-300">Rahul Kumar</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-end">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Fuel className="w-3 h-3 text-emerald-500" /> Fuel Level</p>
                            <p className="text-xs font-bold text-slate-300">75%</p>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '75%' }}></div>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><PenTool className="w-3 h-3 text-amber-500" /> Maintenance</p>
                           <p className="text-xs font-bold text-slate-300">In 14 Days</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 border-t border-slate-800/50 pt-5">
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Orders</p>
                          <p className="text-lg font-bold text-white">12</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Max Wgt</p>
                          <p className="text-sm font-bold text-slate-300 mt-1.5">{vehicle.capacity?.maxWeightKg || 0}kg</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Hub ID</p>
                          <p className="text-xs font-mono text-slate-400 mt-2">{typeof vehicle.franchiseId === 'string' ? vehicle.franchiseId.slice(-4) : (vehicle.franchiseId as any)?._id?.slice(-4) || 'Unk'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
