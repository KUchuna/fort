"use client";

import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

interface Task {
  id: string;
  clientName: string;
  status: string; // "to_request", "with_client", "received", etc.
}

export default function EngagementStats({ tasks }: { tasks: Task[] }) {
  // 1. Group tasks by Client
  const clientStats: Record<string, { totalCount: number; doneCount: number; progressScore: number }> = {};

  tasks.forEach((t) => {
    const client = t.clientName || "General";
    
    if (!clientStats[client]) {
      clientStats[client] = { totalCount: 0, doneCount: 0, progressScore: 0 };
    }

    // Increment Total Tasks
    clientStats[client].totalCount += 1;

    // Calculate Scores based on status (Adjusted for your 5-column logic if needed)
    if (t.status === "completed" || t.status === "received") {
      clientStats[client].doneCount += 1;       
      clientStats[client].progressScore += 1;   
    } else if (t.status === "with_client") {
      clientStats[client].progressScore += 0.5; 
    }
  });

  // 2. Convert to Array AND Sort
  const clients = Object.entries(clientStats).sort(([, a], [, b]) => {
    // Calculate percentage for A and B
    const percentA = a.progressScore / a.totalCount;
    const percentB = b.progressScore / b.totalCount;
    return percentA - percentB; 
  });

  if (clients.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {clients.map(([name, stats], i) => (
        <StatCard 
            key={name} 
            name={name} 
            total={stats.totalCount} 
            done={stats.doneCount} 
            score={stats.progressScore} 
            index={i} 
        />
      ))}
    </div>
  );
}

function StatCard({ name, total, done, score, index }: { name: string; total: number; done: number; score: number; index: number }) {
  const percentage = Math.round((score / total) * 100);
  
  // SVG Math for 68px box (w-17 equivalent)
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div
      layout // Added layout for smooth sorting animation
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }} // Faster stagger
      className="bg-white rounded-[2rem] p-5 border border-[#FADCD9] shadow-sm flex items-center justify-between relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-[#F9F1F0] rounded-bl-full -mr-2 -mt-2 z-0" />

      <div className="z-10 relative">
        <h3 className="font-bold text-black text-sm mb-1 truncate max-w-[100px]" title={name}>
          {name}
        </h3>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
          {done}/{total} Done
        </p>
      </div>

      {/* Animated Donut Chart */}
      <div className="relative w-[68px] h-[68px] flex items-center justify-center z-10">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 68 68">
          <circle
            cx="34"
            cy="34"
            r={radius}
            stroke="#F9F1F0"
            strokeWidth="6"
            fill="transparent"
          />
          <motion.circle
            cx="34"
            cy="34"
            r={radius}
            stroke={percentage === 100 ? "#22c55e" : "#F8AFA6"}
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        
        <div className="absolute inset-0 flex items-center justify-center">
          {percentage === 100 ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <span className="text-xs font-bold text-gray-600">{percentage}%</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}