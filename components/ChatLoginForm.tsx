'use client'

import { useActionState } from 'react'; // Available in React 19 / Next.js 15+
// If 'useActionState' errors, use: import { useFormState } from 'react-dom';
import { loginToChat } from '@/app/actions';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';

export default function ChatLoginForm() {
  // state will contain the return value of loginToChat (e.g., { error: '...' })
  // isPending is automatically true while the action is running
  const [state, formAction, isPending] = useActionState(loginToChat, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-3xl shadow-xl shadow-pink-200 w-full max-w-sm text-center"
      >
        <h1 className="text-2xl font-bold text-pink-500 mb-2">Secret Chat 🤫</h1>
        <p className="text-gray-400 mb-6 text-sm">Enter the password to join the squad.</p>
        
        {/* Pass formAction to the action prop */}
        <form action={formAction} className="space-y-4">
          <input 
            name="password" 
            type="password" 
            placeholder="Password..."
            // Add error styling if state.error exists
            className={`w-full bg-pink-50 border rounded-xl px-4 py-3 outline-none transition-colors text-center ${
                state?.error ? 'border-red-300 ring-2 ring-red-100' : 'border-pink-100 focus:border-pink-400'
            }`}
          />

          {/* Error Message Display */}
          {state?.error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 text-red-400 text-xs font-medium bg-red-50 py-2 rounded-lg"
            >
              <AlertCircle size={14} />
              {state.error}
            </motion.div>
          )}

          <button 
            type="submit" 
            disabled={isPending}
            className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white font-bold py-3 rounded-xl transition-all flex justify-center items-center"
          >
            {isPending ? <Loader2 className="animate-spin" size={20} /> : "Enter"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}