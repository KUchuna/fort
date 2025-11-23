'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

// --- TYPES ---
type PetState = 'idle' | 'sleeping' | 'dancing' | 'eating' | 'sad';
type Heart = { id: number; x: number; y: number };
type Particle = { id: number; x: number; y: number };
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

// --- DATA: Expanded Speech Variety ---
const SNACKS = [
    { icon: "🍒", value: 10 }, 
    { icon: "🍰", value: 20 }, 
    { icon: "🧋", value: 15 }, 
    { icon: "🍕", value: 30 }, 
    { icon: "🍪", value: 10 }
];

const IDLE_PHRASES = [
  "Just chilling... 🌸", 
  "So quiet today.", 
  "Is it coffee time, Tamar? ☕", 
  "La la la...", 
  "Waiting for a banger!", 
  "Hello Tamar! ✨", 
  "Nice cursor! 🖱️",
  "Tamar, you're doing great! 💖",
  "What are we building today?",
  "I love this song! 🎶",
  "Don't forget to drink water! 💧",
  "Tamar! Look at me! 👀",
  "Your website is so cool...",
  "Zzz... oh, hi Tamar!",
  "Can I have a treat? 🍪",
  "Is that a bug? Oh wait, it's a feature.",
  "I like your style! 👗",
  "Pixels are the best. 👾",
  "Do you need a break?",
];

const QUESTIONS: Question[] = [
  {
    text: "How are you feeling, Tamar?",
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
      { label: "Yes! 🎵", reply: "Drop the beat, Tamar!!", reaction: 'dancing', triggerHearts: true, statBoost: true },
      { label: "Silence pls", reply: "Shh... quiet mode.", reaction: 'sleeping' },
    ]
  },
  {
    text: "Working hard today?",
    options: [
      { label: "Yes, busy! 💻", reply: "You got this, Tamar! 💪", reaction: 'dancing', statBoost: true },
      { label: "Nope, relaxing.", reply: "Let's chill then. 🌸", reaction: 'idle' },
    ]
  },
  {
    text: "Who is your favorite pet?",
    options: [
      { label: "You are! 💖", reply: "I knew it! Love you Tamar! 🥰", reaction: 'dancing', triggerHearts: true, statBoost: true },
      { label: "My computer.", reply: "Rude... 😤", reaction: 'sad' },
    ]
  },
  {
    text: "Do you like this vibe?",
    options: [
      { label: "It's a vibe! ✨", reply: "Vibing with Tamar! ~", reaction: 'dancing', triggerHearts: true },
      { label: "Not really.", reply: "Aw, maybe next song.", reaction: 'idle' },
    ]
  }
];

// --- SUB-COMPONENT: Zzz Particle ---
const ZzzParticle = ({ x, y }: { x: number, y: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 0, x: 0, scale: 0.5 }}
      animate={{ opacity: [0, 1, 0], y: -30, x: Math.random() * 20 - 10, scale: 1.2 }}
      transition={{ duration: 2, ease: "easeOut" }}
      className="absolute text-blue-400 font-bold text-xs pointer-events-none z-[60]"
      style={{ left: x, top: y }}
    >
      Zzz...
    </motion.div>
  );

