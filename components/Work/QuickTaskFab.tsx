"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Calendar, User, FileText, AlertCircle, Check, Loader2, Briefcase } from "lucide-react";
import { createWorkTodo } from "@/app/actions";

export default function QuickTaskFab() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true);
    await createWorkTodo(formData);
    
    // Show success state briefly before closing
    setIsPending(false);
    setIsSuccess(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsSuccess(false);
    }, 1000);
  };

  return (
    <>
      {/* --- FLOATING ACTION BUTTON (FAB) --- */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-50 bg-black text-white p-5 rounded-full shadow-2xl shadow-black/30 flex items-center justify-center group"
      >
        <Plus className="w-8 h-8 transition-transform duration-300 group-hover:rotate-90" />
      </motion.button>

      {/* --- SLIDE-OVER DRAWER --- */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-white z-[60] shadow-2xl p-8 flex flex-col border-l border-[#FADCD9]"
            >
              {/* Drawer Header */}
              <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold font-gilroy text-black">New Task</h2>
                    <p className="text-gray-400 text-sm">Add to your PBC list or To-Do</p>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {isSuccess ? (
                <div className="flex-1 flex flex-col items-center justify-center text-green-500 animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
                        <Check className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-black">Task Created!</h3>
                </div>
              ) : (
                <form action={handleSubmit} className="flex-1 flex flex-col gap-6 overflow-y-auto px-2">
                    
                    {/* 1. Title */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Task Title</label>
                        <input 
                            name="title" 
                            required 
                            placeholder="e.g. Review Q3 Payroll" 
                            className="w-full bg-[#F9F1F0] p-4 rounded-xl font-bold text-lg outline-none focus:ring-2 focus:ring-[#F8AFA6] transition-all placeholder:font-normal"
                        />
                    </div>

                    {/* 2. Client Name */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Client / Project</label>
                        <div className="relative">
                            <Briefcase className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
                            <input 
                                name="clientName" 
                                required 
                                placeholder="Client Name" 
                                className="w-full bg-white border border-gray-200 pl-12 p-4 rounded-xl outline-none focus:border-[#F8AFA6] transition-all"
                            />
                        </div>
                    </div>

                    {/* 3. Deadline */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Due Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
                            <input 
                                name="dueDate" 
                                type="date"
                                className="w-full bg-white border border-gray-200 pl-12 p-4 rounded-xl outline-none focus:border-[#F8AFA6] transition-all"
                            />
                        </div>
                    </div>

                    {/* 4. Priority (Suggested) */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Priority Level</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['Low', 'Medium', 'High'].map((p) => (
                                <label key={p} className="cursor-pointer">
                                    <input type="radio" name="priority" value={p.toLowerCase()} className="peer sr-only" defaultChecked={p === 'Medium'} />
                                    <div className="text-center py-3 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm peer-checked:bg-black peer-checked:text-white peer-checked:border-black transition-all hover:bg-gray-50">
                                        {p}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 5. Description */}
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description / Notes</label>
                        <textarea 
                            name="description" 
                            placeholder="Add details, specific GL accounts, or contact persons..." 
                            className="w-full h-full min-h-[120px] bg-white border border-gray-200 p-4 rounded-xl outline-none focus:border-[#F8AFA6] transition-all resize-none leading-relaxed"
                        />
                    </div>

                    {/* Submit */}
                    <button 
                        disabled={isPending}
                        type="submit"
                        className="mt-2 w-full bg-[#F8AFA6] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-[#F8AFA6]/30 flex justify-center items-center group"
                    >
                        {isPending ? <Loader2 className="animate-spin" /> : "Create Task"}
                    </button>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}