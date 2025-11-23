'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

// --- TYPES ---
type PetState = 'idle' | 'sleeping' | 'dancing' | 'eating' | 'sad' | 'refusing';
type Heart = { id: number; x: number; y: number };
type Particle = { id: number; x: number; y: number };
type SnackItem = { icon: string; value: number };
type DroppedSnack = SnackItem & { id: number; x: number; y: number };
type Mess = { id: number; x: number; y: number };

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

interface PetMenuProps {
  isOpen: boolean;
  onClose: () => void;
  hunger: number;
  happiness: number;
  isFat: boolean;
  messesCount: number;
  onSpawnSnack: (snack: SnackItem) => void;
  onClean: () => void;
}

// --- CONSTANTS ---
const SPRITE_SHEET = '/sprite/pet4.png'; 
const MOVEMENT_INTERVAL = 8000;
const VITALS_INTERVAL = 5000;
const SAVE_DELAY = 2000;
const SNACKS: SnackItem[] = [
  { icon: "🍒", value: 10 }, 
  { icon: "🍰", value: 20 }, 
  { icon: "🧋", value: 15 }, 
  { icon: "🍕", value: 30 }, 
  { icon: "🍪", value: 10 }
];

const IDLE_PHRASES = [
  "Just chilling... 🌸", "So quiet today.", "Is it coffee time? ☕", 
  "La la la...", "Waiting for a banger!", "Hello there! ✨", 
  "Nice cursor! 🖱️", "You're doing great! 💖", "Pixels are the best. 👾",
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
    text: "Is the music too loud?",
    options: [
      { label: "It's a vibe! 🎵", reply: "Then let's dance!! 💃", reaction: 'dancing', triggerHearts: true },
      { label: "A little bit.", reply: "Oops, I'll tiptoe then. 🤫", reaction: 'idle' },
    ]
  },
  {
    text: "Are you coding right now?",
    options: [
      { label: "Yes, focused! 💻", reply: "You got this! Don't forget to hydrate! 💧", reaction: 'dancing', statBoost: true },
      { label: "Just scrolling 👀", reply: "Make sure to look at me too! 🥺", reaction: 'idle' },
    ]
  },
  {
    text: "I'm kinda hungry...",
    options: [
      { label: "Have a cookie 🍪", reply: "Omg yesss! Nom nom! 😋", reaction: 'eating', triggerHearts: true, statBoost: true },
      { label: "Later, sorry.", reply: "My tummy is rumbling... 🌫️", reaction: 'sad' },
    ]
  },
  {
    text: "Do you like this website?",
    options: [
      { label: "It's amazing! 💖", reply: "Tamar worked so hard on it! ✨", reaction: 'dancing', triggerHearts: true },
      { label: "Still loading...", reply: "I'll wait right here! ⏳", reaction: 'idle' },
    ]
  },
  {
    text: "Need a hug?",
    options: [
      { label: "Yes please 🫂", reply: "Sending virtual hugs!! 💗", reaction: 'dancing', triggerHearts: true, statBoost: true },
      { label: "I'm good.", reply: "Okay, just checking! 🫡", reaction: 'idle' },
    ]
  },
  {
    text: "Is there enough pink here?",
    options: [
      { label: "NEVER enough! 🌸", reply: "That's the spirit! Pink power! 🎀", reaction: 'dancing', triggerHearts: true },
      { label: "It's perfect. 👌", reply: "Balanced, as all things should be. 😌", reaction: 'idle' },
    ]
  },
  {
    text: "What's the plan today?",
    options: [
      { label: "Productive! 🚀", reply: "Zoom zoom! Let's go! 🔥", reaction: 'dancing' },
      { label: "Cozy Mode 🧸", reply: "Perfect time for a nap... 💤", reaction: 'sleeping' },
    ]
  },
];

// --- SUB-COMPONENTS ---

