'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

// --- TYPES ---
type PetState = 'idle' | 'sleeping' | 'dancing' | 'eating' | 'sad' | 'refusing';
type Heart = { id: number; x: number; y: number };
type Particle = { id: number; x: number; y: number };
type Snack = { id: number; icon: string; x: number; y: number; value: number };
type Mess = { id: number; x: number; y: number };

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
  "Just chilling... 🌸", 
  "So quiet today.", 
  "Is it coffee time, Tamar? ☕", 
  "La la la...", 
  "Waiting for a banger!", 
  "Hello Tamar! ✨", 
  "Nice cursor! 🖱️",
  "Tamar, you're doing great! 💖",
  "Pixels are the best. 👾",
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
  // Hunger 0 = Full/Fat, 100 = Starving
  const [hunger, setHunger] = useState(20); 
  const [happiness, setHappiness] = useState(80); 
  
  // HYGIENE
  const [messes, setMesses] = useState<Mess[]>([]);

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

  const [screenPos, setScreenPos] = useState({ x: 50, y: 50 });

  // --- DERIVED STATE ---
  // If hunger is low (< 40), the pet is "stuffed" and uses fat sprites
  const isFat = hunger < 40;

  // --- 1. PERSISTENCE LAYER ---
  useEffect(() => {
      if (typeof window !== 'undefined') {
          const savedData = localStorage.getItem('pixel_pet_data');
          if (savedData) {
              const parsed = JSON.parse(savedData);
              const now = Date.now();
              const lastSaved = parsed.lastSaved || now;
              const hoursPassed = (now - lastSaved) / (1000 * 60 * 60);
              
              const hungerIncrease = Math.floor(hoursPassed * 10);
              const happinessDecrease = Math.floor(hoursPassed * 5);

              setHunger(Math.min(parsed.hunger + hungerIncrease, 100));
              setHappiness(Math.max(parsed.happiness - happinessDecrease, 0));
              setMesses(parsed.messes || []);
              
              if (hungerIncrease > 20) {
                  setTimeout(() => speak("You were gone so long... I'm starving! 🥺"), 1000);
              }
          }
          setIsMounted(true);
          setScreenPos({ x: 50, y: window.innerHeight - 150 });
      }
  }, []);

  useEffect(() => {
      if (!isMounted) return;
      const data = {
          hunger,
          happiness,
          messes,
          lastSaved: Date.now()
      };
      localStorage.setItem('pixel_pet_data', JSON.stringify(data));
  }, [hunger, happiness, messes, isMounted]);


  // --- WANDERING LOGIC ---
  useEffect(() => {
    if (!isMounted || state === 'sleeping') return;

    const wanderInterval = setInterval(() => {
        if (isDraggingRef.current) return; 

        const maxX = window.innerWidth - 120;
        const maxY = window.innerHeight - 150;
        const minX = 20;
        const minY = 50;

        // Fat pets move less often or shorter distances? (Optional logic)
        const newX = minX + Math.random() * (maxX - minX);
        const newY = minY + Math.random() * (maxY - minY);
        
        setScreenPos({ x: newX, y: newY });
    }, 9000);

    return () => clearInterval(wanderInterval);
  }, [isMounted, state]);
  

  // --- MUSIC & STATE LOGIC ---
  useEffect(() => {
    if (!isMounted) return;
    if (state === 'sleeping' || state === 'eating') return;

    if (isMusicPlaying) {
        if (messes.length > 0) {
            if (state !== 'refusing') {
                setState('refusing');
                speak("It's too messy to dance! 🤢");
            }
        } else if (hunger > 90) {
            if (state !== 'sad') setState('sad');
            if (!isBubbleVisible) speak("Too hungry to dance...");
        } else if (happiness < 10) {
            if (state !== 'sad') setState('sad');
            if (!isBubbleVisible) speak("Not in the mood...");
        } else if (state !== 'dancing') {
            setState('dancing'); 
            spawnHearts(3);
        }
    } else if (!isMusicPlaying && (state === 'dancing' || state === 'refusing')) {
        setState('idle');
    }
  }, [isMusicPlaying, state, hunger, happiness, messes, isBubbleVisible, isMounted]);


  // --- VITALS LOOP ---
  useEffect(() => {
    if (!isMounted) return;
    const timer = setInterval(() => {
        if (state === 'sleeping') return; 

        setHunger(prev => Math.min(prev + 1, 100)); 
        
        const decayRate = messes.length > 0 ? 3 : 1;
        setHappiness(prev => Math.max(prev - decayRate, 0)); 

        if (messes.length > 0 && Math.random() > 0.7 && !isBubbleVisible) speak("Eww... clean up please? 💩");
        else if (hunger > 80 && Math.random() > 0.8 && !isBubbleVisible) speak("I'm so hungry... 🍩");
        else if (happiness < 20 && Math.random() > 0.8 && !isBubbleVisible) speak("Pay attention to me! 🥺");

    }, 5000); 
    return () => clearInterval(timer);
  }, [state, hunger, happiness, messes, isMounted, isBubbleVisible]);


  // --- SPEECH ---
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


  // --- INTERACTION ---
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

  const spawnSnack = (snackData: { icon: string, value: number }) => {
    setSnacks(prev => [...prev, { ...snackData, id: Date.now(), x: window.innerWidth/2, y: window.innerHeight/2 }]);
  };

  const cleanMesses = () => {
      if (messes.length === 0) {
          speak("It's already clean! ✨");
          return;
      }
      setMesses([]);
      spawnHearts(5);
      setHappiness(prev => Math.min(prev + 10, 100));
      speak("Much better! Thank you! 🌸");
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

        if (Math.random() > 0.7) {
            setTimeout(() => {
                const newMess = { 
                    id: Date.now(), 
                    x: screenPos.x + (Math.random() * 100 - 50), 
                    y: screenPos.y + (Math.random() * 50) 
                };
                setMesses(prev => [...prev, newMess]);
                speak("Oops... 😳");
            }, 2000);
        }

        setState('eating');
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
  

  // --- LOOPS & PARTICLES ---
  useEffect(() => {
    if (!isMounted) return;
    const interval = setInterval(() => {
        if (isBubbleVisible || state === 'sleeping') return;
        const roll = Math.random();
        if (roll > 0.8) { 
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


  // --- ANIMATION LOGIC (UPDATED FOR 6x3 GRID) ---
  // Grid: 6 columns, 3 rows.
  // Row 0: Idle (3 frames) + Fat Idle (3 frames)
  // Row 1: Eating (3 frames) + Fat Eating (3 frames)
  // Row 2: Sleeping (3 frames) + Sad (3 frames)
  
  let animationName = 'playIdle';
  let bgY = '0%'; // Row 0 by default

  if (state === 'eating') {
      bgY = '50%'; // Row 1
      animationName = isFat ? 'playFatEat' : 'playEat';
  } else if (state === 'sleeping') {
      bgY = '100%'; // Row 2
      animationName = 'playSleep';
  } else if (state === 'sad' || state === 'refusing') {
      bgY = '100%'; // Row 2
      animationName = 'playSad';
  } else if (state === 'dancing') {
       bgY = '0%'; // Row 0
       animationName = isFat ? 'playFatIdle' : 'playIdle';
  } else {
      // IDLE
      bgY = '0%';
      animationName = isFat ? 'playFatIdle' : 'playIdle';
  }

  // Override for Sadness check (if very unhappy but not strictly in 'sad' state yet)
  if (state === 'idle' && happiness < 30) {
      bgY = '100%';
      animationName = 'playSad';
  }

  if (!isMounted) return null; 

  return (
    <>
      {/* MENU */}
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
                    {isFat && <div className="text-[10px] text-center text-orange-500 font-bold bg-orange-100 rounded px-1">I'm Stuffed! 🐡</div>}
                    
                    <hr className="border-pink-100" />
                    <div className="flex flex-wrap gap-2 justify-center">
                        {SNACKS.map((snack, i) => (
                            <motion.button key={snack.icon} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} onClick={() => spawnSnack(snack)} className="w-8 h-8 bg-white shadow rounded-full text-lg hover:scale-110">
                                {snack.icon}
                            </motion.button>
                        ))}
                    </div>
                    {messes.length > 0 && (
                        <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={cleanMesses} className="w-full bg-blue-100 text-blue-600 text-[10px] font-bold py-2 rounded-lg hover:bg-blue-200 transition-colors">
                            Clean Room 🧹
                        </motion.button>
                    )}
                </motion.div>
            )}
         </AnimatePresence>
      </div>

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
          transition={{ type: "spring", mass: 3, stiffness: 30, damping: 20 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="absolute top-0 left-0 w-32 h-32 pointer-events-auto cursor-grab active:cursor-grabbing z-50"
        >
           <AnimatePresence>{sleepParticles.map(p => <ZzzParticle key={p.id} x={p.x} y={p.y} />)}</AnimatePresence>
          <div className="absolute inset-0 pointer-events-none flex justify-center items-center z-40">
            <AnimatePresence>{hearts.map(h => <motion.div key={h.id} initial={{ opacity: 1, scale: 0.5 }} animate={{ opacity: 0, scale: 1.5, y: -50 }} exit={{ opacity: 0 }} className="absolute text-xl">💖</motion.div>)}</AnimatePresence>
          </div>

          <AnimatePresence>
            {isBubbleVisible && (
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 5, scale: 0.8 }} onClick={(e) => e.stopPropagation()} className={`absolute ${activeQuestion && !isTyping ? "-top-25" : "-top-10"} bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-bold p-3 rounded-2xl shadow-xl border-2 border-pink-200 min-w-[120px] max-w-[200px] z-50 cursor-default`} style={{ transformOrigin: "bottom right" }}>
                    <div className="mb-2 whitespace-pre-wrap leading-tight text-center">{displayedText}{isTyping && <span className="animate-pulse text-pink-500">|</span>}</div>
                    {activeQuestion && !isTyping && (
                        <div className="flex flex-col gap-1 mt-2">{activeQuestion.options.map((opt, idx) => (<button key={idx} onClick={(e) => { e.stopPropagation(); handleAnswer(opt); }} className="bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-200 rounded px-2 py-1 text-[10px] transition-colors text-center">{opt.label}</button>))}</div>
                    )}
                    <div className="absolute -bottom-2 right-6 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-pink-200"></div>
                </motion.div>
            )}
          </AnimatePresence>

          {/* Sprite Animation */}
          <motion.div
            animate={state === 'dancing' ? { y: [0, -10, 0] } : { y: 0 }}
            transition={state === 'dancing' ? { repeat: Infinity, duration: 0.4 } : {}}
            className="w-full h-full touch-none"
            onClick={(e) => { e.stopPropagation(); if (isDraggingRef.current) return; handleInteract(); }}
          >
             <div 
                className="w-full h-full" 
                style={{ 
                    backgroundImage: "url('/sprite/pet3.png')",
                    backgroundRepeat: 'no-repeat', 
                    backgroundSize: '600% 300%', // 6 Columns, 3 Rows
                    backgroundPositionY: bgY, 
                    imageRendering: 'pixelated', 
                    transform: isFacingRight ? 'scaleX(1)' : 'scaleX(-1)', 
                    animation: `${animationName} 1s steps(1) infinite` 
                }} 
             />
          </motion.div>
        </motion.div>
      </div>

      <style jsx global>{`
        /* ROW 0: Idle (Frames 0, 1, 2) */
        @keyframes playIdle {
            0% { background-position-x: 0%; }
            33% { background-position-x: 20%; }
            66% { background-position-x: 40%; }
            100% { background-position-x: 0%; }
        }
        /* ROW 0: Fat Idle (Frames 3, 4, 5) */
        @keyframes playFatIdle {
            0% { background-position-x: 60%; }
            33% { background-position-x: 80%; }
            66% { background-position-x: 100%; }
            100% { background-position-x: 60%; }
        }

        /* ROW 1: Eat (Frames 0, 1, 2) */
        @keyframes playEat {
            0% { background-position-x: 0%; }
            33% { background-position-x: 20%; }
            66% { background-position-x: 40%; }
            100% { background-position-x: 0%; }
        }
        /* ROW 1: Fat Eat (Frames 3, 4, 5) */
        @keyframes playFatEat {
            0% { background-position-x: 60%; }
            33% { background-position-x: 80%; }
            66% { background-position-x: 100%; }
            100% { background-position-x: 60%; }
        }

        /* ROW 2: Sleep (Frames 0, 1, 2) */
        @keyframes playSleep {
            0% { background-position-x: 0%; }
            33% { background-position-x: 20%; }
            66% { background-position-x: 40%; }
            100% { background-position-x: 0%; }
        }
        /* ROW 2: Sad (Frames 3, 4, 5) */
        @keyframes playSad {
            0% { background-position-x: 60%; }
            33% { background-position-x: 80%; }
            66% { background-position-x: 100%; }
            100% { background-position-x: 60%; }
        }
      `}</style>
    </>
  );
}