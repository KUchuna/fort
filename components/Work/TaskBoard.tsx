"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, ArrowRight, ArrowLeft, Calendar, AlertCircle, FileText, Briefcase, Flag } from "lucide-react";
import { createTask, updateTaskStatus, deleteTask } from "@/app/actions";
import { format } from "date-fns";

// ... Interfaces ...
interface Task {
  id: string;
  title: string;
  clientName: string;
  priority: string | null;
  status: string;
  dueDate: Date | null;
}

interface TaskBoardProps {
  initialTasks: Task[];
  clients: { id: string; name: string }[];
}

const COLUMNS = [
  { id: "to_request", label: "To Request", color: "bg-gray-50", textColor: "text-gray-600", borderColor: "border-gray-200" },
  { id: "with_client", label: "With Client", color: "bg-blue-50", textColor: "text-blue-600", borderColor: "border-blue-100" },
  { id: "received", label: "Received / Done", color: "bg-green-50", textColor: "text-green-600", borderColor: "border-green-100" },
];

export default function TaskBoard({ initialTasks, clients }: TaskBoardProps) {
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-xl font-bold text-black">PBC Tracker</h2>
            <p className="text-gray-400 text-xs">Track client document workflow</p>
        </div>
        <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 transition-colors"
        >
            <Plus className="w-4 h-4" /> New Request
        </button>
      </div>

      {/* Add Task Form (Styled) */}
      {isAdding && (
        <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-8 bg-white p-6 rounded-3xl border border-[#FADCD9] overflow-hidden shadow-sm"
            action={async (formData) => {
                await createTask(formData);
                setIsAdding(false);
            }}
        >
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-4">Create New PBC Item</h3>
            <div className="space-y-4">
                <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    <input name="title" required placeholder="Document Name" className="w-full bg-[#F9F1F0] pl-12 pr-4 py-4 rounded-2xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-[#F8AFA6] transition-all" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                        <select name="clientId" required defaultValue="" className="w-full bg-[#F9F1F0] pl-12 pr-8 py-4 rounded-2xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-[#F8AFA6] appearance-none cursor-pointer">
                            <option value="" disabled>Select Client...</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="relative">
                        <Flag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                        <select name="priority" defaultValue="medium" className="w-full bg-[#F9F1F0] pl-12 pr-8 py-4 rounded-2xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-[#F8AFA6] appearance-none cursor-pointer">
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                        <input type="date" name="dueDate" className="w-full bg-[#F9F1F0] pl-12 pr-4 py-4 rounded-2xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-[#F8AFA6]" />
                    </div>
                </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
                <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-black">Cancel</button>
                <button type="submit" className="bg-[#F8AFA6] text-white px-8 py-3 rounded-2xl text-sm font-bold hover:brightness-110">Create Request</button>
            </div>
        </motion.form>
      )}

      {/* Grid Content */}
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
                                {task.priority === 'medium' && <span className="w-2 h-2 rounded-full bg-yellow-500" title="Medium Priority" />}
                                {task.priority === 'low' && <span className="w-2 h-2 rounded-full bg-blue-500" title="Low Priority" />}
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

// Helpers
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