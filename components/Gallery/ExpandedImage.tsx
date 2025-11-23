'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { getComments, addComment, deleteComment } from '@/app/actions';
import { X, Trash2, Send, MessageCircle, Smile } from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

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
  const [showEmoji, setShowEmoji] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [nickname, setNickname] = useState('Guest');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      const data = await getComments(image.id);
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

  const onEmojiClick = (emojiData: EmojiClickData) => {
      setCommentText((prev) => prev + emojiData.emoji);
  };

  return (
    <div className="fixed inset-0 z-500000 flex items-center justify-center px-2 md:px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        layoutId={`card-${image.id}`}
        className="relative w-full max-w-5xl h-[82vh] md:h-[85vh] bg-background rounded-xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row z-10"
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 md:top-4 md:right-4 z-50 p-1.5 md:p-2 bg-white/50 hover:bg-white rounded-full transition-colors"
        >
          <X className="w-5 h-5 md:w-6 md:h-6 text-black" />
        </button>

        {/* Image Section: 35% height on mobile, full height on desktop */}
        <div className="w-full md:w-2/3 h-[35%] md:h-full bg-black flex items-center justify-center relative group">
           <motion.img
            layoutId={`image-${image.id}`}
            src={image.url}
            alt={image.alt_text || image.title || "Gallery detail"}
            className="w-full h-full object-contain"
          />

          {image.title && (
            <div className="absolute top-0 left-0 right-0 p-6 bg-linear-to-b from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none hidden md:block">
              <h3 className="text-white font-[Gilroy] text-xl font-bold tracking-wide">
                {image.title}
              </h3>
            </div>
          )}
        </div>

        {/* Sidebar: 65% height on mobile, full height on desktop */}
        <div className="w-full md:w-1/3 h-[65%] md:h-full flex flex-col bg-background border-l border-main">
          
          {/* Details Header */}
          <div className="p-3 md:p-6 border-b border-main shrink-0">
            <h2 className="font-[Gilroy] text-xs md:text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Details</h2>
            
            {image.title && (
                <h1 className="font-[Gilroy] text-lg md:text-2xl font-bold text-accent mb-1 md:mb-2 leading-tight wrap-break-word hyphens-auto">
                    {image.title}
                </h1>
            )}

            <p className="text-gray-600 text-[10px] md:text-xs">
              Posted on {new Date(image.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4 min-h-0">
            {loading ? (
              <p className="text-center text-accent">Loading comments...</p>
            ) : comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <MessageCircle className="w-8 h-8 md:w-10 md:h-10 mb-2 opacity-20" />
                <p className="text-sm md:text-base">No comments yet.</p>
              </div>
            ) : (
              comments.map((comment) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={comment.id}
                  className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-main"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-accent text-xs md:text-sm block">
                        {comment.user_name}
                      </span>
                      <p className="text-gray-800 mt-0.5 md:mt-1 text-xs md:text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                    
                    {isAdmin && (
                      <button 
                        onClick={() => handleDelete(comment.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Form Area */}
          <div className="p-3 md:p-6 py-2 md:py-6 bg-white border-t border-main shrink-0">
            <form onSubmit={handlePostComment} className="flex flex-col gap-2 md:gap-3">
              <div className="flex gap-2 items-center">
                <span className="self-center text-xs md:text-sm text-gray-500">Name:</span>
                <input
                  type="text"
                  placeholder="Nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="flex-1 md:w-1/3 p-2 text-xs md:text-sm bg-background rounded-lg border border-main focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div className="relative">
                 <AnimatePresence>
                  {showEmoji && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.9 }}
                      className="absolute bottom-full left-0 md:bottom-40 z-50 shadow-2xl rounded-2xl overflow-hidden mb-2"
                    >
                      <EmojiPicker 
                          onEmojiClick={onEmojiClick} 
                          theme={Theme.LIGHT}
                          searchDisabled
                          width={300}
                          height={350}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Hidden on mobile, visible on desktop */}
                <button 
                    type="button"
                    onClick={() => setShowEmoji(!showEmoji)}
                    className="hidden md:block p-2.5 rounded-full hover:bg-main text-accent transition-colors mb-2"
                >
                    <Smile size={22} />
                </button>

                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full p-3 pr-10 text-sm bg-background rounded-xl border border-main focus:outline-none focus:ring-1 focus:ring-accent resize-none h-16 md:h-20"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !commentText.trim()}
                  className="absolute bottom-3 right-3 p-1.5 md:p-2 bg-accent text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}