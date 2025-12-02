"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Square, Clock } from "lucide-react";
import { startTimer, stopTimer } from "@/app/actions";

interface ActiveTimer {
  id: string;
  clientName: string;
  description: string | null;
  startTime: Date;
}

export default function FocusTimer({ activeTimer }: { activeTimer: ActiveTimer | null }) {
  const [elapsed, setElapsed] = useState(0);
  const [client, setClient] = useState("");
  const [desc, setDesc] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Tick logic: If there is an active timer from DB, calculate difference every second
  useEffect(() => {
    if (!activeTimer) {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - new Date(activeTimer.startTime).getTime()) / 1000);
      setElapsed(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  const handleStart = async () => {
    if (!client) return;
    setIsLoading(true);
    await startTimer(client, desc);
    setIsLoading(false);
  };

  const handleStop = async () => {
    setIsLoading(true);
    await stopTimer();
    setIsLoading(false);
    setClient("");
    setDesc("");
  };

  // Format seconds into HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#FADCD9] h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6 text-gray-400 uppercase text-xs font-bold tracking-widest">
        <Clock className="w-4 h-4" />
        Billable Focus
      </div>

      {activeTimer ? (
        // --- RUNNING STATE ---
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl font-gilroy font-bold text-black tabular-nums mb-4"
          >
            {formatTime(elapsed)}
          </motion.div>
          <div className="mb-8">
            <h3 className="text-xl font-bold text-[#F8AFA6]">{activeTimer.clientName}</h3>
            <p className="text-gray-400">{activeTimer.description || "Working..."}</p>
          </div>
          
          <button 
            onClick={handleStop}
            disabled={isLoading}
            className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all w-full justify-center"
          >
            <Square className="w-4 h-4 fill-current" /> Stop Timer
          </button>
        </div>
      ) : (
        // --- STOPPED STATE ---
        <div className="flex-1 flex flex-col justify-center space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-500 ml-1">Client / Project</label>
            <input 
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="e.g. Coca-Cola Audit"
              className="w-full bg-[#F9F1F0] p-4 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-[#F8AFA6] font-bold text-black"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-500 ml-1">Task Details</label>
            <input 
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. Inventory Count"
              className="w-full bg-[#F9F1F0] p-4 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-[#F8AFA6]"
            />
          </div>
          
          <button 
            onClick={handleStart}
            disabled={!client || isLoading}
            className="bg-black text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all w-full justify-center mt-4"
          >
            <Play className="w-4 h-4 fill-current" /> Start Focus
          </button>
        </div>
      )}
    </div>
  );
}