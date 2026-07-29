"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Truck, Lock, Mail, User, Shield, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CUSTOMER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      
      await axios.post("http://localhost:8080/api/auth/register", { 
        name, 
        email, 
        password, 
        role 
      });
      
      setSuccess("Account created successfully! Redirecting to login...");
      
      setTimeout(() => {
        router.push("/");
      }, 1500);
      
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.response?.data?.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 flex items-center justify-center p-4">
      
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 relative overflow-hidden">
        
        {/* Glowing Logo */}
        <div className="flex justify-center mb-8 relative">
          <div className="absolute inset-0 bg-indigo-500/50 blur-2xl rounded-full scale-150"></div>
          <div className="relative w-20 h-20 bg-white/10 border border-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6 hover:rotate-0 transition-all duration-300">
            <Truck className="w-10 h-10 text-indigo-100" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-white mb-2 tracking-tight drop-shadow-md">
          Create Account
        </h1>
        <p className="text-center text-indigo-200 mb-8 font-medium tracking-wide">
          Join the Logistics Platform
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 text-red-200 rounded-xl text-sm font-medium border border-red-500/30 text-center backdrop-blur-md animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-500/20 text-emerald-200 rounded-xl text-sm font-medium border border-emerald-500/30 text-center backdrop-blur-md animate-in fade-in slide-in-from-top-2">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          
          {/* Full Name */}
          <div>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white/10 transition-all duration-300 shadow-inner"
                placeholder="Full Name"
              />
              <User className="w-5 h-5 absolute left-4 top-3.5 text-indigo-300" />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white/10 transition-all duration-300 shadow-inner"
                placeholder="Email Address"
              />
              <Mail className="w-5 h-5 absolute left-4 top-3.5 text-indigo-300" />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white/10 transition-all duration-300 shadow-inner"
                placeholder="Password"
              />
              <Lock className="w-5 h-5 absolute left-4 top-3.5 text-indigo-300" />
            </div>
          </div>

          {/* Role Dropdown */}
          <div>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-12 pr-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white/10 transition-all duration-300 shadow-inner cursor-pointer"
              >
                <option value="CUSTOMER" className="bg-slate-800 text-white">Customer</option>
                <option value="AGENT" className="bg-slate-800 text-white">Delivery Agent</option>
              </select>
              <Shield className="w-5 h-5 absolute left-4 top-3.5 text-indigo-300" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-500 hover:from-pink-600 hover:to-indigo-600 text-white font-bold text-lg shadow-lg hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-[1.02] active:scale-95 flex justify-center items-center gap-2 group mt-6 disabled:opacity-70 disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign Up</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center relative z-10">
          <Link href="/" className="text-indigo-200 hover:text-white font-medium transition-colors text-sm">
            Already have an account? Log in here
          </Link>
        </div>

      </div>
    </div>
  );
}
