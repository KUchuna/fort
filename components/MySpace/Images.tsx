"use client"

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageOff, Trash2, Loader2, X, Check, MessageCircle, Send, User, AlertCircle } from "lucide-react";
import { deleteImage, getComments, addComment, deleteComment } from "@/app/actions";
import Image from "next/image";

// --- Types ---
interface GalleryImage {
  id: number;
  url: string;
  pathname: string; 
  title?: string | null;
  blur_data_url?: string; 
}

interface Comment {
  id: number;
  image_id: number;
  user_name: string;
  content: string;
  created_at: string;
}

// --- MAIN COMPONENT ---
export default function Images({ images }: { images: GalleryImage[] }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Find the full object of the selected image
  const selectedImage = images?.find(img => img.id === selectedId);

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
    <>
      {/* GRID VIEW */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 w-full">
        {images.map((image, index) => (
          <ImageCard 
            key={image.id} 
            image={image} 
            index={index} 
            onClick={() => setSelectedId(image.id)}
          />
        ))}
      </div>

      {/* EXPANDED MODAL VIEW */}
      <AnimatePresence>
        {selectedId && selectedImage && (
          <ExpandedView 
            image={selectedImage} 
            onClose={() => setSelectedId(null)} 
          />
        )}
      </AnimatePresence>
    </>
  )
}

