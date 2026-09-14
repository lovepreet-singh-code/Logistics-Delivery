"use client";

import React, { useState, useEffect } from 'react';
import { Truck, Loader2, Plus, CheckCircle, AlertTriangle, Navigation } from 'lucide-react';
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
  franchiseId: string | Franchise;
  capacity: {
    maxWeightKg: number;
    maxVolumeCm3: number;
  };
  status: string;
  createdAt: string;
}

interface Agent {
  _id: string;
  name: string;
  vehicleId: string;
}

export default function FleetPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [hubs, setHubs] = useState<Franchise[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    registrationNumber: '',
    type: 'TRUCK', 
    weight: '',
    volume: '',
    franchiseId: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vehiclesRes, hubsRes, agentsRes] = await Promise.all([
        apiClient.get('/fleet/vehicles'),
        apiClient.get('/topology/franchises'),
        apiClient.get('/management/agents')
      ]);
      setVehicles(vehiclesRes.data.data || []);
      setHubs(hubsRes.data.data || []);
      setAgents(agentsRes.data.data || []);
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
      const payload = {
        registrationNumber: formData.registrationNumber,
        franchiseId: formData.franchiseId,
        type: formData.type, 
        capacity: {
          maxWeightKg: Number(formData.weight),
          maxVolumeCm3: Number(formData.volume)
        },
        status: "AVAILABLE"
      };

      await apiClient.post('/fleet/vehicles', payload);
      
      showToast('success', 'Vehicle registered successfully!');
      setFormData({ registrationNumber: '', type: 'TRUCK', weight: '', volume: '', franchiseId: '' });
      fetchData(); 
    } catch (error: any) {
      console.error("Registration failed", error);
      showToast('error', error.response?.data?.message || 'Failed to register vehicle.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl transition-all animate-in slide-in-from-top-10 ${toast.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="font-semibold">{toast.message}</span>
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Truck className="w-8 h-8 text-indigo-400" />
          Vehicles
        </h1>
        <p className="text-slate-400 mt-2">Provision vehicles and monitor fleet capacity.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              Register Vehicle
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

        {/* Right Column: Active Fleet Table */}
        <div className="lg:col-span-8">
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
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800 bg-slate-950/50">
                      <th className="p-4 font-semibold rounded-tl-lg">Registration Plate</th>
                      <th className="p-4 font-semibold">Vehicle Type</th>
                      <th className="p-4 font-semibold">Agent Assigned</th>
                      <th className="p-4 font-semibold rounded-tr-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {vehicles.map(vehicle => {
                      const assignedAgent = agents.find(a => a.vehicleId === vehicle._id);
                      const type = vehicle.capacity?.maxWeightKg > 1000 ? 'Truck' : vehicle.capacity?.maxWeightKg > 100 ? 'Van' : 'Bike';
                      return (
                        <tr key={vehicle._id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-4">
                            <div className="font-mono font-bold text-slate-300 text-sm tracking-wider uppercase">
                              {vehicle.registrationNumber}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-slate-400 font-medium text-sm">{type}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-slate-300 font-medium">{assignedAgent ? assignedAgent.name : <span className="text-slate-600 italic">Unassigned</span>}</span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border
                              ${vehicle.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                vehicle.status === 'IN_TRANSIT' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                              {vehicle.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
