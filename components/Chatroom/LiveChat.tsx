'use client'

import { useEffect, useState, useRef } from 'react';
import Pusher from 'pusher-js';
import { getChatHistory, sendMessage, setNickname } from '@/app/actions';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, Loader2, User, X, Sparkles } from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

export default function LiveChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempNickname, setTempNickname] = useState("");
  
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

    getChatHistory().then(history => setMessages(history));

    channel.bind('new-message', (data: any) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      pusher.unsubscribe('global-chat');
    };
  }, []);

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
      
      {/* --- NICKNAME MODAL --- */}
      <AnimatePresence>
        {showNameModal && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowNameModal(false)}
                    className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-3xl"
                />
                
                {/* Modal Content */}
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white w-full max-w-xs p-6 rounded-3xl shadow-2xl relative z-10 border border-accent"
                >
                    <button onClick={() => setShowNameModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                        <X size={18} />
                    </button>

                    <div className="flex flex-col items-center mb-4">
                        <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center mb-2">
                            <Sparkles size={20} className="text-accent" />
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
                            className="w-full bg-backgroundtransparent focus:border-accent4 py-2 text-center text-sm outline-none transition-all"
                            autoFocus
                        />
                        <button type="submit" className="w-full bg-accentt-bold py-2 rounded-xl hover:brightness-110 transition-all text-sm shadow-md shadow-(--color-accent)/30">
                            Save Name
                        </button>
                    </form>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      <div className="relative border border-accent rounded-3xl overflow-hidden bg-background shadow-xl shadow-(--color-accent)/20 h-[500px] flex flex-col">
        
        {/* --- Header --- */}
        <div className="bg-main p-4 border-b border-accent/30 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
              <span className="text-black font-bold tracking-wide">Live Chat</span>
           </div>
           
           {/* --- NEW: SETTINGS BUTTON --- */}
           <button 
             onClick={() => setShowNameModal(true)}
             className="flex items-center gap-1.5 bg-white/40 hover:bg-white/60 px-3 py-1.5 rounded-full transition-all"
           >
              <User size={14} className="text-accent" />
              <span className="text-[10px] font-bold text-accentking-wider">
                Set Name
              </span>
           </button>
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
                <span className="text-[10px] font-bold text-accent ml-1 mb-1 uppercase tracking-wider">
                  {msg.username}
                </span>
                <div className="bg-white border border-mainunded-2xl rounded-tl-none text-sm text-black shadow-sm max-w-[85%] wrap-break-word whiwrap-break-word-wrap">
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* --- Input Area --- */}
        <div className="bg-white/60 backdrop-blur-md border-t border-main p-3 relative">
          
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
                className="p-2.5 rounded-full hover:bg-mainlor-accent)] transition-colors"
            >
                <Smile size={22} />
            </button>

            <input 
              name="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isSending}
              className="flex-1 bg-background rounded-2xl px-4 py-3 text-sm text-black placeholder:text-black/30 outline-none border border-transparent focus:border-accent transition-all disabled:opacity-50"
              placeholder={isSending ? "Sending..." : "Type something..."}
              autoComplete="off"
            />
            
            <button 
                type="submit" 
                disabled={!inputText.trim() || isSending}
                className="bg-accent hover:brightness-110 text-white p-3 rounded-full shadow-md shadow-(--color-accent)/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-12 h-12"
            >
              {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-0.5" />}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}