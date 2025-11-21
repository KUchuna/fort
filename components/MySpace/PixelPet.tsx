'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

// --- TYPES ---
type PetState = 'idle' | 'sleeping' | 'dancing' | 'eating' | 'sad';
type Heart = { id: number; x: number; y: number };
type Snack = { id: number; icon: string; x: number; y: number; value: number };

// Dialogue Types
type DialogueOption = {
  label: string;
  reply: string;
  reaction?: PetState;
  triggerHearts?: boolean;
  statBoost?: boolean;
};

type Question = {
  text: string;
  options: DialogueOption[];
};

// --- DATA ---
const SNACKS = [
    { icon: "🍒", value: 10 }, 
    { icon: "🍰", value: 20 }, 
    { icon: "🧋", value: 15 }, 
    { icon: "🍕", value: 30 }, 
    { icon: "🍪", value: 10 }
];

const IDLE_PHRASES = [
  "Just chilling... 🌸", "So quiet today.", "Is it coffee time?", 
  "La la la...", "Waiting for a banger!", "Hello Tamar! ✨", 
  "Nice cursor! 🖱️"
];

const QUESTIONS: Question[] = [
  {
    text: "How are you feeling?",
    options: [
      { label: "Great! ✨", reply: "Yay! I'm happy too!", reaction: 'dancing', triggerHearts: true, statBoost: true },
      { label: "Tired 😴", reply: "Aww, take a break soon?", reaction: 'sleeping' },
    ]
  },
  {
    text: "Do you like my bow?",
    options: [
      { label: "It's cute! 🎀", reply: "I know right?! Thanks!", reaction: 'dancing', triggerHearts: true, statBoost: true },
      { label: "It's okay.", reply: "Oh... okay.", reaction: 'idle' },
    ]
  },
  {
    text: "Should we listen to music?",
    options: [
      { label: "Yes! 🎵", reply: "Drop the beat!!", reaction: 'dancing', triggerHearts: true, statBoost: true },
      { label: "Silence pls", reply: "Shh... quiet mode.", reaction: 'sleeping' },
    ]
  }
];

