'use client'

import { useEffect, useState, useRef } from 'react';
import Pusher from 'pusher-js';
import { getChatHistory, sendMessage } from '@/app/actions';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, Loader2 } from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

export default function LiveChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [isSending, setIsSending] = useState(false); // The Lock
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe('global-chat');

    getChatHistory().then(history => {
        setMessages(history);
    });

    channel.bind('new-message', (data: any) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      pusher.unsubscribe('global-chat');
    };
  }, []);

  // --- ⚡️ FIXED SUBMIT LOGIC ---
  const handleOnSubmit = async (e: React.FormEvent) => {
    // 1. STOP the browser from reloading or submitting natively
    e.preventDefault(); 

    // 2. HARD CHECK: If lock is active, do absolutely nothing
    if (isSending || !inputText.trim()) return;

    // 3. ACTIVATE LOCK
    setIsSending(true);
    setShowEmoji(false);

    // 4. Snapshot text and clear UI
    const textToSend = inputText;
    setInputText(""); 

    try {
        // 5. Manually create FormData (since we aren't using 'action' anymore)
        const formData = new FormData();
        formData.append('text', textToSend);
        
        await sendMessage(formData);
    } catch (error) {
        console.error("Failed to send:", error);
        setInputText(textToSend); 
    } finally {
        // 6. RELEASE LOCK
        setIsSending(false);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setInputText((prev) => prev + emojiData.emoji);
  };

  return (
    <div className="w-full max-w-md mx-auto font-[family-name:var(--font-gilroy)]">
      <div className="relative border border-[var(--color-accent)] rounded-3xl overflow-hidden bg-[var(--color-background)] shadow-xl shadow-[var(--color-accent)]/20 h-[500px] flex flex-col">
        
        {/* --- Header --- */}
        <div className="bg-[var(--color-main)] p-4 border-b border-[var(--color-accent)]/30 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
              <span className="text-black font-bold tracking-wide">Live Chat</span>
           </div>
           <span className="text-[10px] uppercase tracking-widest text-black/50">Online</span>
        </div>

        {/* --- Chat Area --- */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[var(--color-accent)] scrollbar-track-transparent">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="flex flex-col items-start"
              >
                <span className="text-[10px] font-bold text-[var(--color-accent)] ml-1 mb-1 uppercase tracking-wider">
                  {msg.username}
                </span>
                <div className="bg-white border border-[var(--color-main)] px-4 py-2.5 rounded-2xl rounded-tl-none text-sm text-black shadow-sm max-w-[85%] break-words whitespace-pre-wrap">
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* --- Input Area --- */}
        <div className="bg-white/60 backdrop-blur-md border-t border-[var(--color-main)] p-3 relative">
          
          <AnimatePresence>
            {showEmoji && (
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                className="absolute bottom-20 left-4 z-50 shadow-2xl rounded-2xl overflow-hidden"
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

          {/* CHANGED HERE: onSubmit instead of action */}
          <form onSubmit={handleOnSubmit} className="flex gap-2 items-center">
            <button 
                type="button"
                onClick={() => setShowEmoji(!showEmoji)}
                className="p-2.5 rounded-full hover:bg-[var(--color-main)] text-[var(--color-accent)] transition-colors"
            >
                <Smile size={22} />
            </button>

            <input 
              name="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isSending}
              className="flex-1 bg-[var(--color-background)] rounded-2xl px-4 py-3 text-sm text-black placeholder:text-black/30 outline-none border border-transparent focus:border-[var(--color-accent)] transition-all disabled:opacity-50"
              placeholder={isSending ? "Sending..." : "Type something..."}
              autoComplete="off"
            />
            
            <button 
                type="submit" 
                disabled={!inputText.trim() || isSending}
                className="bg-[var(--color-accent)] hover:brightness-110 text-white p-3 rounded-full shadow-md shadow-[var(--color-accent)]/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-12 h-12"
            >
              {isSending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} className="ml-0.5" /> 
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}