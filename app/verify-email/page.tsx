"use client";

import { motion } from "framer-motion";
import { Mail, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F9F1F0] p-4 font-sans text-black">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-[#FADCD9] p-8 text-center"
      >
        <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-10 h-10" />
        </div>

        <h1 className="text-3xl font-bold mb-4 font-gilroy">Check your inbox</h1>
        
        <p className="text-gray-500 mb-8 leading-relaxed">
          We sent a verification link to <br/>
          <span className="font-bold text-black">{email || "your email"}</span>.
          <br />
          Please click the link to activate your account.
        </p>

        <div className="space-y-4">
          <a 
            href="https://mail.google.com" 
            target="_blank" 
            rel="noreferrer"
            className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
          >
            Open Gmail <ExternalLink className="w-4 h-4" />
          </a>

          <Link 
            href="/wishlist/login"
            className="block text-sm text-gray-400 hover:text-black transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
        </div>
      </motion.div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}