export default function PixelPet({ isMusicPlaying }: { isMusicPlaying: boolean }) {
  // --- STATE ---
  const [state, setState] = useState<PetState>('idle');
  
  // VITALS (0 to 100)
  const [hunger, setHunger] = useState(20); // 0 = Full, 100 = Starving
  const [happiness, setHappiness] = useState(80); // 0 = Depressed, 100 = Ecstatic

  // SPEECH
  const [displayedText, setDisplayedText] = useState(""); 
  const [fullText, setFullText] = useState(""); 
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // PHYSICS & UTILS
  const [isFacingRight, setIsFacingRight] = useState(true);
  const [hearts, setHearts] = useState<Heart[]>([]);
  const [snacks, setSnacks] = useState<Snack[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const constraintsRef = useRef(null);
  const petRef = useRef<HTMLDivElement>(null);
  
  // --- DRAG STATE REF ---
  const isDraggingRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- 1. VITALS LOGIC (The Game Loop) ---
  useEffect(() => {
    const timer = setInterval(() => {
        if (state === 'sleeping') return; // Stats don't decay when sleeping

        setHunger(prev => Math.min(prev + 1, 100)); // Get hungry (+1 every 5s)
        setHappiness(prev => Math.max(prev - 1, 0)); // Get bored (-1 every 5s)

        // Complain if needs are critical
        if (hunger > 80 && Math.random() > 0.8) speak("I'm so hungry... 🍩");
        if (happiness < 20 && Math.random() > 0.8) speak("Pay attention to me! 🥺");

    }, 5000); // Run every 5 seconds
    return () => clearInterval(timer);
  }, [state, hunger, happiness]);

  // --- 2. MUSIC SYNC (With Mood Check) ---
  useEffect(() => {
    if (state === 'sleeping' || state === 'eating') return;

    // If starving or depressed, refuse to dance!
    if (isMusicPlaying) {
        if (hunger > 90) {
            setState('sad');
            if (!isBubbleVisible) speak("Too hungry to dance...");
        } else if (happiness < 10) {
            setState('sad');
            if (!isBubbleVisible) speak("Not in the mood...");
        } else if (state !== 'dancing') {
            setState('dancing'); 
            spawnHearts(3);
        }
    } else if (!isMusicPlaying && state === 'dancing') {
        setState('idle');
    }
  }, [isMusicPlaying, state, hunger, happiness, isBubbleVisible]);

  // --- 3. SPEECH SYSTEM ---
  useEffect(() => {
    if (displayedText.length < fullText.length) {
      setIsTyping(true);
      typingTimeoutRef.current = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1));
      }, 30); 
    } else {
      setIsTyping(false);
      if (!activeQuestion && isBubbleVisible) {
         setTimeout(() => {
             setIsBubbleVisible(false);
             setDisplayedText(""); 
         }, 3000);
      }
    }
    return () => { if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); };
  }, [displayedText, fullText, activeQuestion, isBubbleVisible]);

  const speak = useCallback((text: string, question: Question | null = null) => {
    setDisplayedText(""); 
    setFullText(text);    
    setActiveQuestion(question);
    setIsBubbleVisible(true);
  }, []);

  // --- 4. HANDLE ANSWER ---
  const handleAnswer = (option: DialogueOption) => {
      speak(option.reply, null); 
      
      if (option.triggerHearts) spawnHearts(5);
      if (option.statBoost) setHappiness(prev => Math.min(prev + 20, 100)); // Boost happiness!

      if (option.reaction) {
          const oldState = state;
          setState(option.reaction);
          setTimeout(() => {
            if (isMusicPlaying && option.reaction !== 'dancing') setState('dancing');
            else if (!isMusicPlaying && option.reaction !== 'idle') setState('idle');
          }, 2000);
      }
  };

  // --- 5. FEEDING & SNACKS ---
  const spawnSnack = (snackData: { icon: string, value: number }) => {
    setSnacks(prev => [...prev, { ...snackData, id: Date.now(), x: window.innerWidth/2, y: window.innerHeight/2 }]);
  };

  const handleSnackDrop = (snackId: number, info: PanInfo, value: number) => {
    if (!petRef.current) return;
    const petRect = petRef.current.getBoundingClientRect();
    const hit = info.point.x >= petRect.left && info.point.x <= petRect.right && 
                info.point.y >= petRect.top && info.point.y <= petRect.bottom;
    if (hit) {
        setSnacks(prev => prev.filter(s => s.id !== snackId));
        spawnHearts(6);
        speak("Yummy! 😋"); 
        
        // Restore Stats
        setHunger(prev => Math.max(prev - value, 0)); 
        setHappiness(prev => Math.min(prev + 5, 100)); // Good food makes happy

        setState('eating');
        setTimeout(() => setState(prev => prev === 'eating' ? (isMusicPlaying ? 'dancing' : 'idle') : prev), 1500);
    }
  };

  // --- 6. MOUSE & INTERACTION ---
  const handleInteract = () => {
    spawnHearts(5); 
    // Interaction boosts happiness slightly
    setHappiness(prev => Math.min(prev + 5, 100));

    if (state === 'sleeping') {
      setState(isMusicPlaying ? 'dancing' : 'idle');
      speak("Good morning! ☀️");
    } else {
      setState('sleeping');
      speak("Goodnight... 💤");
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!petRef.current) return;
      const rect = petRef.current.getBoundingClientRect();
      setIsFacingRight(e.clientX > (rect.left + rect.width / 2));
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const spawnHearts = (count: number = 1) => {
    const newHearts = Array.from({ length: count }).map(() => ({
      id: Date.now() + Math.random(),
      x: (Math.random() - 0.5) * 40, y: -20 - Math.random() * 30
    }));
    setHearts(prev => [...prev, ...newHearts]);
    setTimeout(() => setHearts(prev => prev.slice(count)), 1000);
  };

  // Random chatter loop
  useEffect(() => {
    const interval = setInterval(() => {
        if (isBubbleVisible || state === 'sleeping') return;
        const roll = Math.random();
        if (roll > 0.85) { 
             const randomQ = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
             speak(randomQ.text, randomQ);
        } else if (roll > 0.6) {
             const randomPhrase = IDLE_PHRASES[Math.floor(Math.random() * IDLE_PHRASES.length)];
             speak(randomPhrase);
        }
    }, 6000);
    return () => clearInterval(interval);
  }, [isBubbleVisible, state, speak]);


  // --- CONFIG ---
  const spriteConfig = {
    idle: { row: 0, steps: 3, speed: 0.8 },
    dancing: { row: 1, steps: 3, speed: 0.5 },
    sleeping: { row: 2, steps: 3, speed: 1.5 },
    eating: { row: 1, steps: 3, speed: 0.2 },
    sad: { row: 0, steps: 1, speed: 0 }, 
  };
  const currentAnim = spriteConfig[state];
  const yPosition = `${currentAnim.row * 50}%`;

  return (
    <>
      {/* MENU with STATS */}
      <div className="fixed top-24 right-4 flex flex-col items-end gap-2 z-[60]">
         <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-[10px] uppercase font-bold text-pink-500 bg-white/90 rounded-lg py-2 px-3 shadow border-2 border-pink-100 hover:scale-105 active:scale-95 transition">
            {isMenuOpen ? "Close ✖" : "Caretaker Menu 🍒"}
         </button>
         <AnimatePresence>
            {isMenuOpen && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-3 p-3 bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 w-40">
                    
                    {/* STATS BARS */}
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] font-bold text-pink-600">
                            <span>Hunger</span> <span>{hunger}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-500 ${hunger > 80 ? 'bg-red-400' : 'bg-orange-300'}`} 
                                style={{ width: `${hunger}%` }}
                            ></div>
                        </div>

                        <div className="flex justify-between text-[10px] font-bold text-pink-600 mt-1">
                            <span>Happiness</span> <span>{happiness}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-pink-400 rounded-full transition-all duration-500" 
                                style={{ width: `${happiness}%` }}
                            ></div>
                        </div>
                    </div>
                    
                    <hr className="border-pink-100" />

                    {/* FOOD BUTTONS */}
                    <div className="flex flex-wrap gap-2 justify-center">
                        {SNACKS.map((snack, i) => (
                            <motion.button key={snack.icon} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} onClick={() => spawnSnack(snack)} className="w-8 h-8 bg-white shadow rounded-full text-lg hover:scale-110">
                                {snack.icon}
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            )}
         </AnimatePresence>
      </div>

      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {/* SNACKS IN WORLD */}
        <AnimatePresence>
            {snacks.map(snack => (
                <motion.div key={snack.id} drag dragConstraints={constraintsRef} whileDrag={{ scale: 1.3 }} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} onDragEnd={(e, info) => handleSnackDrop(snack.id, info, snack.value)} className="absolute pointer-events-auto text-4xl z-[55] cursor-grab">{snack.icon}</motion.div>
            ))}
        </AnimatePresence>

        {/* PET */}
        <motion.div
          ref={petRef}
          drag 
          dragConstraints={constraintsRef} 
          dragMomentum={false}
          // 1. TRACK DRAG START
          onDragStart={() => { isDraggingRef.current = true; }}
          // 2. TRACK DRAG END (with delay to clear click event)
          onDragEnd={() => { setTimeout(() => { isDraggingRef.current = false; }, 150); }}
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }}
          className="absolute bottom-4 left-10 w-24 h-24 pointer-events-auto cursor-grab active:cursor-grabbing"
        >
          {/* Hearts */}
          <div className="absolute inset-0 pointer-events-none flex justify-center items-center z-40">
            <AnimatePresence>
                {hearts.map(h => (
                    <motion.div key={h.id} initial={{ opacity: 1, scale: 0.5 }} animate={{ opacity: 0, scale: 1.5, y: -50 }} exit={{ opacity: 0 }} className="absolute text-xl">💖</motion.div>
                ))}
            </AnimatePresence>
          </div>

          {/* Bubble */}
          <AnimatePresence>
            {isBubbleVisible && (
                <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.8 }}
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute ${activeQuestion && !isTyping ? "-top-25" : "-top-10"} bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-bold p-3 rounded-2xl shadow-xl border-2 border-pink-200 min-w-[120px] max-w-[200px] z-50 cursor-default`}
                    style={{ transformOrigin: "bottom right" }} 
                >
                    <div className="mb-2 whitespace-pre-wrap leading-tight text-center">
                        {displayedText}
                        {isTyping && <span className="animate-pulse text-pink-500">|</span>}
                    </div>

                    {activeQuestion && !isTyping && (
                        <div className="flex flex-col gap-1 mt-2">
                             {activeQuestion.options.map((opt, idx) => (
                                 <button key={idx} onClick={(e) => { e.stopPropagation(); handleAnswer(opt); }} className="bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-200 rounded px-2 py-1 text-[10px] transition-colors text-center">{opt.label}</button>
                             ))}
                        </div>
                    )}
                    <div className="absolute -bottom-2 right-6 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-pink-200"></div>
                </motion.div>
            )}
          </AnimatePresence>

          {/* Sprite */}
          <motion.div 
            animate={state === 'dancing' ? { y: [0, -8, 0] } : { y: 0 }} 
            transition={state === 'dancing' ? { repeat: Infinity, duration: 0.4 } : {}} 
            className="w-full h-full touch-none"
            // 3. CLICK CHECK IS HERE
            onClick={(e) => { 
                e.stopPropagation(); 
                if (isDraggingRef.current) return; // <--- STOP if dragging
                handleInteract(); 
            }}
          >
             <div key={state} className="w-full h-full" style={{ backgroundImage: "url('/sprite/pet.png')", backgroundRepeat: 'no-repeat', backgroundSize: '400% 300%', backgroundPositionY: yPosition, imageRendering: 'pixelated', transform: isFacingRight ? 'scaleX(1)' : 'scaleX(-1)', animation: `playRow ${currentAnim.speed}s steps(${currentAnim.steps}) infinite alternate` }} />
          </motion.div>
        </motion.div>
      </div>
      <style jsx global>{` @keyframes playRow { from { background-position-x: 0%; } to { background-position-x: 100%; } } `}</style>
    </>
  );
}