"use client"

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageOff, Trash2, Loader2, X, Check } from "lucide-react";
import { deleteImage } from "@/app/actions";
import Image from "next/image";

interface GalleryImage {
  id: number;
  url: string;
  pathname: string; 
  title?: string | null;
  blur_data_url?: string; 
}

export default function Images({ images }: { images?: GalleryImage[] }) {
  
  if (!images || images.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 text-rose-300 gap-4"
      >
        <div className="p-6 bg-rose-50 rounded-full">
            <ImageOff className="w-8 h-8 opacity-50" />
        </div>
        <p className="font-medium">No memories collected yet... 🌸</p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 w-full">
      {images.map((image, index) => (
        <ImageCard key={image.id} image={image} index={index} />
      ))}
    </div>
  )
}

function ImageCard({ image, index }: { image: GalleryImage, index: number }) {
  // States: 'idle' | 'confirming' | 'deleting' | 'error'
  const [status, setStatus] = useState<'idle' | 'confirming' | 'deleting' | 'error'>('idle');
  const [isDeleted, setIsDeleted] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStatus('confirming');
  };

  const confirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setStatus('deleting');
    try {
      await deleteImage(image.id, image.pathname);
      setIsDeleted(true);
    } catch (error) {
      console.error("Failed to delete", error);
      setStatus('error');
      // Reset to idle after showing error for 2 seconds
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStatus('idle');
  };

  // If deleted, hide the component completely
  if (isDeleted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.05, 
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
      className="group relative aspect-square rounded-3xl overflow-hidden bg-white border-4 border-white shadow-md hover:shadow-xl hover:shadow-pink-200/50 transition-all duration-300 cursor-pointer"
    >
      <Image 
        src={image.url} 
        alt={image.title || "Gallery image"}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        fill
        quality={90}
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
      />

      {/* --- CONFIRMATION OVERLAY --- */}
      <AnimatePresence>
        {status !== 'idle' && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-rose-950/60 p-4 text-center"
            onClick={(e) => e.stopPropagation()} // Prevent click through
          >
            {status === 'confirming' && (
              <motion.div 
                initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                className="space-y-3"
              >
                <p className="text-white font-medium text-sm drop-shadow-md">
                  Delete this memory?
                </p>
                <div className="flex gap-3 justify-center">
                   <button 
                     onClick={cancelDelete}
                     className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-md transition-colors"
                     title="Cancel"
                   >
                     <X className="w-5 h-5" />
                   </button>
                   <button 
                     onClick={confirmDelete}
                     className="p-2 rounded-full bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/40 transition-colors"
                     title="Confirm Delete"
                   >
                     <Check className="w-5 h-5" />
                   </button>
                </div>
              </motion.div>
            )}

            {status === 'deleting' && (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
              </div>
            )}

            {status === 'error' && (
              <p className="text-rose-300 font-bold text-sm">
                Couldn't delete 😢
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HOVER CONTENT (Only visible when NOT interacting) --- */}
      {status === 'idle' && (
        <>
          {/* Title Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-rose-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
            <p className="text-white font-medium truncate text-sm translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              {image.title || "Untitled Memory"}
            </p>
          </div>

          {/* Trash Button */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            <button
              onClick={handleDeleteClick}
              className="bg-white/90 hover:bg-rose-50 text-rose-400 hover:text-rose-600 p-2 rounded-full shadow-lg backdrop-blur-sm transition-all hover:scale-110"
              title="Delete image"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}