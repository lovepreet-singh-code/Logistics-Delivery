"use client";

import React, { useState, useEffect } from 'react';
import { User, Mail, ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';
import apiClient from '@/lib/apiClient';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get('/auth/me'); // identity-service usually exposes /auth/me or similar
        setProfile(res.data.data || res.data);
      } catch (err: any) {
        console.error(err);
        // Fallback: decode token if API fails
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            setProfile(decoded);
          } catch (e) {
            setError('Failed to load profile information.');
          }
        } else {
          setError('Failed to load profile information.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center p-4">
      <div className="w-full max-w-2xl space-y-8 mt-12">
        
        <header className="text-center mb-10 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-indigo-400 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg shadow-indigo-500/20 relative z-10 text-white font-bold text-3xl">
            {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2 relative z-10">
            {profile?.name || 'Customer'}
          </h1>
          <p className="text-slate-500 text-sm relative z-10 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Verified Account
          </p>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-center gap-3 text-red-700 text-center">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-bold">{error}</span>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="p-6 md:p-8 space-y-8">
            
            <div className="flex flex-col space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500" /> Full Name
              </label>
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-slate-800 font-medium">
                {profile?.name || 'N/A'}
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-500" /> Email Address
              </label>
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-slate-800 font-medium flex items-center justify-between">
                <span>{profile?.email || 'N/A'}</span>
                {profile?.email && (
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] uppercase font-bold tracking-wider rounded-md">Primary</span>
                )}
              </div>
            </div>

          </div>
          <div className="bg-slate-50 p-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">Contact support to update your profile details.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