const Bubble = ({ text, question, isTyping, onAnswer }: { text: string, question: Question | null, isTyping: boolean, onAnswer: (opt: DialogueOption) => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10, scale: 0.8 }} 
    animate={{ opacity: 1, y: 0, scale: 1 }} 
    exit={{ opacity: 0, y: 5, scale: 0.8 }} 
    onClick={(e) => e.stopPropagation()} 
    className={`absolute ${question && !isTyping ? "-top-32" : "-top-20"} right-0 bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-bold p-3 rounded-2xl shadow-xl border-2 border-pink-200 min-w-[140px] max-w-[200px] z-[60] cursor-default pointer-events-auto`} 
    style={{ transformOrigin: "bottom right" }}
  >
    <div className="mb-2 whitespace-pre-wrap leading-tight text-center">
      {text}{isTyping && <span className="animate-pulse text-pink-500">|</span>}
    </div>
    {question && !isTyping && (
      <div className="flex flex-col gap-1 mt-2">
        {question.options.map((opt, idx) => (
          <button key={idx} onClick={(e) => { e.stopPropagation(); onAnswer(opt); }} className="bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-200 rounded px-2 py-1 text-[10px] transition-colors text-center shadow-sm">
            {opt.label}
          </button>
        ))}
      </div>
    )}
    <div className="absolute -bottom-2 right-6 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-pink-200"></div>
  </motion.div>
);

