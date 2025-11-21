"use client"

import { useState, useRef, useEffect } from 'react';
import { uploadImage } from '@/app/actions';
import { Loader2, Image as ImageIcon, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  
  const [toastStatus, setToastStatus] = useState<'success' | 'error' | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (toastStatus) {
      const timer = setTimeout(() => setToastStatus(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastStatus]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setIsUploading(true);
    setToastStatus(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name.split('.')[0]); 

    try {
      await uploadImage(formData);
      setToastStatus('success');
    } catch (error) {
      console.error("Upload failed", error);
      setToastStatus('error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* --- TOAST NOTIFICATION OVERLAY --- */}
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

      {/* --- UPLOAD BUTTON --- */}
      <div className="mb-8 flex justify-start">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-white shadow-lg shadow-pink-500/30
            transition-all duration-300
            ${isUploading 
              ? 'bg-pink-300 cursor-not-allowed' 
              : 'bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600'}
          `}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <ImageIcon className="w-5 h-5" />
              <span>Add Memory</span>
            </>
          )}
        </motion.button>
      </div>
    </>
  );
}