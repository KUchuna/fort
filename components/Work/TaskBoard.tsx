"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, MoreHorizontal, Trash2, ArrowRight, ArrowLeft } from "lucide-react";
import { createTask, updateTaskStatus, deleteTask } from "@/app/actions";

interface Task {
  id: string;
  title: string;
  clientName: string;
  priority: string | null;
  status: string;
}

const COLUMNS = [
  { id: "to_request", label: "To Request", color: "bg-gray-100", textColor: "text-gray-600" },
  { id: "with_client", label: "With Client", color: "bg-blue-50", textColor: "text-blue-600" },
  { id: "received", label: "Received / Done", color: "bg-green-50", textColor: "text-green-600" },
];

export default function TaskBoard({ initialTasks }: { initialTasks: Task[] }) {
  const [isAdding, setIsAdding] = useState(false);

  // Optimistic UI could be added here, but for simplicity we rely on Server Action revalidation
  
  return (
    <div className="h-full flex flex-col">
      {/* Header & Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-black">PBC Tracker</h2>
        <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 transition-colors"
        >
            <Plus className="w-4 h-4" /> New Request
        </button>
      </div>

      {/* Add Task Form (Collapsible) */}
      {isAdding && (
        <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="mb-8 bg-white p-4 rounded-2xl border border-[#FADCD9] overflow-hidden"
            action={async (formData) => {
                await createTask(formData);
                setIsAdding(false);
            }}
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input name="title" required placeholder="Document Name (e.g. Nov Bank Stmt)" className="bg-[#F9F1F0] p-3 rounded-lg text-sm font-bold outline-none focus:ring-1 focus:ring-[#F8AFA6]" />
                <input name="clientName" required placeholder="Client Name" className="bg-[#F9F1F0] p-3 rounded-lg text-sm font-bold outline-none focus:ring-1 focus:ring-[#F8AFA6]" />
                <select name="priority" defaultValue={"medium"} className="bg-[#F9F1F0] p-3 rounded-lg text-sm font-bold outline-none">
                    <option value="high">High Priority</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
            </div>
            <button type="submit" className="w-full bg-[#F8AFA6] text-white font-bold py-2 rounded-lg hover:brightness-110">Add Request</button>
        </motion.form>
      )}

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 items-start">
        {COLUMNS.map((col) => (
            <div key={col.id} className={`${col.color} p-4 rounded-2xl min-h-[300px]`}>
                <h3 className={`font-bold text-sm uppercase tracking-wider mb-4 ${col.textColor} flex justify-between`}>
                    {col.label}
                    <span className="bg-white/50 px-2 rounded-full">{initialTasks.filter(t => t.status === col.id).length}</span>
                </h3>
                
                <div className="space-y-3">
                    {initialTasks
                        .filter(task => task.status === col.id)
                        .map(task => (
                            <motion.div 
                                layoutId={task.id}
                                key={task.id} 
                                className="bg-white p-4 rounded-xl shadow-sm border border-transparent hover:shadow-md transition-shadow group relative"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                                        {task.clientName}
                                    </span>
                                    {task.priority === 'high' && <span className="w-2 h-2 rounded-full bg-red-500" title="High Priority" />}
                                </div>
                                <p className="font-bold text-black text-sm mb-3">{task.title}</p>
                                
                                {/* Actions Footer */}
                                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                    <button 
                                        onClick={() => deleteTask(task.id)}
                                        className="text-gray-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    <div className="flex gap-1">
                                        {col.id !== 'to_request' && (
                                            <button 
                                                onClick={() => updateTaskStatus(task.id, getPrevStatus(col.id))}
                                                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-black"
                                                title="Move Back"
                                            >
                                                <ArrowLeft className="w-4 h-4" />
                                            </button>
                                        )}
                                        {col.id !== 'received' && (
                                            <button 
                                                onClick={() => updateTaskStatus(task.id, getNextStatus(col.id))}
                                                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-black"
                                                title="Move Forward"
                                            >
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                    ))}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}

// Helpers to determine next column
function getNextStatus(current: string) {
    if (current === 'to_request') return 'with_client';
    if (current === 'with_client') return 'received';
    return current;
}
function getPrevStatus(current: string) {
    if (current === 'received') return 'with_client';
    if (current === 'with_client') return 'to_request';
    return current;
}