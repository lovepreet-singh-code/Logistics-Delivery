"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Building2, MapPin, Search, CheckCircle2, XCircle, Users, Phone } from 'lucide-react';

interface Hub {
  _id: string;
  hubName: string;
  hubCode: string;
  managerName: string;
  contactNumber: string;
  serviceablePincodes: string[];
  isActive: boolean;
  createdAt: string;
}

export default function HubsManagementPage() {
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    hubName: '',
    hubCode: '',
    managerName: '',
    contactNumber: '',
    pincodesInput: '',
    isActive: true,
  });

  const fetchHubs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:4004/api/hubs');
      setHubs(res.data.data || []);
    } catch (error) {
      console.error("Error fetching hubs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHubs();
  }, []);

  const handleRegisterHub = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const serviceablePincodes = formData.pincodesInput
        .split(',')
        .map(code => code.trim())
        .filter(code => code.length > 0);

      await axios.post('http://localhost:4004/api/hubs', {
        hubName: formData.hubName,
        hubCode: formData.hubCode,
        managerName: formData.managerName,
        contactNumber: formData.contactNumber,
        serviceablePincodes,
        isActive: formData.isActive
      });

      setIsModalOpen(false);
      setFormData({ hubName: '', hubCode: '', managerName: '', contactNumber: '', pincodesInput: '', isActive: true });
      fetchHubs();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to register hub');
    }
  };

  return (
    <div className="p-8 space-y-8 min-h-screen bg-[#0A0D14]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#151921] p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Building2 className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Hub & Franchise Management</h1>
            <p className="text-slate-400 text-sm mt-1">Manage network topology and serviceability regions</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Register New Hub
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-[#151921] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#1A1F29]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-400" /> Network Hubs
          </h2>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Search hubs..." 
              className="pl-9 pr-4 py-2 bg-[#0A0D14] border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#0F131A] text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Hub Name</th>
                <th className="px-6 py-4">Hub Code</th>
                <th className="px-6 py-4">Manager</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 text-center">Serviceable Pincodes</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">Loading network topology...</td>
                </tr>
              ) : hubs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">No hubs registered yet.</td>
                </tr>
              ) : (
                hubs.map((hub) => (
                  <tr key={hub._id} className="hover:bg-[#1A1F29] transition-colors group">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-500/20">
                        <Building2 className="w-4 h-4 text-indigo-400" />
                      </div>
                      {hub.hubName}
                    </td>
                    <td className="px-6 py-4 font-mono text-indigo-400">{hub.hubCode}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-500" />
                        {hub.managerName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-500" />
                        {hub.contactNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-xs font-bold border border-indigo-500/20">
                        {hub.serviceablePincodes?.length || 0} Pincodes
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {hub.isActive ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold">
                          <XCircle className="w-3.5 h-3.5" /> Inactive
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151921] border border-slate-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-[#1A1F29]">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" /> Register New Hub
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleRegisterHub} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hub Name</label>
                  <input required value={formData.hubName} onChange={(e) => setFormData({...formData, hubName: e.target.value})} type="text" className="w-full bg-[#0A0D14] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="e.g. Delhi Central" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hub Code</label>
                  <input required value={formData.hubCode} onChange={(e) => setFormData({...formData, hubCode: e.target.value})} type="text" className="w-full bg-[#0A0D14] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors uppercase" placeholder="e.g. DEL-01" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Manager Name</label>
                  <input required value={formData.managerName} onChange={(e) => setFormData({...formData, managerName: e.target.value})} type="text" className="w-full bg-[#0A0D14] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Number</label>
                  <input required value={formData.contactNumber} onChange={(e) => setFormData({...formData, contactNumber: e.target.value})} type="tel" className="w-full bg-[#0A0D14] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="+91 9876543210" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Serviceable Pincodes (Comma Separated)</label>
                <textarea 
                  required
                  value={formData.pincodesInput}
                  onChange={(e) => setFormData({...formData, pincodesInput: e.target.value})}
                  rows={3} 
                  className="w-full bg-[#0A0D14] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none font-mono text-sm" 
                  placeholder="110001, 110002, 201301"
                ></textarea>
                <p className="text-xs text-slate-500">These pincodes determine if an order can be picked up or delivered by this hub.</p>
              </div>

              <div className="flex items-center gap-3 bg-[#0A0D14] p-4 rounded-xl border border-slate-700">
                <input 
                  type="checkbox" 
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  id="isActive" 
                  className="w-5 h-5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-[#1A1F29]" 
                />
                <label htmlFor="isActive" className="text-sm font-medium text-white cursor-pointer">Hub is Active and Operational</label>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-medium text-slate-300 hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                  Save Hub
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
