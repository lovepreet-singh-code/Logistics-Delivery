"use client";

import React, { useState, useEffect } from 'react';
import { Map, Loader2, Plus, CheckCircle, AlertTriangle, Building, Navigation, User, Edit2, Trash2, Eye, Truck, Package, ShieldCheck } from 'lucide-react';
import axios from 'axios';

interface Franchise {
  _id: string;
  name: string;
  region: string;
  basePinCode: string;
  createdAt: string;
}

export default function HubsPage() {
  const [hubs, setHubs] = useState<Franchise[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    region: '',
    basePinCode: '',
    latitude: '',
    longitude: '',
    volumeCapacity: ''
  });

  const fetchHubs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:8080/api/topology/franchises');
      setHubs(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch hubs", error);
      showToast('error', 'Failed to load existing hubs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHubs();
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      const adminToken = localStorage.getItem('adminToken') || '';

      await axios.post('http://localhost:8080/api/topology/franchises', formData, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      
      showToast('success', 'Hub registered successfully!');
      setFormData({ name: '', region: '', basePinCode: '', latitude: '', longitude: '', volumeCapacity: '' });
      fetchHubs(); // Refresh the list
    } catch (error: any) {
      console.error("Registration failed", error);
      showToast('error', error.response?.data?.message || 'Failed to register hub.');
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
          <Map className="w-8 h-8 text-indigo-400" />
          Hubs & Topology
        </h1>
        <p className="text-slate-400 mt-2">Manage regional distribution hubs and service zones.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              Register New Hub
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Hub Name</label>
                <input 
                  type="text" 
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Metropolis Central"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Region</label>
                  <input 
                    type="text" 
                    name="region"
                    required
                    value={formData.region}
                    onChange={handleChange}
                    placeholder="e.g. North"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Base Pin Code</label>
                  <input 
                    type="text" 
                    name="basePinCode"
                    required
                    value={formData.basePinCode}
                    onChange={handleChange}
                    placeholder="e.g. 10001"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Latitude</label>
                  <input 
                    type="number" 
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="40.7128"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Longitude</label>
                  <input 
                    type="number" 
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="-74.0060"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Volume Capacity (m³)</label>
                <input 
                  type="number" 
                  name="volumeCapacity"
                  value={formData.volumeCapacity}
                  onChange={handleChange}
                  placeholder="e.g. 5000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                {submitting ? 'Registering...' : 'Register Hub'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Existing Hubs */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl min-h-[500px]">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-400" />
              Existing Hubs
            </h2>

            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
                <p>Loading hubs from topology service...</p>
              </div>
            ) : hubs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800">
                <Navigation className="w-12 h-12 mb-4 opacity-50" />
                <p>No hubs registered yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hubs.map(hub => (
                  <div key={hub._id} className="bg-slate-950 border border-slate-800 rounded-3xl p-6 hover:border-indigo-500/50 transition-all group shadow-lg relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full -z-10 transition-all group-hover:scale-110"></div>
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 transition-all shadow-inner">
                          <Building className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white mb-0.5 group-hover:text-indigo-300 transition-colors">{hub.name}</h3>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 bg-slate-800 rounded text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {hub.region}
                            </span>
                            <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                              <Map className="w-3 h-3" /> {hub.basePinCode}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>
                        <button className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>

                    <div className="flex-1 space-y-5">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hub Manager</p>
                          <p className="text-sm font-semibold text-slate-300">Vikram Singh</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Capacity Utilization</p>
                          <p className="text-xs font-bold text-slate-300">68%</p>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: '68%' }}></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 border-t border-slate-800/50 pt-5">
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Package className="w-3 h-3" /> Today</p>
                          <p className="text-lg font-bold text-white">412</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Truck className="w-3 h-3" /> Fleet</p>
                          <p className="text-lg font-bold text-white">24</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><User className="w-3 h-3" /> Staff</p>
                          <p className="text-lg font-bold text-white">35</p>
                        </div>
                      </div>
                    </div>

                    <button className="w-full mt-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-sm">
                      <Eye className="w-4 h-4" /> View Details
                    </button>
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
