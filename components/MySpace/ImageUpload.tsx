"use client"

import { useState, useRef, useEffect } from 'react';
import { saveImageToDb } from '@/app/actions';
import { Loader2, Image as ImageIcon, CheckCircle2, X, AlertCircle, Sparkles, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { upload } from '@vercel/blob/client';

export default function ImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [toastStatus, setToastStatus] = useState<'success' | 'error' | null>(null);
  
  // New states for the customization step
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Toast Timer
  useEffect(() => {
    if (toastStatus) {
      const timer = setTimeout(() => setToastStatus(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastStatus]);

  // Step 1: Handle File Selection (Don't upload yet!)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file)); 
    setCustomTitle(file.name.split('.')[0]); 
    setToastStatus(null);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCustomTitle("");
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

const handleUploadConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setIsUploading(true);

    try {
      const newBlob = await upload(selectedFile.name, selectedFile, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      });
      await saveImageToDb(newBlob.url, newBlob.pathname, customTitle);
      setToastStatus('success');
      handleCancel();
    } catch (error) {
      console.error("Upload failed", error);
      setToastStatus('error');
    } finally {
      setIsUploading(false);
    }
};


  return (
    <>
      {/* --- TOAST NOTIFICATION OVERLAY (Kept exactly as is) --- */}
      <AnimatePresence>
        {toastStatus && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 bg-white/90 backdrop-blur-md border border-white/50 shadow-2xl shadow-pink-500/20 p-4 rounded-2xl min-w-[320px]"
          >
            {toastStatus === 'success' ? (
              <div className="bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-full p-2 text-white shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            ) : (
              <div className="bg-gradient-to-tr from-rose-500 to-red-600 rounded-full p-2 text-white shadow-lg shadow-rose-500/30">
                <AlertCircle className="w-5 h-5" />
              </div>
            )}

            <div className="flex-1">
              <h4 className="text-sm font-bold text-gray-800">
                {toastStatus === 'success' ? 'Uploaded Successfully! ✨' : 'Upload Failed'}
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                {toastStatus === 'success' 
                  ? 'Your memory has been added to the gallery.' 
                  : 'Something went wrong. Please try again.'}
              </p>
            </div>

            <button 
              onClick={() => setToastStatus(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- UPLOAD AREA --- */}
      <div className="mb-8 flex justify-start w-full max-w-md">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*"
        />
        
        <AnimatePresence mode="wait">
          {!selectedFile ? (
            // STATE 1: THE BUTTON (Idle)
            <motion.button
              key="upload-btn"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-white shadow-lg shadow-pink-500/30 transition-all duration-300 bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600"
            >
              <ImageIcon className="w-5 h-5" />
              <span>Add Memory</span>
            </motion.button>
          ) : (
            // STATE 2: THE CUSTOMIZATION CARD (Selected)
            <motion.form
              key="upload-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleUploadConfirm}
              className="w-full bg-white p-4 rounded-3xl shadow-xl shadow-pink-500/10 border border-rose-100 flex items-center gap-4"
            >
              {/* Tiny Preview */}
              <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-rose-50 border border-rose-100">
                 {previewUrl && (
                   <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                 )}
              </div>

              {/* Inputs */}
              <div className="flex-1 min-w-0">
                 <div className="flex items-center gap-1 text-[10px] text-rose-300 uppercase font-bold tracking-wider mb-1">
                    <Sparkles className="w-3 h-3" /> New Memory
                 </div>
                 <input 
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Name this memory..."
                    autoFocus
                    className="w-full bg-transparent border-b border-rose-200 focus:border-rose-500 outline-none text-rose-900 font-medium placeholder:text-rose-300/70 transition-colors pb-0.5"
                 />
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                 <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isUploading}
                  className="p-2 rounded-full text-rose-300 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                 >
                   <X className="w-5 h-5" />
                 </button>
                 <button
                  type="submit"
                  disabled={isUploading || !customTitle.trim()}
                  className="p-2 rounded-full bg-rose-500 text-white shadow-md shadow-rose-500/30 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                 >
                   {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                 </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}