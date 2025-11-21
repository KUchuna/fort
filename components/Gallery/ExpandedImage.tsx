'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { getComments, addComment, deleteComment } from '@/app/actions';
import { X, Trash2, Send, MessageCircle } from 'lucide-react';
// import { GalleryImage, Comment } from '@/types'; // Uncomment if you moved types to a separate file

interface GalleryImage {
  id: number;
  url: string;
  title: string | null;
  created_at: string;
  pathname: string; 
  comment_count?: number;
  alt_text: string;
  width: number;
  height: number;
  blur_data_url: string;
  likes_count: number;
}

interface Comment {
  id: number;
  image_id: number;
  user_name: string;
  content: string;
  created_at: Date | string;
}

interface ExpandedImageProps {
  image: GalleryImage;
  isAdmin: boolean;
  onClose: () => void;
}

export default function ExpandedImage({ image, isAdmin, onClose }: ExpandedImageProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [commentText, setCommentText] = useState('');
  const [nickname, setNickname] = useState('Guest');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      const data = await getComments(image.id);
      // Actions usually return Dates, but strict typing here helps
      setComments(data as unknown as Comment[]); 
      setLoading(false);
    };
    fetchComments();
  }, [image.id]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    setIsSubmitting(true);
    await addComment(image.id, commentText, nickname);
    
    const newComments = await getComments(image.id);
    setComments(newComments as unknown as Comment[]);
    setCommentText('');
    setIsSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    await deleteComment(id);
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        layoutId={`card-${image.id}`}
        className="relative w-full max-w-5xl h-[85vh] bg-[var(--color-background)] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row z-10"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-white/50 hover:bg-white rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-black" />
        </button>

        {/* Image Section */}
        <div className="w-full md:w-2/3 h-1/2 md:h-full bg-black flex items-center justify-center relative group">
           <motion.img
            layoutId={`image-${image.id}`}
            src={image.url}
            // Use fallback if title/alt_text is null
            alt={image.alt_text || image.title || "Gallery detail"}
            className="w-full h-full object-contain"
          />

          {image.title && (
            <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <h3 className="text-white font-[Gilroy] text-xl font-bold tracking-wide">
                {image.title}
              </h3>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-1/3 h-1/2 md:h-full flex flex-col bg-[var(--color-background)] border-l border-[var(--color-main)]">
          
          <div className="p-6 border-b border-[var(--color-main)] shrink-0">
            <h2 className="font-[Gilroy] text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Details</h2>
            
            {image.title && (
                <h1 className="font-[Gilroy] text-2xl font-bold text-[var(--color-accent)] mb-2 leading-tight break-words hyphens-auto">
                    {image.title}
                </h1>
            )}

            <p className="text-gray-600 text-xs">
              Posted on {new Date(image.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
            {loading ? (
              <p className="text-center text-[var(--color-accent)]">Loading comments...</p>
            ) : comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <MessageCircle className="w-10 h-10 mb-2 opacity-20" />
                <p>No comments yet.</p>
              </div>
            ) : (
              comments.map((comment) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={comment.id}
                  className="bg-white p-4 rounded-xl shadow-sm border border-[var(--color-main)]"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-[var(--color-accent)] text-sm block">
                        {comment.user_name}
                      </span>
                      <p className="text-gray-800 mt-1 text-sm leading-relaxed break-words whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                    
                    {isAdmin && (
                      <button 
                        onClick={() => handleDelete(comment.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <div className="p-6 bg-white border-t border-[var(--color-main)] shrink-0">
            <form onSubmit={handlePostComment} className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-1/3 p-2 text-sm bg-[var(--color-background)] rounded-lg border border-[var(--color-main)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                />
              </div>
              <div className="relative">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full p-3 pr-10 text-sm bg-[var(--color-background)] rounded-xl border border-[var(--color-main)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] resize-none h-20"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !commentText.trim()}
                  className="absolute bottom-3 right-3 p-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}