// --- SUB-COMPONENT: GRID CARD ---
function ImageCard({ image, index, onClick }: { image: GalleryImage, index: number, onClick: () => void }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsConfirming(true);
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await deleteImage(image.id, image.pathname);
    } catch (error) {
      console.error(error);
      setIsDeleting(false);
      setIsConfirming(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsConfirming(false);
  };

  return (
    <motion.div
      layout // <--- AUTOMAGICALLY ANIMATES POSITION CHANGES
      layoutId={`card-${image.id}`}
      initial={{ opacity: 0, scale: 0.9 }} // Simplified entry (removed Y offset)
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }} // Smooth exit for deletion
      transition={{ 
        duration: 0.3,
        layout: { type: "spring", stiffness: 300, damping: 30 } // Snap neighbours into place
      }}
      onClick={!isConfirming ? onClick : undefined}
      className="group relative aspect-square rounded-3xl overflow-hidden bg-white border-4 border-white shadow-md hover:shadow-xl hover:shadow-pink-200/50 transition-all duration-300 cursor-pointer z-0"
    >
      <Image 
        src={image.url} 
        alt={image.title || "Gallery image"}
        className="object-cover transition-transform duration-700 group-hover:scale-110"
        fill
        sizes="(max-width: 768px) 50vw, 33vw"
      />
      
      {/* Hover Overlay (Only visible if NOT confirming delete) */}
      {!isConfirming && (
        <div className="absolute inset-0 bg-gradient-to-t from-rose-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <p className="text-white font-medium truncate text-sm translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            {image.title || "Untitled Memory"}
          </p>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1 text-white/80 text-xs">
               <MessageCircle className="w-3 h-3" /> <span>View</span>
            </div>
            {/* Trash Button Trigger */}
            <button 
              onClick={handleDeleteClick}
              className="bg-white/20 hover:bg-red-500 hover:text-white text-white p-1.5 rounded-full backdrop-blur-md transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION OVERLAY */}
      <AnimatePresence>
        {isConfirming && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-rose-950/80 p-4 text-center"
            onClick={(e) => e.stopPropagation()} 
          >
            {isDeleting ? (
               <Loader2 className="w-8 h-8 text-white animate-spin" />
            ) : (
              <motion.div 
                initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                className="space-y-3"
              >
                <p className="text-white font-bold text-sm drop-shadow-md">
                  Delete this memory?
                </p>
                <div className="flex gap-3 justify-center">
                   <button 
                     onClick={handleCancel}
                     className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-md transition-colors"
                   >
                     <X className="w-5 h-5" />
                   </button>
                   <button 
                     onClick={handleConfirmDelete}
                     className="p-2 rounded-full bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/40 transition-colors"
                   >
                     <Trash2 className="w-5 h-5" />
                   </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
// --- SUB-COMPONENT: EXPANDED MODAL ---
function ExpandedView({ image, onClose }: { image: GalleryImage, onClose: () => void }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  
  // Delete Image State
  const [deleteConfirmStep, setDeleteConfirmStep] = useState<'idle' | 'confirming' | 'deleting'>('idle');

  // New Comment State
  const [newComment, setNewComment] = useState("");
  const [username, setUsername] = useState("Guest");
  const [isPosting, setIsPosting] = useState(false);
  const [isUsernameEditing, setIsUsernameEditing] = useState(false);

  // Load Comments
  useEffect(() => {
    const load = async () => {
      setIsLoadingComments(true);
      try {
        const data = await getComments(image.id);
        setComments(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingComments(false);
      }
    };
    load();
  }, [image.id]);

  // Handle Delete Image Logic
  const handleDeleteImage = async () => {
    if (deleteConfirmStep === 'idle') {
      setDeleteConfirmStep('confirming');
      // Auto-reset after 3 seconds if not confirmed
      setTimeout(() => setDeleteConfirmStep(current => current === 'confirming' ? 'idle' : current), 3000);
      return;
    }

    if (deleteConfirmStep === 'confirming') {
      setDeleteConfirmStep('deleting');
      await deleteImage(image.id, image.pathname);
      onClose();
    }
  };

  // Handle Add Comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newComment.trim()) return;

    setIsPosting(true);
    try {
      await addComment(image.id, newComment, username);
      const data = await getComments(image.id);
      setComments(data);
      setNewComment("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsPosting(false);
    }
  };

  // Handle Delete Comment
  const handleDeleteComment = async (commentId: number) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
    await deleteComment(commentId);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-500 flex items-center justify-center p-4 md:p-8 bg-rose-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        layoutId={`card-${image.id}`}
        className="bg-white w-full max-w-5xl h-[85vh] rounded-[40px] overflow-hidden flex flex-col md:flex-row shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* LEFT: IMAGE */}
        <div className="relative w-full md:w-[60%] h-[40%] md:h-full bg-black group">
          <Image 
            src={image.url} 
            alt={image.title || "Detail"} 
            fill 
            className="object-contain md:object-cover"
            priority
          />
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition-colors md:hidden"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <h2 className="text-white text-2xl font-bold">{image.title || "Untitled"}</h2>
            <div className="flex gap-3 mt-2">
               {/* Smart Delete Button */}
               <button 
                onClick={handleDeleteImage}
                className={`
                  text-sm flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300
                  ${deleteConfirmStep === 'idle' 
                    ? 'text-rose-300 hover:text-rose-100 hover:bg-white/10' 
                    : 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'}
                `}
               >
                 {deleteConfirmStep === 'deleting' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                 ) : deleteConfirmStep === 'confirming' ? (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      <span>Click again to confirm</span>
                    </>
                 ) : (
                    <>
                      <Trash2 className="w-4 h-4" /> 
                      <span>Delete Picture</span>
                    </>
                 )}
               </button>
            </div>
          </div>
        </div>

        {/* RIGHT: COMMENTS */}
        <div className="flex-1 flex flex-col bg-rose-50/50 h-full">
          {/* Header */}
          <div className="p-6 border-b border-rose-100 bg-white flex justify-between items-center">
            <h3 className="font-bold text-rose-900 flex items-center gap-2">
              Comments <span className="bg-rose-100 text-rose-600 text-xs px-2 py-0.5 rounded-full">{comments.length}</span>
            </h3>
            <button onClick={onClose} className="hidden md:block text-rose-300 hover:text-rose-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {isLoadingComments ? (
              <div className="flex justify-center pt-10"><Loader2 className="animate-spin text-pink-400" /></div>
            ) : comments.length === 0 ? (
              <div className="text-center text-rose-300 pt-10 italic">Be the first to show some love! 💕</div>
            ) : (
              comments.map(comment => (
                <motion.div 
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-300 to-rose-400 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {comment.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-sm border border-rose-100 group-hover:border-rose-200 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-rose-900 text-xs">{comment.user_name}</span>
                        <button 
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-rose-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-slate-700">{comment.content}</p>
                    </div>
                    <span className="text-[10px] text-rose-300 pl-2">
                      {new Date(comment.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-rose-100">
            {/* Username Setter */}
            <div className="flex items-center gap-2 mb-3 px-1">
               <User className="w-3 h-3 text-rose-400" />
               {isUsernameEditing ? (
                 <input 
                    autoFocus
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onBlur={() => setIsUsernameEditing(false)}
                    className="text-xs border-b border-rose-300 outline-none text-rose-600 bg-transparent"
                 />
               ) : (
                 <span 
                  onClick={() => setIsUsernameEditing(true)}
                  className="text-xs font-semibold text-rose-500 cursor-pointer hover:underline"
                 >
                   {username}
                 </span>
               )}
               <span className="text-[10px] text-rose-300">(click name to change)</span>
            </div>

            <form onSubmit={handlePostComment} className="flex gap-2">
              <input 
                type="text" 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a lovely comment..."
                className="flex-1 bg-rose-50 border border-rose-100 rounded-full px-4 py-2 text-sm outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 transition-all"
              />
              <button 
                disabled={isPosting || !newComment.trim()}
                type="submit"
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-400 to-pink-500 text-white flex items-center justify-center shadow-md shadow-pink-500/20 hover:scale-105 disabled:opacity-50 disabled:scale-100 transition-all"
              >
                {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}