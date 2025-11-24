'use client'

import { useEffect, useState, useRef } from 'react';
import Pusher from 'pusher-js';
import { getChatHistory, sendMessage, setNickname } from '@/app/actions';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, Loader2, User, X, Sparkles, Volume2, VolumeX, Bell, BellRing } from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

const NOTIFICATION_SOUND = "/sounds/mixkit-elevator-tone-2863.wav";

export default function LiveChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempNickname, setTempNickname] = useState("");
  
  // Notification State
  const [isMuted, setIsMuted] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Check Permission on Mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
    audioRef.current = new Audio(NOTIFICATION_SOUND);
    audioRef.current.volume = 0.5;
  }, []);

  // 2. Function to Request Permission
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert("This browser does not support desktop notifications");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  // 3. Helper to Fire System Notification
  const sendSystemNotification = (user: string, text: string) => {
    if (permission === 'granted' && document.visibilityState === 'hidden') {
      const notification = new Notification(`New message from ${user}`, {
        body: text,
        icon: '/icon.png', // Add a valid icon path in your public folder if you want
        silent: isMuted, // The OS handles the sound if not muted
      });

      // Focus window when user clicks the notification
      notification.onclick = () => {
        window.focus();
        // Optional: specific logic to open chat modal if it was closed
      };
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe('global-chat');

    getChatHistory().then(history => {
        setMessages(history);
        setTimeout(scrollToBottom, 100);
    });

    channel.bind('new-message', (data: any) => {
      setMessages((prev) => {
        const isHidden = document.visibilityState === 'hidden';
        
        if (isHidden) {
            // A. Play Custom Sound (backup for OS sound)
            if (!isMuted && audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => {});
            }

            // B. Trigger System Notification
            sendSystemNotification(data.username, data.text);
            
            // C. Update Title
            document.title = `New Message from ${data.username}`;
        }

        return [...prev, data];
      });
    });

    // Reset title when coming back
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            document.title = "Live Chat";
        }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      pusher.unsubscribe('global-chat');
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [permission, isMuted]); // Re-bind if permission changes

  // ... (handleOnSubmit, handleNicknameSubmit, onEmojiClick logic remains the same)
  const handleOnSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (isSending || !inputText.trim()) return;
    setIsSending(true);
    setShowEmoji(false);
    const textToSend = inputText;
    setInputText(""); 
    try {
        const formData = new FormData();
        formData.append('text', textToSend);
        await sendMessage(formData);
        setTimeout(scrollToBottom, 100);
    } catch (error) {
        console.error("Failed to send:", error);
        setInputText(textToSend); 
    } finally {
        setIsSending(false);
    }
  };

  const handleNicknameSubmit = async (formData: FormData) => {
    await setNickname(formData);
    setShowNameModal(false);
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setInputText((prev) => prev + emojiData.emoji);
  };

  return (
    <div className="w-full max-w-md mx-auto font-gilroy relative">
      
      {/* ... (Nickname Modal Code remains same) ... */}
      <AnimatePresence>
        {showNameModal && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowNameModal(false)}
                    className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-3xl"
                />
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white w-full max-w-xs p-6 rounded-3xl shadow-2xl relative z-10 border border-[var(--color-accent)]"
                >
                    <button onClick={() => setShowNameModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                        <X size={18} />
                    </button>
                    <div className="flex flex-col items-center mb-4">
                        <div className="w-12 h-12 bg-[var(--color-background)] rounded-full flex items-center justify-center mb-2">
                            <Sparkles size={20} className="text-[var(--color-accent)]" />
                        </div>
                        <h3 className="font-bold text-lg text-black">Who are you?</h3>
                        <p className="text-xs text-gray-400">Pick a cute nickname</p>
                    </div>
                    <form action={handleNicknameSubmit} className="space-y-3">
                        <input 
                            name="nickname"
                            value={tempNickname}
                            onChange={(e) => setTempNickname(e.target.value)}
                            placeholder="e.g. Princess Peach"
                            className="w-full bg-[var(--color-background)] border border-transparent focus:border-[var(--color-accent)] rounded-xl px-4 py-2 text-center text-sm outline-none transition-all"
                            autoFocus
                        />
                        <button type="submit" className="w-full bg-[var(--color-accent)] text-white font-bold py-2 rounded-xl hover:brightness-110 transition-all text-sm shadow-md shadow-[var(--color-accent)]/30">
                            Save Name
                        </button>
                    </form>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      <div className="relative border border-[var(--color-accent)] rounded-3xl overflow-hidden bg-[var(--color-background)] shadow-xl shadow-[var(--color-accent)]/20 h-[500px] flex flex-col">
        
        {/* --- Header --- */}
        <div className="bg-[var(--color-main)] p-4 border-b border-[var(--color-accent)]/30 flex items-center justify-between z-20 relative">
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
              <span className="text-black font-bold tracking-wide">Live Chat</span>
           </div>
           
           <div className="flex items-center gap-2">
               {/* --- NOTIFICATION BUTTON --- */}
               {permission === 'default' && (
                 <button 
                   onClick={requestNotificationPermission}
                   className="p-2 hover:bg-white/40 rounded-full transition-colors text-[var(--color-accent)] animate-pulse"
                   title="Enable Notifications"
                 >
                   <BellRing size={16} />
                 </button>
               )}

               {/* --- MUTE BUTTON --- */}
               <button 
                 onClick={() => setIsMuted(!isMuted)}
                 className="p-2 hover:bg-white/40 rounded-full transition-colors text-[var(--color-accent)]"
               >
                 {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
               </button>

               <button 
                 onClick={() => setShowNameModal(true)}
                 className="flex items-center gap-1.5 bg-white/40 hover:bg-white/60 px-3 py-1.5 rounded-full transition-all"
               >
                 <User size={14} className="text-[var(--color-accent)]" />
                 <span className="text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-wider">
                   Set Name
                 </span>
               </button>
           </div>
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
        <div className="bg-white/60 backdrop-blur-md border-t border-[var(--color-main)] p-3 relative z-20">
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
              {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-0.5" />}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}