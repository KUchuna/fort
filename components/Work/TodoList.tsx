"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Trash2, Calendar, Briefcase, ChevronDown, ListTodo } from "lucide-react";
import { toggleWorkTodo, deleteWorkTodo } from "@/app/actions";
import { format } from "date-fns";

interface Todo {
  id: string;
  title: string;
  clientName: string | null;
  description: string | null;
  dueDate: Date | null;
  isCompleted: boolean;
}

export default function TodoList({ initialTodos }: { initialTodos: Todo[] }) {
  const activeTodos = initialTodos.filter(t => !t.isCompleted);
  const completedTodos = initialTodos.filter(t => t.isCompleted);
  const [showCompleted, setShowCompleted] = useState(false);

  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-[#FADCD9] h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-black flex items-center gap-2">
          <div className="bg-[#F9F1F0] p-2 rounded-xl text-[#F8AFA6]">
            <ListTodo className="w-5 h-5" />
          </div>
          My Tasks
        </h2>
        <span className="bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
            {activeTodos.length} Active
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {/* Empty State */}
        {activeTodos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                <p className="text-gray-400 font-medium text-sm">All caught up!</p>
                <p className="text-gray-300 text-xs mt-1">Hit the + button to add tasks.</p>
            </div>
        )}

        {/* Active List */}
        <div className="space-y-3">
            <AnimatePresence mode="popLayout" initial={false}>
            {activeTodos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} />
            ))}
            </AnimatePresence>
        </div>

        {/* Completed Section */}
        {completedTodos.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-100">
                <button 
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-black transition-colors mb-4"
                >
                    Completed ({completedTodos.length})
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showCompleted ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                    {showCompleted && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3 opacity-60"
                        >
                            {completedTodos.map((todo) => (
                                <TodoItem key={todo.id} todo={todo} />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        )}
      </div>
    </div>
  );
}

function TodoItem({ todo }: { todo: Todo }) {
    const [isPending, setIsPending] = useState(false);

    const handleToggle = async () => {
        setIsPending(true);
        await toggleWorkTodo(todo.id, todo.isCompleted);
        setIsPending(false);
    };

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`group relative flex items-start gap-4 p-5 rounded-2xl border transition-all duration-200 ${
                todo.isCompleted 
                    ? "bg-gray-50 border-transparent grayscale" 
                    : "bg-white border-gray-100 hover:border-[#FADCD9] hover:shadow-[0_4px_20px_-10px_rgba(248,175,166,0.3)]"
            }`}
        >
            {/* Custom Checkbox */}
            <button 
                onClick={handleToggle}
                disabled={isPending}
                className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                    todo.isCompleted 
                        ? "bg-black border-black" 
                        : "border-gray-300 hover:border-[#F8AFA6] hover:bg-[#F9F1F0]"
                }`}
            >
                <motion.div
                    initial={false}
                    animate={{ scale: todo.isCompleted ? 1 : 0 }}
                >
                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                </motion.div>
            </button>

            <div className="flex-1 min-w-0 pt-0.5">
                {/* Title */}
                <p className={`font-bold text-sm leading-snug transition-colors break-words max-w-[70%] ${todo.isCompleted ? "text-gray-400 line-through decoration-2" : "text-gray-900"}`}>
                    {todo.title}
                </p>
                
                {/* Tags Grid */}
                {(todo.clientName || todo.dueDate) && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {todo.clientName && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
                                <Briefcase className="w-3 h-3 text-gray-400" /> 
                                {todo.clientName}
                            </span>
                        )}
                        {todo.dueDate && (
                             <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                                 !todo.isCompleted && new Date(todo.dueDate) < new Date() 
                                    ? "bg-red-50 text-red-500 border-red-100" 
                                    : "bg-blue-50 text-blue-500 border-blue-100"
                             }`}>
                                <Calendar className="w-3 h-3" /> 
                                {format(new Date(todo.dueDate), "MMM d")}
                            </span>
                        )}
                    </div>
                )}

                {/* Description */}
                {todo.description && (
                    <p className={`text-xs mt-3 leading-relaxed break-words whitespace-pre-wrap pl-3 border-l-2 ${todo.isCompleted ? "text-gray-300 border-gray-200" : "text-gray-500 border-[#FADCD9]"}`}>
                        {todo.description}
                    </p>
                )}
            </div>

            {/* Delete Button - Positioned absolutely for cleaner layout or just floating right */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4">
                <button 
                    onClick={() => deleteWorkTodo(todo.id)}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Delete Task"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    )
}