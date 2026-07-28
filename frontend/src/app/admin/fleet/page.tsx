"use client";

import React, { useState, useEffect } from 'react';
import { Truck, Loader2, Plus, CheckCircle, AlertTriangle, MapPin, Navigation } from 'lucide-react';
import axios from 'axios';

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
        axios.get('http://localhost:8080/api/fleet/vehicles'),
        axios.get('http://localhost:8080/api/topology/franchises')
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

      await axios.post('http://localhost:8080/api/fleet/vehicles', payload, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      
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
                  <div key={vehicle._id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                       <span className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase
                        ${vehicle.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-400' : 
                          vehicle.status === 'IN_TRANSIT' ? 'bg-blue-500/20 text-blue-400' : 
                          'bg-amber-500/20 text-amber-400'}`}>
                        {vehicle.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Truck className="w-5 h-5 text-indigo-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white uppercase">{vehicle.registrationNumber}</h3>
                    </div>
                    
                    <div className="space-y-2 mt-4">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        <span>Hub ID: <span className="font-mono text-xs">{typeof vehicle.franchiseId === 'string' ? vehicle.franchiseId.slice(-6) : (vehicle.franchiseId as any)?._id?.slice(-6) || 'Unknown'}</span></span>
                      </div>
                      
                      <div className="flex gap-2">
                        <div className="flex-1 bg-slate-900 rounded-lg p-2 text-center border border-slate-800">
                           <div className="text-[10px] text-slate-500 uppercase tracking-wide">Weight</div>
                           <div className="text-sm font-semibold text-slate-300">{vehicle.capacity?.maxWeightKg || 0}kg</div>
                        </div>
                        <div className="flex-1 bg-slate-900 rounded-lg p-2 text-center border border-slate-800">
                           <div className="text-[10px] text-slate-500 uppercase tracking-wide">Volume</div>
                           <div className="text-sm font-semibold text-slate-300">{vehicle.capacity?.maxVolumeCm3 || 0}cm³</div>
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
