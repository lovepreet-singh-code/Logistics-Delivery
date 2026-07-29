"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { 
  Package, 
  MapPin, 
  User, 
  Phone, 
  CheckCircle,
  Loader2,
  ArrowRight,
  Shield,
  Ruler
} from "lucide-react";

export default function BookParcelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    senderName: "",
    senderPhone: "",
    pickupAddress: "",
    pickupPinCode: "",
    receiverName: "",
    receiverPhone: "",
    deliveryAddress: "",
    deliveryPinCode: "",
    weightKg: "1",
    lengthCm: "10",
    widthCm: "10",
    heightCm: "10",
    parcelType: "Box",
    declaredValue: "1000",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      
      const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
      const customerId = payload?.id || payload?.userId || payload?._id;

      if (!customerId) {
        throw new Error("User session invalid. Please log in again.");
      }

      const orderPayload = {
        customerId,
        pickupAddress: {
          fullAddress: formData.pickupAddress,
          pinCode: formData.pickupPinCode,
          senderName: formData.senderName,
          senderPhone: formData.senderPhone
        },
        deliveryAddress: {
          fullAddress: formData.deliveryAddress,
          pinCode: formData.deliveryPinCode,
          receiverName: formData.receiverName,
          receiverPhone: formData.receiverPhone
        },
        parcelDetails: {
          weightKg: Number(formData.weightKg),
          parcelType: formData.parcelType,
          declaredValue: Number(formData.declaredValue),
          dimensions: {
            lengthCm: Number(formData.lengthCm),
            widthCm: Number(formData.widthCm),
            heightCm: Number(formData.heightCm),
          }
        }
      };

      const res = await axios.post("http://localhost:8080/api/orders", orderPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTrackingId(res.data.data._id);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to book parcel.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-12 h-12 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Booking Confirmed!</h1>
        <p className="text-slate-500 mb-8 text-center max-w-md">
          Your parcel has been successfully registered and is awaiting pickup.
        </p>
        
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm mb-8 text-center w-full max-w-md">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Tracking ID</p>
          <p className="text-2xl font-mono font-bold text-indigo-600 bg-indigo-50 py-3 rounded-xl">
            {trackingId}
          </p>
        </div>

        <button 
          onClick={() => router.push("/customer/orders")}
          className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-500 transition-colors shadow-lg hover:shadow-indigo-500/30"
        >
          View My Orders <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Book a Parcel</h1>
        <p className="text-slate-500 mt-1">Enter shipment details to arrange a pickup.</p>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SENDER & RECEIVER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Sender Details */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10" />
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-500" /> Sender (Pickup)
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                  <input required type="text" name="senderName" value={formData.senderName} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Sender Name" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                  <input required type="text" name="senderPhone" value={formData.senderPhone} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="+91..." />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Full Address</label>
                <input required type="text" name="pickupAddress" value={formData.pickupAddress} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="123 Street Name, City" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">PIN Code</label>
                <input required type="text" name="pickupPinCode" value={formData.pickupPinCode} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="110001" />
              </div>
            </div>
          </div>

          {/* Receiver Details */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10" />
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-500" /> Receiver (Delivery)
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                  <input required type="text" name="receiverName" value={formData.receiverName} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Receiver Name" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                  <input required type="text" name="receiverPhone" value={formData.receiverPhone} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="+91..." />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Full Address</label>
                <input required type="text" name="deliveryAddress" value={formData.deliveryAddress} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="456 Avenue, City" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">PIN Code</label>
                <input required type="text" name="deliveryPinCode" value={formData.deliveryPinCode} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="110002" />
              </div>
            </div>
          </div>

        </div>

        {/* PARCEL DETAILS */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
            <Package className="w-5 h-5 text-slate-500" /> Parcel Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Parcel Type</label>
              <div className="relative">
                <Shield className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                <select name="parcelType" value={formData.parcelType} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer">
                  <option value="Document">Document</option>
                  <option value="Box">Box</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Fragile">Fragile</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Weight (Kg)</label>
              <input required type="number" min="0.1" step="0.1" name="weightKg" value={formData.weightKg} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Declared Value (Rs)</label>
              <input required type="number" min="0" name="declaredValue" value={formData.declaredValue} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="block text-sm font-medium text-slate-600 mb-3 flex items-center gap-2">
              <Ruler className="w-4 h-4 text-slate-400" /> Dimensions (cm)
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <input required type="number" min="1" name="lengthCm" value={formData.lengthCm} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Length" />
                <span className="text-xs text-slate-400 mt-1 block text-center">Length</span>
              </div>
              <div>
                <input required type="number" min="1" name="widthCm" value={formData.widthCm} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Width" />
                <span className="text-xs text-slate-400 mt-1 block text-center">Width</span>
              </div>
              <div>
                <input required type="number" min="1" name="heightCm" value={formData.heightCm} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Height" />
                <span className="text-xs text-slate-400 mt-1 block text-center">Height</span>
              </div>
            </div>
          </div>
        </div>

        {/* SUBMIT */}
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-colors shadow-xl disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <><Package className="w-6 h-6" /> Book Shipment</>
          )}
        </button>

      </form>
    </div>
  );
}
