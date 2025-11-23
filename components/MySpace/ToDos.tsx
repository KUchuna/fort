"use client"

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, Sparkles, Loader2, X, Heart } from 'lucide-react';
import { addTodo, toggleTodo, deleteTodo } from '@/app/actions';

// --- Types ---
interface Todo {
  id: number;
  title: string;
  is_completed: boolean;
  created_at: string;
}

interface TodosProps {
  todosData: Todo[] | any
}

export default function FloatingTodo({todosData}: TodosProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [todos, setTodos] = useState<Todo[]>(todosData);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddTodo = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!inputValue.trim()) return;
  
  setIsSubmitting(true);
  
  const tempId = Date.now();
  const newTodo = { id: tempId, title: inputValue, is_completed: false, created_at: new Date().toISOString() };
  setTodos(prev => [newTodo, ...prev]);
  setInputValue('');

  await addTodo(inputValue); 
  
  setIsSubmitting(false);
};

const handleToggleTodo = async (id: number, currentStatus: boolean) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, is_completed: !t.is_completed } : t));
    await toggleTodo(id, !currentStatus);
};

const handleDeleteTodo = async (id: number) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    await deleteTodo(id);
};
  useEffect(() => {
    if (isOpen && !isLoading) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isLoading]);

  const pendingTodos = todos.filter(t => !t.is_completed).length;

  return (
    <div className="fixed bottom-8 left-6 z-50 flex flex-col items-end gap-4 font-sans" id='todo'>      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20, originY: 1, originX: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-80 sm:w-120 h-[400px] bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl shadow-pink-500/20 rounded-3xl overflow-hidden flex flex-col"
            id="todo"
          >
            {/* Header */}
            <div className="bg-linear-to-r from-rose-100 to-pink-100 p-6 pb-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="text-2xl font-bold text-rose-950 flex items-center gap-2">
                    My Tasks <Sparkles className="w-5 h-5 text-pink-500" />
                  </h2>
                  <p className="text-rose-700/80 text-xs font-medium mt-1">
                    {pendingTodos === 0 
                      ? "You're all caught up, queen! 👑" 
                      : `${pendingTodos} things left to conquer`}
                  </p>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full hover:bg-rose-200/50 text-rose-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-linear-to-b from-white/50 to-rose-50/30" id='todo'>
              
              {/* Input */}
              <form onSubmit={handleAddTodo} className="relative mb-6 group">
                <div className="absolute inset-0 bg-linear-to-r from-rose-300 to-pink-300 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative flex items-center bg-white border border-rose-100 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-pink-200 transition-all">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Add a new dream..."
                    className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-sm text-rose-900 placeholder:text-rose-300"
                    disabled={isSubmitting}
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isSubmitting}
                    className="mr-2 p-2 rounded-xl bg-linear-to-tr from-rose-400 to-pink-500 text-white shadow-lg shadow-pink-500/30 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>
              </form>

              {/* List */}
              <div className="space-y-2 pb-2">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 text-pink-400 animate-spin" />
                  </div>
                ) : (
                  <ul className="space-y-2">
                    <AnimatePresence initial={false} mode="popLayout">
                      {todos.length === 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-8 text-rose-300 flex flex-col items-center gap-2"
                        >
                          <Heart className="w-8 h-8 opacity-40" />
                          <p className="text-sm">No tasks yet.</p>
                        </motion.div>
                      )}

                      {todos.map((todo) => (
                        <motion.li
                          layout
                          key={todo.id}
                          initial={{ opacity: 0, y: 10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                          whileHover={{ scale: 1.02 }}
                          className="group bg-white hover:bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-center gap-3 shadow-sm hover:shadow-md hover:shadow-pink-100 transition-all duration-300"
                        >
                          <button
                            onClick={() => handleToggleTodo(todo.id, todo.is_completed)}
                            className={`
                              shrink-0 w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-all duration-300
                              ${todo.is_completed 
                                ? 'bg-linear-to-tr from-rose-400 to-pink-500 border-transparent text-white' 
                                : 'border-rose-200 text-transparent hover:border-rose-400'}
                            `}
                          >
                            <Check className="w-3 h-3" strokeWidth={3} />
                          </button>
                          
                          <span className={`
                            flex-1 text-sm font-medium truncate transition-all duration-300
                            ${todo.is_completed ? 'text-rose-300 line-through decoration-rose-300' : 'text-rose-800'}
                          `}>
                            {todo.title}
                          </span>

                          <button
                            onClick={() => handleDeleteTodo(todo.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-300 hover:text-rose-500 hover:bg-rose-100 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (Trigger) */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative w-14 h-14 rounded-full shadow-xl shadow-pink-500/40 flex items-center justify-center text-white transition-all duration-300
          bg-linear-to-tr from-rose-500 via-pink-500 to-fuchsia-500
        `}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-7 h-7" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <Sparkles className="w-7 h-7" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}