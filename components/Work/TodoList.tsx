"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Trash2, Calendar, Briefcase, ChevronDown } from "lucide-react";
import { toggleWorkTodo, deleteWorkTodo } from "@/app/actions";
import { format } from "date-fns"; // npm install date-fns

interface Todo {
  id: string;
  title: string;
  clientName: string | null;
  description: string | null;
  dueDate: Date | null;
  isCompleted: boolean;
}

export default function TodoList({ initialTodos }: { initialTodos: Todo[] }) {
  // Separate active and completed for better organization
  const activeTodos = initialTodos.filter(t => !t.isCompleted);
  const completedTodos = initialTodos.filter(t => t.isCompleted);
  const [showCompleted, setShowCompleted] = useState(false);

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#FADCD9] h-full flex flex-col">
      <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
        My Tasks <span className="text-gray-400 text-sm font-normal">({activeTodos.length})</span>
      </h2>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {activeTodos.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">
                No active tasks. Hit the + button!
            </div>
        )}

        <AnimatePresence mode="popLayout">
          {activeTodos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </AnimatePresence>

        {/* Completed Section */}
        {completedTodos.length > 0 && (
            <div className="pt-6 border-t border-gray-100 mt-6">
                <button 
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-black transition-colors"
                >
                    Completed ({completedTodos.length})
                    <ChevronDown className={`w-4 h-4 transition-transform ${showCompleted ? 'rotate-180' : ''}`} />
                </button>
                
                {showCompleted && (
                    <div className="mt-4 space-y-3 opacity-60">
                         {completedTodos.map((todo) => (
                            <TodoItem key={todo.id} todo={todo} />
                        ))}
                    </div>
                )}
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`group flex items-start gap-3 p-4 rounded-2xl border transition-all ${
                todo.isCompleted ? "bg-gray-50 border-transparent" : "bg-white border-gray-100 hover:border-[#FADCD9] hover:shadow-sm"
            }`}
        >
            {/* Checkbox */}
            <button 
                onClick={handleToggle}
                disabled={isPending}
                className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    todo.isCompleted 
                        ? "bg-green-500 border-green-500 text-white" 
                        : "border-gray-200 hover:border-[#F8AFA6]"
                }`}
            >
                {todo.isCompleted && <Check className="w-3.5 h-3.5" />}
            </button>

            <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm ${todo.isCompleted ? "text-gray-400 line-through" : "text-black"}`}>
                    {todo.title}
                </p>
                
                <div className="flex flex-wrap gap-2 mt-1.5">
                    {todo.clientName && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            <Briefcase className="w-3 h-3" /> {todo.clientName}
                        </span>
                    )}
                    {todo.dueDate && (
                         <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                             !todo.isCompleted && new Date(todo.dueDate) < new Date() 
                                ? "bg-red-50 text-red-500" 
                                : "bg-blue-50 text-blue-500"
                         }`}>
                            <Calendar className="w-3 h-3" /> {format(new Date(todo.dueDate), "MMM d")}
                        </span>
                    )}
                </div>

                {todo.description && (
                    <p className="text-xs text-gray-400 mt-2 leading-relaxed break-words whitespace-pre-wrap">
                        {todo.description}
                    </p>
                )}
            </div>

            {/* Delete Button (Only visible on hover) */}
            <button 
                onClick={() => deleteWorkTodo(todo.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 transition-all"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </motion.div>
    )
}