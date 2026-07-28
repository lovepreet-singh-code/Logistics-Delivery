"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation, Package, CheckCircle, AlertTriangle, Loader2, Info } from 'lucide-react';
import axios from 'axios';

export default function BookOrderPage() {
  const router = useRouter();
  
  const [submitting, setSubmitting] = useState(false);
  const [checkingServiceability, setCheckingServiceability] = useState(false);
  const [serviceable, setServiceable] = useState<boolean | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [formData, setFormData] = useState({
    pickupStreet: '',
    pickupCity: '',
    pickupPincode: '',
    deliveryStreet: '',
    deliveryCity: '',
    deliveryPincode: '',
    weightKg: '',
    lengthCm: '',
    widthCm: '',
    heightCm: '',
    description: ''
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    // Reset serviceability if pincodes change
    if (e.target.name === 'pickupPincode' || e.target.name === 'deliveryPincode') {
      setServiceable(null);
    }
  };

  const checkServiceability = async () => {
    if (!formData.pickupPincode || !formData.deliveryPincode) {
      showToast('error', 'Please enter both pickup and delivery pincodes.');
      return;
    }

    try {
      setCheckingServiceability(true);
      // Check Pickup
      await axios.get(`http://localhost:8080/api/topology/check/${formData.pickupPincode}`);
      // Check Delivery
      await axios.get(`http://localhost:8080/api/topology/check/${formData.deliveryPincode}`);
      
      setServiceable(true);
      showToast('success', 'Both locations are serviceable!');
    } catch (error: any) {
      setServiceable(false);
      showToast('error', 'One or both pincodes are out of our service area.');
    } finally {
      setCheckingServiceability(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (serviceable === false) {
      showToast('error', 'Cannot book: Locations are not serviceable.');
      return;
    }

    try {
      setSubmitting(true);
      const customerToken = localStorage.getItem('customerToken') || '';
      const customerId = localStorage.getItem('customerId') || 'mock-customer-id';

      const payload = {
        customerId,
        pickupAddress: {
          pinCode: formData.pickupPincode,
          lat: 40.7128, // Mock Geo-coord
          lng: -74.0060, // Mock Geo-coord
          fullAddress: `${formData.pickupStreet}, ${formData.pickupCity}`
        },
        deliveryAddress: {
          pinCode: formData.deliveryPincode,
          lat: 34.0522, // Mock Geo-coord
          lng: -118.2437, // Mock Geo-coord
          fullAddress: `${formData.deliveryStreet}, ${formData.deliveryCity}`
        },
        parcelDetails: {
          weightKg: Number(formData.weightKg),
          dimensions: {
            lengthCm: Number(formData.lengthCm),
            widthCm: Number(formData.widthCm),
            heightCm: Number(formData.heightCm)
          }
        }
      };

      await axios.post('http://localhost:8080/api/orders', payload, {
        headers: {
          Authorization: `Bearer ${customerToken}`
        }
      });
      
      showToast('success', 'Order placed successfully! Redirecting...');
      
      setTimeout(() => {
        router.push('/customer'); // Redirecting to tracking dashboard
      }, 1500);

    } catch (error: any) {
      console.error("Booking failed", error);
      showToast('error', error.response?.data?.message || 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans selection:bg-indigo-500/30">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl transition-all animate-in slide-in-from-top-10 ${toast.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="font-semibold">{toast.message}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <header className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Book a Shipment</h1>
          <p className="text-slate-400">Fill in the details below to dispatch your parcel.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Addresses Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Pickup */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-2xl shadow-xl relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <MapPin className="w-24 h-24 text-indigo-500" />
              </div>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                <MapPin className="w-5 h-5 text-indigo-400" />
                Pickup Location
              </h2>
              <div className="space-y-4 relative z-10">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Street Address</label>
                  <input type="text" name="pickupStreet" required value={formData.pickupStreet} onChange={handleChange} placeholder="123 Warehouse St" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">City</label>
                    <input type="text" name="pickupCity" required value={formData.pickupCity} onChange={handleChange} placeholder="Metropolis" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Pincode</label>
                    <input type="text" name="pickupPincode" required value={formData.pickupPincode} onChange={handleChange} placeholder="10001" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-2xl shadow-xl relative overflow-hidden group hover:border-purple-500/50 transition-colors">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Navigation className="w-24 h-24 text-purple-500 rotate-45" />
              </div>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                <Navigation className="w-5 h-5 text-purple-400 rotate-45" />
                Delivery Location
              </h2>
              <div className="space-y-4 relative z-10">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Street Address</label>
                  <input type="text" name="deliveryStreet" required value={formData.deliveryStreet} onChange={handleChange} placeholder="456 Destination Ave" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">City</label>
                    <input type="text" name="deliveryCity" required value={formData.deliveryCity} onChange={handleChange} placeholder="Gotham" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Pincode</label>
                    <input type="text" name="deliveryPincode" required value={formData.deliveryPincode} onChange={handleChange} placeholder="10002" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Serviceability Check Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-inner">
             <div className="flex items-center gap-3">
               <Info className="w-5 h-5 text-indigo-400" />
               <span className="text-sm text-slate-300">
                 {serviceable === true ? (
                   <span className="text-emerald-400 font-semibold">Serviceability confirmed! Ready to book.</span>
                 ) : serviceable === false ? (
                   <span className="text-red-400 font-semibold">Service unavailable for these routes.</span>
                 ) : (
                   "Verify service availability before booking."
                 )}
               </span>
             </div>
             <button 
               type="button" 
               onClick={checkServiceability}
               disabled={checkingServiceability || !formData.pickupPincode || !formData.deliveryPincode}
               className="bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 border border-slate-700"
             >
               {checkingServiceability ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
               Check Routes
             </button>
          </div>

          {/* Parcel Details */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-2xl shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-400" />
              Parcel Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Weight (kg)</label>
                <input type="number" name="weightKg" required min="0.1" step="0.1" value={formData.weightKg} onChange={handleChange} placeholder="5" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Length (cm)</label>
                <input type="number" name="lengthCm" required min="1" value={formData.lengthCm} onChange={handleChange} placeholder="10" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Width (cm)</label>
                <input type="number" name="widthCm" required min="1" value={formData.widthCm} onChange={handleChange} placeholder="10" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Height (cm)</label>
                <input type="number" name="heightCm" required min="1" value={formData.heightCm} onChange={handleChange} placeholder="10" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-slate-400 mb-1">Description (Optional)</label>
               <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Electronics, fragile..." className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 h-24 resize-none" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting || serviceable === false}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-5 px-6 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3 shadow-xl shadow-indigo-500/25 text-lg"
          >
            {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle className="w-6 h-6" />}
            {submitting ? 'Processing...' : 'Confirm & Dispatch Order'}
          </button>
        </form>

      </div>
    </div>
  );
}