const PetMenu = ({ isOpen, onClose, hunger, happiness, isFat, messesCount, onSpawnSnack, onClean }: PetMenuProps) => (
  <div className="fixed top-24 right-4 flex flex-col items-end gap-2 z-[70] pointer-events-auto">
    <button onClick={onClose} className="text-[10px] uppercase font-bold text-pink-500 bg-white/90 rounded-lg py-2 px-3 shadow border-2 border-pink-100 hover:scale-105 active:scale-95 transition">
      {isOpen ? "Close ✖" : "Menu 🍒"}
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-3 p-3 bg-white/80 backdrop-blur-md rounded-2xl border border-white/50 w-40 shadow-lg">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[10px] font-bold text-pink-600"><span>Hunger</span> <span>{hunger}%</span></div>
            <div className="w-full h-1.5 bg-white rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${hunger > 80 ? 'bg-red-400' : 'bg-orange-300'}`} style={{ width: `${hunger}%` }}></div></div>
            <div className="flex justify-between text-[10px] font-bold text-pink-600 mt-1"><span>Happiness</span> <span>{happiness}%</span></div>
            <div className="w-full h-1.5 bg-white rounded-full overflow-hidden"><div className="h-full bg-pink-400 rounded-full transition-all duration-500" style={{ width: `${happiness}%` }}></div></div>
          </div>
          {isFat && <div className="text-[10px] text-center text-orange-500 font-bold bg-orange-100 rounded px-1">I'm Stuffed! 🐡</div>}
          <hr className="border-pink-100" />
          <div className="flex flex-wrap gap-2 justify-center">
            {SNACKS.map((snack, i) => (
              <motion.button key={snack.icon} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} onClick={() => onSpawnSnack(snack)} className="w-8 h-8 bg-white shadow rounded-full text-lg hover:scale-110 flex items-center justify-center cursor-pointer">
                {snack.icon}
              </motion.button>
            ))}
          </div>
          {messesCount > 0 && (
            <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={onClean} className="w-full bg-blue-100 text-blue-600 text-[10px] font-bold py-2 rounded-lg hover:bg-blue-200 transition-colors">
              Clean Room 🧹
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// --- MAIN COMPONENT ---
export default function PixelPet({ isMusicPlaying }: { isMusicPlaying: boolean }) {
  // State
  const [state, setState] = useState<PetState>('idle');
  const [hunger, setHunger] = useState(20); 
  const [happiness, setHappiness] = useState(80); 
  const [messes, setMesses] = useState<Mess[]>([]);
  
  // Interaction State
  const [displayedText, setDisplayedText] = useState(""); 
  const [fullText, setFullText] = useState(""); 
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Physics & System State
  const [screenPos, setScreenPos] = useState({ x: 0, y: 0 }); // Initialized at 0, updated in useEffect
  const [isFacingRight, setIsFacingRight] = useState(true);
  const [hearts, setHearts] = useState<Heart[]>([]);
  const [sleepParticles, setSleepParticles] = useState<Particle[]>([]);
  const [snacks, setSnacks] = useState<DroppedSnack[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Refs
  const constraintsRef = useRef(null);
  const petRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rubCounterRef = useRef(0);
  const lastRubTimeRef = useRef(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isFat = hunger < 10;

  // --- HELPERS ---
  const spawnHearts = useCallback((count: number = 1) => {
    const newHearts = Array.from({ length: count }).map(() => ({
      id: Date.now() + Math.random(),
      x: (Math.random() - 0.5) * 40, 
      y: -20 - Math.random() * 30
    }));
    setHearts(prev => [...prev, ...newHearts]);
    setTimeout(() => setHearts(prev => prev.slice(count)), 1000);
  }, []);

  const speak = useCallback((text: string, question: Question | null = null) => {
    setDisplayedText(""); 
    setFullText(text);    
    setActiveQuestion(question);
    setIsBubbleVisible(true);
  }, []);

  // --- PERSISTENCE & INIT ---
  useEffect(() => {
    setIsMounted(true);
    setScreenPos({ 
      x: typeof window !== 'undefined' ? window.innerWidth / 2 - 40 : 100, 
      y: typeof window !== 'undefined' ? window.innerHeight - 200 : 100 
    });

    const savedData = localStorage.getItem('pixel_pet_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const now = Date.now();
        const hoursPassed = (now - (parsed.lastSaved || now)) / (1000 * 60 * 60);
        
        const hungerIncrease = Math.floor(hoursPassed * 10);
        const happinessDecrease = Math.floor(hoursPassed * 5);

        setHunger(Math.min(parsed.hunger + hungerIncrease, 100));
        setHappiness(Math.max(parsed.happiness - happinessDecrease, 0));
        setMesses(parsed.messes || []);
        
        if (hungerIncrease > 20) {
            setTimeout(() => speak("You were gone so long... I'm starving! 🥺"), 1000);
        }
      } catch (e) {
        console.error("Failed to load pet data", e);
      }
    }
  }, [speak]);

  useEffect(() => {
      if (!isMounted) return;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
          const data = { hunger, happiness, messes, lastSaved: Date.now() };
          localStorage.setItem('pixel_pet_data', JSON.stringify(data));
      }, SAVE_DELAY);
      return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [hunger, happiness, messes, isMounted]);

  // --- GAME LOOP: VITALS & WANDER ---
  useEffect(() => {
    if (!isMounted) return;

    // 1. Wander Loop
    const wanderTimer = setInterval(() => {
        if (state === 'sleeping' || isDraggingRef.current || isMenuOpen || activeQuestion || state === 'eating') return;
        const maxX = window.innerWidth - 120;
        const maxY = window.innerHeight - 150;
        setScreenPos({ 
            x: Math.max(20, Math.random() * maxX), 
            y: Math.max(50, Math.random() * maxY) 
        });
    }, MOVEMENT_INTERVAL);

    // 2. Vitals Loop
    const vitalsTimer = setInterval(() => {
        if (state === 'sleeping') return; 
        setHunger(prev => Math.min(prev + 1, 100)); 
        const decayRate = messes.length > 0 ? 3 : 1;
        setHappiness(prev => Math.max(prev - decayRate, 0)); 

        if (!isBubbleVisible && !activeQuestion) {
            if (messes.length > 0 && Math.random() > 0.7) speak("Eww... clean up please? 💩");
            else if (hunger > 80 && Math.random() > 0.8) speak("I'm so hungry... 🍩");
            else if (happiness < 20 && Math.random() > 0.8) speak("Pay attention to me! 🥺");
            else if (Math.random() > 0.9) {
                 const roll = Math.random();
                 if (roll > 0.7) speak(QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)].text, QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]);
                 else speak(IDLE_PHRASES[Math.floor(Math.random() * IDLE_PHRASES.length)]);
            }
        }
    }, VITALS_INTERVAL);

    return () => {
        clearInterval(wanderTimer);
        clearInterval(vitalsTimer);
    };
  }, [isMounted, state, isMenuOpen, activeQuestion, isBubbleVisible, messes, hunger, happiness, speak]);

  // --- EFFECT: SLEEP PARTICLES (Added this logic) ---
  useEffect(() => {
    if (state !== 'sleeping') {
      setSleepParticles([]);
      return;
    }
    const interval = setInterval(() => {
      const id = Date.now();
      setSleepParticles(prev => [...prev, { id, x: 10 + Math.random() * 20, y: -10 }]);
      setTimeout(() => setSleepParticles(prev => prev.filter(p => p.id !== id)), 2000);
    }, 800);
    return () => clearInterval(interval);
  }, [state]);

  // --- EFFECT: MUSIC REACTION ---
  useEffect(() => {
    if (!isMounted || state === 'sleeping' || state === 'eating') return;

    if (isMusicPlaying) {
      if (messes.length > 0 && state !== 'refusing') {
          setState('refusing');
          speak("Too messy to dance! 🤢");
      } else if ((hunger > 90 || happiness < 10) && state !== 'sad') {
          setState('sad');
          if (!isBubbleVisible) speak("Not in the mood...");
      } else if (state !== 'dancing' && state !== 'refusing' && state !== 'sad') {
          setState('dancing'); 
          spawnHearts(3);
      }
    } else if (!isMusicPlaying && (state === 'dancing' || state === 'refusing')) {
      setState('idle');
    }
  }, [isMusicPlaying, state, hunger, happiness, messes, isBubbleVisible, isMounted, speak, spawnHearts]);

  // --- EFFECT: TYPING ---
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

  // --- ACTIONS ---
  const handleAnswer = (option: DialogueOption) => {
      speak(option.reply, null); 
      if (option.triggerHearts) spawnHearts(5);
      if (option.statBoost) setHappiness(prev => Math.min(prev + 20, 100)); 
      if (option.reaction) {
          setState(option.reaction);
          setTimeout(() => {
            if (isMusicPlaying && option.reaction !== 'dancing') setState('dancing');
            else if (!isMusicPlaying && option.reaction !== 'idle') setState('idle');
          }, 2000);
      }
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

        if (Math.random() > 0.7) {
            setTimeout(() => {
                const newMess = { id: Date.now(), x: screenPos.x + (Math.random() * 100 - 50), y: screenPos.y + (Math.random() * 50) };
                setMesses(prev => [...prev, newMess]);
                speak("Oops... 😳");
            }, 2000);
        }
        setTimeout(() => setState(prev => prev === 'eating' ? (isMusicPlaying ? 'dancing' : 'idle') : prev), 1500);
    }
  };

  const handleInteract = () => {
    if (state === 'eating') return;
    spawnHearts(5); 
    setHappiness(prev => Math.min(prev + 5, 100));
    if (state === 'sleeping') {
      setState(isMusicPlaying ? 'dancing' : 'idle');
      speak("Good morning! ☀️");
    } else {
      setState('sleeping');
      speak("Goodnight... 💤");
    }
  };

  // Mouse Facing & Rubbing Logic
  useEffect(() => {
    if (!isMounted) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!petRef.current) return;
      
      // Update Facing
      const rect = petRef.current.getBoundingClientRect();
      setIsFacingRight(e.clientX > (rect.left + rect.width / 2));

      // Rubbing Logic (Only if hovering)
      const isHovering = 
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom;

      if (isHovering && state !== 'sleeping') {
          const now = Date.now();
          if (now - lastRubTimeRef.current > 200) rubCounterRef.current = 0;
          rubCounterRef.current += 1;
          lastRubTimeRef.current = now;

          if (rubCounterRef.current > 30) {
            rubCounterRef.current = 0; 
            spawnHearts(2);
            setHappiness(prev => Math.min(prev + 1, 100));
            if (!isBubbleVisible && Math.random() > 0.85) speak("That feels nice! ~");
          }
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [state, isBubbleVisible, speak, spawnHearts, isMounted]);

  // Window Resize Safety
  useEffect(() => {
      const handleResize = () => {
          const maxX = window.innerWidth - 100;
          const maxY = window.innerHeight - 100;
          setScreenPos(prev => ({
              x: Math.min(prev.x, maxX),
              y: Math.min(prev.y, maxY)
          }));
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sprite Calculation
  const getSpriteInfo = () => {
      let row = 0;
      let startFrame = isFat ? 3 : 0;
      switch(state) {
          case 'eating': row = 1; break;
          case 'sleeping': row = 2; break;
          case 'dancing': row = 3; break;
          case 'sad': 
          case 'refusing': row = 4; break;
          default: row = 0; // Idle
      }
      if (state === 'idle' && happiness < 30) row = 4;
      return { row, startFrame };
  };

  const { row, startFrame } = getSpriteInfo();

  if (!isMounted) return null; 

  return (
    <>
      <PetMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(!isMenuOpen)} 
        hunger={hunger} 
        happiness={happiness} 
        isFat={isFat} 
        messesCount={messes.length}
        onClean={() => {
            if (messes.length === 0) { speak("It's clean! ✨"); return; }
            setMesses([]); spawnHearts(5); setHappiness(prev => Math.min(prev + 10, 100)); speak("Thank you! 🌸");
        }}
        onSpawnSnack={(s: SnackItem) => setSnacks(prev => [...prev, { ...s, id: Date.now(), x: window.innerWidth/2, y: window.innerHeight/2 }])}
      />

      <div ref={constraintsRef} className="fixed top-0 bottom-0 left-0 right-0 w-full h-full inset-0 pointer-events-none z-50 overflow-hidden">
        {/* MESSES */}
        <AnimatePresence>
            {messes.map(mess => (
                <motion.div key={mess.id} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0, opacity: 0 }} className="absolute text-2xl z-[45]" style={{ left: mess.x, top: mess.y }}>💩</motion.div>
            ))}
        </AnimatePresence>

        {/* SNACKS */}
        <AnimatePresence>
            {snacks.map(snack => (
                <motion.div key={snack.id} drag dragConstraints={constraintsRef} whileDrag={{ scale: 1.3 }} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} onDragEnd={(e, info) => handleSnackDrop(snack.id, info, snack.value)} className="absolute text-4xl z-[55] cursor-grab pointer-events-auto active:cursor-grabbing" style={{ left: snack.x, top: snack.y }}>{snack.icon}</motion.div>
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
             // Small delay to prevent "click" after drag
             setTimeout(() => { isDraggingRef.current = false; }, 150);
             // Sync state with Framer Motion's internal position
             setScreenPos({ x: info.point.x - 40, y: info.point.y - 40 }); 
          }}
          // We remove onMouseMove here and handle it globally in useEffect for better rub detection
          animate={{ x: screenPos.x, y: screenPos.y }}
          transition={{ type: "spring", mass: 3, stiffness: 30, damping: 20 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="absolute top-0 left-0 w-20 h-20 pointer-events-auto cursor-grab active:cursor-grabbing z-50 touch-none"
        >
           {/* SLEEP PARTICLES (ZZZ) */}
           <AnimatePresence>
               {sleepParticles.map(p => (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 0, x: 0, scale: 0.5 }} animate={{ opacity: [0, 1, 0], y: -30, x: Math.random() * 20 - 10, scale: 1.2 }} exit={{ opacity: 0 }} transition={{ duration: 2 }} className="absolute -top-4 right-0 text-blue-400 font-bold text-xs pointer-events-none z-[60] whitespace-nowrap">Zzz...</motion.div>
               ))}
           </AnimatePresence>
           
           <div className="absolute inset-0 pointer-events-none flex justify-center items-center z-40">
             <AnimatePresence>{hearts.map(h => <motion.div key={h.id} initial={{ opacity: 1, scale: 0.5 }} animate={{ opacity: 0, scale: 1.5, y: -50 }} exit={{ opacity: 0 }} className="absolute text-xl">💖</motion.div>)}</AnimatePresence>
           </div>

           <AnimatePresence>
            {isBubbleVisible && (
                <Bubble text={displayedText} question={activeQuestion} isTyping={isTyping} onAnswer={handleAnswer} />
            )}
           </AnimatePresence>

          {/* Sprite Rendering */}
          <motion.div
            animate={state === 'dancing' ? { y: [0, -10, 0] } : { y: 0 }}
            transition={state === 'dancing' ? { repeat: Infinity, duration: 0.4 } : {}}
            className="w-full h-full touch-none"
            onClick={(e) => { 
                e.stopPropagation(); 
                if (!isDraggingRef.current) handleInteract(); 
            }}
          >
             <div 
                className="w-full h-full pet-sprite" 
                style={{ 
                    '--sprite-row': row,
                    '--start-frame': startFrame,
                    transform: isFacingRight ? 'scaleX(1)' : 'scaleX(-1)', 
                } as React.CSSProperties} 
             />
          </motion.div>
        </motion.div>
      </div>

      <style jsx global>{`
        .pet-sprite {
            background-image: url('${SPRITE_SHEET}');
            background-repeat: no-repeat;
            background-size: 600% 500%;
            image-rendering: pixelated;
            background-position-y: calc(var(--sprite-row) * 25%);
            animation: playSprite 1s steps(1) infinite;
        }

        @keyframes playSprite {
            0%   { background-position-x: calc(var(--start-frame) * 20%); }
            33%  { background-position-x: calc((var(--start-frame) + 1) * 20%); }
            66%  { background-position-x: calc((var(--start-frame) + 2) * 20%); }
            100% { background-position-x: calc(var(--start-frame) * 20%); }
        }
      `}</style>
    </>
  );
}