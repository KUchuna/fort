"use client";

import { useState } from "react";
import { loginAction } from "@/app/actions";
import { redirect } from "next/navigation";
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';

export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Call the specific MySpace action
    const result = await loginAction(password);

    if (result.success) {
      redirect("/myspace");
    } else {
      setError(result.message || "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#F9F1F0] overflow-hidden">
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl shadow-[#F8AFA6]/20 border border-[#FADCD9] w-full max-w-sm text-center"
      >
        {/* Icon Badge */}
        <div className="mx-auto w-12 h-12 bg-[#F9F1F0] rounded-full flex items-center justify-center mb-4 border border-[#FADCD9]">
             <Sparkles size={20} className="text-[#F8AFA6]" />
        </div>

        <h1 className="text-2xl font-bold text-[#F8AFA6] mb-2 tracking-tight">
            My Space
        </h1>
        <p className="text-black/40 mb-8 text-sm font-medium">
            Enter password to access your dashboard.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password..."
                autoComplete="off"
                disabled={loading}
                className={`w-full bg-[#F9F1F0] border text-black placeholder:text-black/20 rounded-2xl px-4 py-3.5 outline-none transition-all duration-300 text-center font-medium ${
                  error 
                  ? 'border-red-200 bg-red-50 focus:ring-2 focus:ring-red-100' 
                  : 'border-transparent focus:border-[#F8AFA6] focus:bg-white focus:shadow-sm'
                }`}
              />
          </div>

          {/* Error Message Display */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="overflow-hidden"
            >
                <div className="flex items-center justify-center gap-2 text-red-400 text-xs font-bold bg-red-50/50 border border-red-100 py-2.5 rounded-xl">
                    <AlertCircle size={14} />
                    {error}
                </div>
            </motion.div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#F8AFA6] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-[#F8AFA6]/30 flex justify-center items-center group"
          >
            {loading ? (
                <Loader2 className="animate-spin" size={20} />
            ) : (
                <span className="group-hover:scale-105 transition-transform">Unlock Space</span>
            )}
          </button>
        </form>
      </motion.div>

       {/* Footer Copyright/Text */}
       <div className="absolute bottom-6 text-[10px] text-[#F8AFA6]/60 uppercase tracking-widest font-bold">
         Restricted Access
       </div>
    </div>
  );
}