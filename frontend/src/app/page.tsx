"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { Truck, Lock, Mail, ArrowRight, User as UserIcon, Shield } from "lucide-react";

export default function AuthPortal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CUSTOMER");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check for redirect error from middleware
  useEffect(() => {
    const errorMsg = searchParams.get("error");
    if (errorMsg) {
      setError(errorMsg);
    }
  }, [searchParams]);

  // Auto-redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");
    
    if (token && storedRole) {
      if (storedRole === "ADMIN") router.push("/admin");
      else if (storedRole === "CUSTOMER") router.push("/customer");
      else if (storedRole === "AGENT" || storedRole === "DRIVER") router.push("/agent");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      
      const endpoint = isLogin 
        ? "http://localhost:8080/api/auth/login" 
        : "http://localhost:8080/api/auth/register";
        
      const payload = isLogin 
        ? { email, password } 
        : { name, email, password, role };
        
      const res = await axios.post(endpoint, payload);
      
      const data = res.data.data || res.data;
      const { token, user } = data;
      
      // Save to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);

      // Save name to localStorage so Profile page can read it
      if (data.user && data.user.name) {
        localStorage.setItem('name', data.user.name);
      } else if (data.name) {
        localStorage.setItem('name', data.name);
      } else if (user && user.name) {
        localStorage.setItem('name', user.name);
      }
      
      // Save to cookie for Next.js Middleware
      document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax; Secure`;
      document.cookie = `role=${user.role}; path=/; max-age=86400; SameSite=Lax; Secure`;
      
      // Delay navigation slightly to let cookies settle
      setTimeout(() => {
        if (user.role === "ADMIN") {
          window.location.href = "/admin";
        } else if (user.role === "CUSTOMER") {
          window.location.href = "/customer";
        } else if (user.role === "AGENT" || user.role === "DRIVER") {
          window.location.href = "/agent";
        } else {
          window.location.href = "/";
        }
      }, 100);
      
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.response?.data?.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
      
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 shadow-2xl shadow-indigo-500/10 rounded-[2rem] p-8 relative overflow-hidden">
        
        {/* Glowing Logo */}
        <div className="flex justify-center mb-8 relative">
          <div className="absolute inset-0 bg-indigo-500/30 blur-3xl rounded-full scale-150"></div>
          <div className="relative w-16 h-16 bg-slate-800 border border-slate-700 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6 transition-all duration-300">
            <Truck className="w-8 h-8 text-indigo-400" />
          </div>
        </div>

        <h1 className="text-2xl font-black text-center text-white mb-2 tracking-tight">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="text-center text-slate-400 text-sm mb-8 font-medium">
          {isLogin ? "Sign in to the Logistics Platform" : "Join the Logistics Enterprise Network"}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 text-red-400 rounded-xl text-sm font-bold border border-red-500/20 text-center animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          
          {!isLogin && (
            <div>
              <div className="relative">
                <input
                  type="text"
                  required={!isLogin}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-5 py-3.5 rounded-xl bg-slate-950/50 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-slate-900 transition-colors shadow-inner text-sm"
                  placeholder="Full Name"
                />
                <UserIcon className="w-4 h-4 absolute left-4 top-4 text-slate-500" />
              </div>
            </div>
          )}

          <div>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-5 py-3.5 rounded-xl bg-slate-950/50 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-slate-900 transition-colors shadow-inner text-sm"
                placeholder="Email Address"
              />
              <Mail className="w-4 h-4 absolute left-4 top-4 text-slate-500" />
            </div>
          </div>

          <div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-5 py-3.5 rounded-xl bg-slate-950/50 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-slate-900 transition-colors shadow-inner text-sm"
                placeholder="Password"
              />
              <Lock className="w-4 h-4 absolute left-4 top-4 text-slate-500" />
            </div>
          </div>

          {!isLogin && (
            <div>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-12 pr-5 py-3.5 rounded-xl bg-slate-950/50 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 focus:bg-slate-900 transition-colors shadow-inner text-sm appearance-none"
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="AGENT">Agent / Driver</option>
                  <option value="ADMIN">Administrator</option>
                </select>
                <Shield className="w-4 h-4 absolute left-4 top-4 text-slate-500" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all duration-300 flex justify-center items-center gap-2 group mt-6 disabled:opacity-50 disabled:hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] relative overflow-hidden"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative z-10">{isLogin ? "Secure Login" : "Register Now"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center relative z-10">
          <button 
            onClick={() => {
               setIsLogin(!isLogin);
               setError("");
            }}
            className="text-slate-400 hover:text-white font-medium transition-colors text-sm"
          >
            {isLogin ? "Don't have an account? Sign up here" : "Already have an account? Sign in"}
          </button>
        </div>

      </div>
    </div>
  );
}
