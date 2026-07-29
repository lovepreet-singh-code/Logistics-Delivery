"use client";

import { useState } from "react";
import { User, Phone, Mail, Lock, Camera, Save, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+91 98765 43210",
    currentPassword: "",
    newPassword: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock save delay
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-slate-500 mt-2 text-sm font-medium">Update your profile details and security preferences.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          
          {/* Sidebar */}
          <div className="p-6 md:p-8 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col items-center text-center">
            <div className="relative group cursor-pointer mb-4">
              <div className="w-32 h-32 rounded-full bg-indigo-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                <span className="text-4xl font-black text-indigo-300">JD</span>
              </div>
              <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <div className="absolute bottom-0 right-2 w-8 h-8 bg-indigo-600 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="font-bold text-slate-900 text-lg">{formData.name}</h3>
            <p className="text-sm text-slate-500">{formData.email}</p>
            <div className="mt-4 flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Account
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-2 p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Personal Information</h4>
                
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                      <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                      <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400" /> Security
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Current Password</label>
                    <input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">New Password</label>
                    <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} placeholder="Leave blank to keep same" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {success && <span className="text-sm font-bold text-emerald-600 flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Profile updated successfully!</span>}
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-md active:scale-95 disabled:opacity-70"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Changes</>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
