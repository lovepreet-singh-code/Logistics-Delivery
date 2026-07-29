"use client";

import React, { useState } from 'react';
import { Settings, Building2, Mail, Key, Shield, Database, Save, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('company');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 1000);
  };

  const tabs = [
    { id: 'company', label: 'Company Details', icon: Building2 },
    { id: 'smtp', label: 'SMTP & Email', icon: Mail },
    { id: 'auth', label: 'Auth Secrets', icon: Key },
    { id: 'api', label: 'API Keys', icon: Database },
    { id: 'roles', label: 'Roles & Permissions', icon: Shield },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Settings className="w-8 h-8 text-slate-400" />
            System Settings
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Configure global parameters and enterprise integrations.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg ${
            saved 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-emerald-500/10' 
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
          }`}
        >
          {saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Configuration'}
        </button>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 shrink-0 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                  isActive 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Form Area */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl relative overflow-hidden">
          
          {/* Tab Content: Company */}
          {activeTab === 'company' && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-xl font-bold text-white mb-6">Company Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Company Name</label>
                  <input type="text" defaultValue="Logistics Delivery Enterprise" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tax ID / GSTIN</label>
                  <input type="text" defaultValue="27AADCB2230M1Z2" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-sm" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Headquarters Address</label>
                  <input type="text" defaultValue="Level 4, Trade Centre, BKC, Mumbai 400051" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: SMTP */}
          {activeTab === 'smtp' && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-xl font-bold text-white mb-6">SMTP / Email Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">SMTP Host</label>
                  <input type="text" defaultValue="smtp.sendgrid.net" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">SMTP Port</label>
                  <input type="number" defaultValue={587} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-sm" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">SMTP Username</label>
                  <input type="text" defaultValue="apikey" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-sm" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">SMTP Password</label>
                  <input type="password" defaultValue="SG.fake_key_for_demo_purposes_only" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-sm" />
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Auth Secrets */}
          {activeTab === 'auth' && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-xl font-bold text-white mb-6">Authentication Secrets</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">JWT Secret Key</label>
                  <div className="flex gap-2">
                    <input type="password" defaultValue="super_secret_jwt_key_2026" className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-sm" />
                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors text-sm font-bold">Rotate</button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Session Expiry (Hours)</label>
                  <input type="number" defaultValue={24} className="w-full md:w-48 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-sm" />
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: API Keys */}
          {activeTab === 'api' && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-xl font-bold text-white mb-6">External Integrations</h2>
              <div className="space-y-6">
                <div className="space-y-2 pb-6 border-b border-slate-800">
                  <label className="text-xs font-bold text-slate-500 uppercase">Google Maps API Key</label>
                  <input type="password" defaultValue="AIzaSyB_fake_key_for_demo" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-sm" />
                </div>
                <div className="space-y-2 pb-6 border-b border-slate-800">
                  <label className="text-xs font-bold text-slate-500 uppercase">Cloudinary URL</label>
                  <input type="password" defaultValue="cloudinary://12345:abcde@logistics" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-sm" />
                </div>
                
                <h3 className="text-lg font-bold text-slate-300 pt-2">Infrastructure Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
                    <span className="font-bold text-slate-300">Kafka Broker</span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">CONNECTED</span>
                  </div>
                  <div className="bg-slate-950 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
                    <span className="font-bold text-slate-300">Redis Cache</span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">CONNECTED</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Roles */}
          {activeTab === 'roles' && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-xl font-bold text-white mb-6">Roles & Permissions</h2>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm text-slate-400">
                  <thead className="bg-slate-900/50 border-b border-slate-800 text-xs uppercase tracking-wider font-bold">
                    <tr>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Access Level</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr>
                      <td className="px-6 py-4 font-bold text-slate-200">SUPER_ADMIN</td>
                      <td className="px-6 py-4 font-mono text-indigo-400">System Wide</td>
                      <td className="px-6 py-4"><span className="text-emerald-500">Active</span></td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-bold text-slate-200">MANAGER</td>
                      <td className="px-6 py-4 font-mono text-indigo-400">Hub Restricted</td>
                      <td className="px-6 py-4"><span className="text-emerald-500">Active</span></td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-bold text-slate-200">AGENT</td>
                      <td className="px-6 py-4 font-mono text-indigo-400">Self Assigned</td>
                      <td className="px-6 py-4"><span className="text-emerald-500">Active</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
        </div>

      </div>
    </div>
  );
}