export default function PixelPet({ isMusicPlaying }: { isMusicPlaying: boolean }) {
  // --- STATE ---
  const [state, setState] = useState<PetState>('idle');
  
  // VITALS (0 to 100)
  const [hunger, setHunger] = useState(20); 
  const [happiness, setHappiness] = useState(80); 

  // SPEECH
  const [displayedText, setDisplayedText] = useState(""); 
  const [fullText, setFullText] = useState(""); 
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // PHYSICS & UTILS
  const [isFacingRight, setIsFacingRight] = useState(true);
  const [hearts, setHearts] = useState<Heart[]>([]);
  const [sleepParticles, setSleepParticles] = useState<Particle[]>([]);
  const [snacks, setSnacks] = useState<Snack[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Mounted Check
  const [isMounted, setIsMounted] = useState(false);

  const constraintsRef = useRef(null);
  const petRef = useRef<HTMLDivElement>(null);
  
  // --- REFS ---
  const isDraggingRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rubCounterRef = useRef(0);
  const lastRubTimeRef = useRef(0);

  const [screenPos, setScreenPos] = useState({ x: 0, y: 0 });


  useEffect(() => {
      if(isMounted && window) {
          setScreenPos({ x: 50, y: window.innerHeight - 150 })
      }
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted || state === 'sleeping') return;

    const wanderInterval = setInterval(() => {
        // Don't wander if currently being dragged by user
        if (isDraggingRef.current) return; 

        // Calculate safe bounds (padding of ~100px from edges)
        const maxX = window.innerWidth - 120;
        const maxY = window.innerHeight - 150;
        const minX = 20;
        const minY = 50; // Keep below header menu

        const newX = minX + Math.random() * (maxX - minX);
        const newY = minY + Math.random() * (maxY - minY);
        
        setScreenPos({ x: newX, y: newY });
    }, 7000);

    return () => clearInterval(wanderInterval);
  }, [isMounted, state]);
  

  useEffect(() => {
    setIsMounted(true);
    if (isMusicPlaying) {
        setState('dancing');
    }
  }, [isMusicPlaying]);


  useEffect(() => {
    if (!isMounted) return;
    const timer = setInterval(() => {
        if (state === 'sleeping') return; 

        setHunger(prev => Math.min(prev + 1, 100)); 
        setHappiness(prev => Math.max(prev - 1, 0)); 

        // Complain if needs are critical
        if (hunger > 80 && Math.random() > 0.8 && !isBubbleVisible) speak("I'm so hungry... 🍩");
        if (happiness < 20 && Math.random() > 0.8 && !isBubbleVisible) speak("Pay attention to me! 🥺");

    }, 5000); 
    return () => clearInterval(timer);
  }, [state, hunger, happiness, isMounted, isBubbleVisible]);


  useEffect(() => {
    if (!isMounted) return;
    if (state === 'sleeping' || state === 'eating') return;

    if (isMusicPlaying) {
        if (hunger > 90) {
            if (state !== 'sad') setState('sad');
            if (!isBubbleVisible) speak("Too hungry to dance...");
        } else if (happiness < 10) {
            if (state !== 'sad') setState('sad');
            if (!isBubbleVisible) speak("Not in the mood...");
        } else if (state !== 'dancing') {
            setState('dancing'); 
            spawnHearts(3);
        }
    } else if (!isMusicPlaying && state === 'dancing') {
        setState('idle');
    }
  }, [isMusicPlaying, state, hunger, happiness, isBubbleVisible, isMounted]);

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

  const handleAnswer = (option: DialogueOption) => {
      speak(option.reply, null); 
      
      if (option.triggerHearts) spawnHearts(5);
      if (option.statBoost) setHappiness(prev => Math.min(prev + 20, 100)); 

      if (option.reaction) {
          setState(option.reaction);
          setTimeout(() => {
            // Return to previous state logic
            if (isMusicPlaying && option.reaction !== 'dancing') setState('dancing');
            else if (!isMusicPlaying && option.reaction !== 'idle') setState('idle');
          }, 2000);
      }
  };

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
        
        setHunger(prev => Math.max(prev - value, 0)); 
        setHappiness(prev => Math.min(prev + 5, 100)); 

        setState('eating');
        setTimeout(() => setState(prev => prev === 'eating' ? (isMusicPlaying ? 'dancing' : 'idle') : prev), 1500);
    }
  };

  
  const handleInteract = () => {
    if (state === 'eating') return;
    
    spawnHearts(5); 
    setHappiness(prev => Math.min(prev + 5, 100));

    if (state === 'sleeping') {
      // Wake up -> Check Music
      setState(isMusicPlaying ? 'dancing' : 'idle');
      speak("Good morning! ☀️");
    } else {
      // Go to sleep
      setState('sleeping');
      speak("Goodnight... 💤");
    }
  };

  const handleMouseMoveOverPet = () => {
    if (state === 'sleeping') return;
    
    const now = Date.now();
    if (now - lastRubTimeRef.current > 200) {
      rubCounterRef.current = 0;
    }
    
    rubCounterRef.current += 1;
    lastRubTimeRef.current = now;

    if (rubCounterRef.current > 30) {
      rubCounterRef.current = 0; 
      spawnHearts(2);
      setHappiness(prev => Math.min(prev + 1, 100));
      if (!isBubbleVisible && Math.random() > 0.85) speak("That feels nice! ~");
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
  

  useEffect(() => {
    if (!isMounted) return;
    const interval = setInterval(() => {
        if (isBubbleVisible || state === 'sleeping') return;
        
        const roll = Math.random();
        if (roll > 0.8) { // Increased frequency slightly
             const randomQ = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
             speak(randomQ.text, randomQ);
        } else if (roll > 0.5) {
             const randomPhrase = IDLE_PHRASES[Math.floor(Math.random() * IDLE_PHRASES.length)];
             speak(randomPhrase);
        }
    }, 7000);
    return () => clearInterval(interval);
  }, [isBubbleVisible, state, speak, isMounted]);

  useEffect(() => {
    if (state !== 'sleeping') {
        setSleepParticles([]);
        return;
    }
    const interval = setInterval(() => {
      const newPart = { id: Date.now(), x: 40 + Math.random() * 20, y: 10 };
      setSleepParticles(prev => [...prev, newPart]);
      setTimeout(() => {
        setSleepParticles(prev => prev.filter(p => p.id !== newPart.id));
      }, 2000);
    }, 800);

    return () => clearInterval(interval);
  }, [state]);


  const spriteConfig = {
    idle: { row: 0, steps: 3, speed: 0.8 },
    dancing: { row: 1, steps: 3, speed: 0.5 },
    sleeping: { row: 2, steps: 3, speed: 1.5 },
    eating: { row: 1, steps: 3, speed: 0.2 },
    sad: { row: 0, steps: 1, speed: 1 },
  };
  const currentAnim = spriteConfig[state];
  const yPosition = `${currentAnim.row * 50}%`;

  if (!isMounted) return null; 

  return (
    <>
      {/* MENU with STATS */}
      <div className="fixed top-24 right-4 flex flex-col items-end gap-2 z-[60]">
         <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-[10px] uppercase font-bold text-pink-500 bg-white/90 rounded-lg py-2 px-3 shadow border-2 border-pink-100 hover:scale-105 active:scale-95 transition">
            {isMenuOpen ? "Close ✖" : "Menu 🍒"}
         </button>
         <AnimatePresence>
            {isMenuOpen && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-3 p-3 bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 w-40">
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

      <div ref={constraintsRef} className="fixed top-0 bottom-0 left-0 right-0 w-full h-full inset-0 pointer-events-none z-50 overflow-hidden">
        {/* SNACKS IN WORLD */}
        <AnimatePresence>
            {snacks.map(snack => (
                <motion.div key={snack.id} drag dragConstraints={constraintsRef} whileDrag={{ scale: 1.3 }} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} onDragEnd={(e, info) => handleSnackDrop(snack.id, info, snack.value)} className="top-[50%] left-[50%] absolute pointer-events-auto text-4xl z-[55] cursor-grab">{snack.icon}</motion.div>
            ))}
        </AnimatePresence>

        {/* PET CONTAINER */}
          <motion.div
          ref={petRef}
          drag
          dragConstraints={constraintsRef}
          dragMomentum={false}
          onDragStart={() => { isDraggingRef.current = true; }}
          onDragEnd={(e, info) => {
             setTimeout(() => { isDraggingRef.current = false; }, 150);
             setScreenPos({ x: info.point.x - 50, y: info.point.y - 50 });
          }}
          onMouseMove={handleMouseMoveOverPet}
          animate={{ x: screenPos.x, y: screenPos.y }}
          transition={{
            type: "spring",
            mass: 3,      // Heavier feel
            stiffness: 30, // Loose spring
            damping: 20,   // Slow down gradually
            restDelta: 0.001 // Wait until fully stopped before next move
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          // REMOVED fixed positions like 'bottom-4 left-18'. Added 'top-0 left-0' as base.
          className="absolute top-0 left-0 w-24 h-24 pointer-events-auto cursor-grab active:cursor-grabbing z-50"
        >
           {/* ... content inside (particles, bubbles, sprite) remains unchanged ... */}
           {/* Sleep Particles */}
           <AnimatePresence>
            {sleepParticles.map(p => (
                <ZzzParticle key={p.id} x={p.x} y={p.y} />
            ))}
          </AnimatePresence>

          {/* Hearts Overlay */}
          <div className="absolute inset-0 pointer-events-none flex justify-center items-center z-40">
            <AnimatePresence>
                {hearts.map(h => (
                    <motion.div key={h.id} initial={{ opacity: 1, scale: 0.5 }} animate={{ opacity: 0, scale: 1.5, y: -50 }} exit={{ opacity: 0 }} className="absolute text-xl">💖</motion.div>
                ))}
            </AnimatePresence>
          </div>

          {/* Speech Bubble */}
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

          {/* Sprite Animation */}
          <motion.div
            animate={state === 'dancing' ? { y: [0, -8, 0] } : { y: 0 }}
            transition={state === 'dancing' ? { repeat: Infinity, duration: 0.4 } : {}}
            className="w-full h-full touch-none"
            onClick={(e) => {
                e.stopPropagation();
                if (isDraggingRef.current) return;
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