"use client"

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, X, Loader2, Sparkles } from "lucide-react";
import * as z from "zod";
import { addObsession } from "@/app/actions"; 

const DescriptionSchema = z.object({
  description: z.string()
    .min(5, "Description must be at least 5 characters")
    .max(230, "Description must be at most 230 characters")
})

export default function CurrentObsession() {
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [toastStatus, setToastStatus] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    if (toastStatus) {
      const timer = setTimeout(() => setToastStatus(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastStatus]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setToastStatus(null);
    
    const result = DescriptionSchema.safeParse({ description });
    
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("description", description);

    try {
      await addObsession(formData);
      
      setToastStatus('success');
      setDescription("");
    } catch (err) {
      setToastStatus('error');
      setError("Failed to update obsession");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex justify-start mt-0 lg:mt-6 rounded-3xl w-full">
      
      <AnimatePresence>
        {toastStatus && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 bg-white/90 backdrop-blur-md border border-white/50 shadow-2xl shadow-pink-500/20 p-4 rounded-2xl min-w-[320px]"
          >
            {toastStatus === 'success' ? (
              <div className="bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-full p-2 text-white shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            ) : (
              <div className="bg-gradient-to-tr from-rose-500 to-red-600 rounded-full p-2 text-white shadow-lg shadow-rose-500/30">
                <AlertCircle className="w-5 h-5" />
              </div>
            )}

            <div className="flex-1">
              <h4 className="text-sm font-bold text-gray-800">
                {toastStatus === 'success' ? 'Obsession Updated! ✨' : 'Update Failed'}
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                {toastStatus === 'success' 
                  ? 'Your profile has been updated successfully.' 
                  : 'Please check your connection and try again.'}
              </p>
            </div>

            <button 
              onClick={() => setToastStatus(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="w-full max-w-lg">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-rose-400 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
            Current Obsession <Sparkles className="text-pink-400 w-5 h-5 md:w-6 md:h-6" />
          </h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">
            Update your current obsession (this will be shown on the home page):
          </p>
        </div>

        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="relative">
             <textarea 
              placeholder="My new obsession is..." 
              name="description" 
              className={`
                w-full border rounded-[20px] resize-none outline-none px-6 py-4 min-h-[150px] text-slate-700 shadow-sm transition-all duration-300
                focus:ring-4 focus:ring-pink-100 text-sm md:text-base
                ${error 
                  ? "border-rose-300 focus:border-rose-400 bg-rose-50/50" 
                  : "border-slate-200 focus:border-pink-300 bg-white"}
              `}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />  
            <div className="absolute bottom-3 right-4 text-xs text-slate-400">
              {description.length}/230
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-rose-500 text-sm flex items-center gap-1 pl-2"
            >
              <AlertCircle className="w-4 h-4" /> {error}
            </motion.p>
          )}

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting}
            type="submit"
            className={`
              flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-white shadow-lg shadow-pink-500/30 
              transition-all duration-300 ml-auto mt-2 w-full md:w-auto
              ${isSubmitting 
                ? "bg-pink-300 cursor-not-allowed" 
                : "bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 hover:shadow-pink-500/40"}
            `}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <span>Update Obsession</span>
            )}
          </motion.button>
        </form>
      </section>
    </div>
  )
}