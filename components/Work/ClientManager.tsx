"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users, Loader2, Trash2, Pencil, Check, X, AlertTriangle } from "lucide-react";
import { createClient, deleteClient, updateClient } from "@/app/actions";

export default function ClientManager({ clients }: { clients: { id: string, name: string }[] }) {
  const [isPending, setIsPending] = useState(false);
  
  // State for Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // State for Deleting (The ID of the client we want to delete)
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- EDIT LOGIC ---
  const startEditing = (client: { id: string, name: string }) => {
    setEditingId(client.id);
    setEditName(client.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleUpdate = async () => {
    if (!editingId || !editName.trim()) return;
    await updateClient(editingId, editName);
    setEditingId(null);
  };

  // --- DELETE LOGIC ---
  // 1. Instead of confirm(), we just set the ID to open the modal
  const promptDelete = (id: string) => {
    setDeletingId(id);
  };

  // 2. The actual delete function called by the Modal
  const confirmDelete = async () => {
    if (!deletingId) return;
    await deleteClient(deletingId);
    setDeletingId(null);
  };

  return (
    <>
      <div className="bg-white rounded-3xl p-6 border border-[#FADCD9] shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-gray-400 uppercase text-xs font-bold tracking-widest">
          <Users className="w-4 h-4" /> Clients
        </div>

        {/* Add Client Form */}
        <form 
          action={async (formData) => {
              setIsPending(true);
              await createClient(formData);
              setIsPending(false);
          }}
          className="flex gap-2 mb-4"
        >
          <input 
              name="name"
              required
              placeholder="New Client Name..."
              className="bg-[#F9F1F0] px-4 py-2 rounded-xl text-xs font-bold w-full outline-none focus:ring-1 focus:ring-[#F8AFA6]"
          />
          <button 
              disabled={isPending}
              className="bg-black text-white p-2 rounded-xl hover:bg-zinc-800 disabled:opacity-50"
          >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4" />}
          </button>
        </form>

        {/* Client List */}
        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
          {clients.length === 0 && <p className="text-xs text-gray-400">No clients yet.</p>}
          
          {clients.map(client => (
              <div key={client.id} className="group flex items-center justify-between gap-2 text-sm font-bold text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100 hover:border-[#FADCD9] transition-colors">
                  
                  {editingId === client.id ? (
                      // --- EDIT MODE ---
                      <div className="flex items-center gap-2 w-full animate-in fade-in">
                          <input 
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="bg-white px-2 py-1 rounded-md text-xs font-bold w-full outline-none ring-1 ring-[#F8AFA6]"
                              autoFocus
                          />
                          <button onClick={handleUpdate} className="p-1 hover:bg-green-100 text-green-600 rounded">
                              <Check className="w-3 h-3" />
                          </button>
                          <button onClick={cancelEditing} className="p-1 hover:bg-red-100 text-red-600 rounded">
                              <X className="w-3 h-3" />
                          </button>
                      </div>
                  ) : (
                      // --- VIEW MODE ---
                      <>
                          <div className="flex items-center gap-2 overflow-hidden">
                              <div className="w-2 h-2 rounded-full bg-[#F8AFA6] flex-shrink-0" />
                              <span className="truncate">{client.name}</span>
                          </div>
                          
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                  onClick={() => startEditing(client)}
                                  className="p-1.5 hover:bg-white rounded-md text-gray-400 hover:text-blue-500 transition-colors"
                              >
                                  <Pencil className="w-3 h-3" />
                              </button>
                              {/* Updates: Click opens modal */}
                              <button 
                                  onClick={() => promptDelete(client.id)}
                                  className="p-1.5 hover:bg-white rounded-md text-gray-400 hover:text-red-500 transition-colors"
                              >
                                  <Trash2 className="w-3 h-3" />
                              </button>
                          </div>
                      </>
                  )}
              </div>
          ))}
        </div>
      </div>

      {/* --- DELETE MODAL --- */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingId(null)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="relative bg-white p-6 rounded-3xl shadow-xl w-full max-w-sm border border-red-100"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                
                <h3 className="text-lg font-bold text-black mb-2">Delete Client?</h3>
                <p className="text-gray-500 text-sm mb-6">
                  This will remove the client and potentially delete all linked tasks. 
                  <br /><span className="font-bold text-red-400">This action cannot be undone.</span>
                </p>

                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => setDeletingId(null)}
                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}