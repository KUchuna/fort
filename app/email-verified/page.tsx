"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";

export default function EmailVerifiedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F9F1F0] p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-[2rem] shadow-xl text-center max-w-sm w-full border border-[#FADCD9]"
      >
        <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10" />
        </div>
        
        <h1 className="text-2xl font-bold text-black mb-2 font-gilroy">You're In!</h1>
        <p className="text-gray-500 mb-8">
          Your email has been verified successfully. You now have full access to the wishlist.
        </p>
        
        <Link href="/wishlist">
          <button className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-2">
            Go to Wishlist <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </motion.div>
    </main>
  );
}