'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

// --- TYPES ---
type PetState = 'idle' | 'sleeping' | 'dancing' | 'eating';
type Heart = { id: number; x: number; y: number };
type Snack = { id: number; icon: string; x: number; y: number };

// --- CONFIGURATION ---
const SNACKS = ["🍒", "🍰", "🧋", "🍕", "🍪"];

const PHRASES = {
  idle: [
    "Just chilling... 🌸", "So quiet today.", "Is it coffee time?", 
    "La la la...", "Waiting for a banger!", "Hello Tamar! ✨"
  ],
  dancing: [
    "This is my JAM! 💃", "Wiggle wiggle!", "Feel the beat! 🎵", 
    "Let's goooo! 🔥", "Can't stop won't stop"
  ],
  sleeping: [
    "Zzz...", "Dreaming of pixels...", "5 more minutes...", "Do not disturb 🌙"
  ],
  eating: [
    "Yummy! 😋", "Nom nom nom", "Delicious!", "More please? 🍒"
  ]
};

export default function PixelPet({ isMusicPlaying }: { isMusicPlaying: boolean }) {
  // --- STATE ---
  const [state, setState] = useState<PetState>('idle');
  const [speech, setSpeech] = useState<string>("");
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);
  const [isFacingRight, setIsFacingRight] = useState(true);
  const [hearts, setHearts] = useState<Heart[]>([]);
  const [snacks, setSnacks] = useState<Snack[]>([]);
  
  // NEW: Menu visibility state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // --- REFS ---
  const constraintsRef = useRef(null);
  const petRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // --- 1. MOUSE TRACKING ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!petRef.current) return;
      const rect = petRef.current.getBoundingClientRect();
      const petCenterX = rect.left + rect.width / 2;
      setIsFacingRight(e.clientX > petCenterX);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // --- 2. MUSIC SYNC ---
  useEffect(() => {
    if (state === 'sleeping' || state === 'eating') return;

    if (isMusicPlaying && state !== 'dancing') {
        setState('dancing');
        spawnHearts(3);
    } else if (!isMusicPlaying && state === 'dancing') {
        setState('idle');
    }
  }, [isMusicPlaying, state]);

  // --- 3. HEART SYSTEM ---
  const spawnHearts = (count: number = 1) => {
    const newHearts = Array.from({ length: count }).map(() => ({
      id: Date.now() + Math.random(),
      x: (Math.random() - 0.5) * 40,
      y: -20 - Math.random() * 30
    }));
    setHearts(prev => [...prev, ...newHearts]);
    setTimeout(() => {
        setHearts(prev => prev.slice(count));
    }, 1000);
  };

  // --- 4. SNACK SYSTEM ---
  const spawnSnack = (icon: string) => {
    const id = Date.now();
    setSnacks(prev => [...prev, { 
        id, 
        icon, 
        x: window.innerWidth / 2 + (Math.random() * 100), 
        y: window.innerHeight / 2 
    }]);
    // Optional: Close menu after picking one? 
    // setIsMenuOpen(false); 
  };

  const handleSnackDrop = (snackId: number, info: PanInfo) => {
    if (!petRef.current) return;

    const petRect = petRef.current.getBoundingClientRect();
    const dropX = info.point.x;
    const dropY = info.point.y;

    const isHit = 
        dropX >= petRect.left && 
        dropX <= petRect.right && 
        dropY >= petRect.top && 
        dropY <= petRect.bottom+20;

    if (isHit) {
        setSnacks(prev => prev.filter(s => s.id !== snackId));
        spawnHearts(6);
        triggerSpeech("Yummy! 😋");
        
        const previousState = state;
        setState('eating');
        
        setTimeout(() => {
            setState(prev => (prev === 'eating' ? (isMusicPlaying ? 'dancing' : 'idle') : prev));
        }, 1500);
    }
  };

  // --- 5. INTERACTION ---
  const handleInteract = () => {
    if (isDraggingRef.current) return; 

    spawnHearts(5); 

    if (state === 'sleeping') {
      const nextState = isMusicPlaying ? 'dancing' : 'idle';
      setState(nextState);
      triggerSpeech("Good morning! ☀️");
    } else {
      setState('sleeping');
      triggerSpeech("Goodnight... 💤");
    }
  };

  // --- 6. SPEECH LOGIC ---
  const triggerSpeech = useCallback((overrideText?: string) => {
    const getPhrase = (currentState: PetState) => {
        const options = PHRASES[currentState] || PHRASES['idle'];
        return options[Math.floor(Math.random() * options.length)];
    };
    setSpeech(overrideText || getPhrase(state));
    setIsBubbleVisible(true);
    setTimeout(() => setIsBubbleVisible(false), 4000);
  }, [state]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7 && state !== 'sleeping') triggerSpeech();
    }, 8000); 
    return () => clearInterval(interval);
  }, [triggerSpeech, state]);

  // --- CONFIG ---
  const spriteConfig = {
    idle: { row: 0, steps: 3, speed: 0.8 },
    dancing: { row: 1, steps: 3, speed: 0.5 },
    sleeping: { row: 2, steps: 3, speed: 1.5 },
    eating: { row: 1, steps: 3, speed: 0.2 },
  };

  const currentAnim = spriteConfig[state];
  const yPosition = `${currentAnim.row * 50}%`;

  return (
    <>
      {/* --- A. DROPDOWN MENU --- */}
      <div className="fixed top-24 right-4 flex flex-col items-end gap-2 z-[60]">
         
         {/* The Toggle Button */}
         <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-[10px] uppercase tracking-wider font-bold text-pink-500 bg-white/90 backdrop-blur rounded-lg py-2 px-3 shadow-md border-2 border-pink-100 hover:bg-pink-50 hover:scale-105 transition-all active:scale-95"
         >
            {isMenuOpen ? "Close Menu ✖" : "Feed Me 🍒"}
         </button>

         {/* The Snacks (Conditional Render) */}
         <AnimatePresence>
            {isMenuOpen && (
                <motion.div 
                    initial={{ opacity: 0, y: -10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="flex ml-auto flex-col gap-2 p-2 bg-white/40 backdrop-blur-md rounded-2xl border border-white/50"
                >
                    {SNACKS.map((snack, i) => (
                        <motion.button 
                            key={snack}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }} // Staggered animation effect
                            whileHover={{ scale: 1.2, rotate: 10 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => spawnSnack(snack)}
                            className="w-10 h-10 flex items-center justify-center bg-white shadow-sm rounded-full text-xl hover:shadow-md transition-shadow cursor-pointer"
                        >
                            {snack}
                        </motion.button>
                    ))}
                </motion.div>
            )}
         </AnimatePresence>
      </div>

      {/* --- B. MAIN AREA --- */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        
        {/* Snacks in the world */}
        <AnimatePresence>
            {snacks.map(snack => (
                <motion.div
                    key={snack.id}
                    drag
                    dragConstraints={constraintsRef}
                    dragElastic={0.2}
                    whileHover={{ scale: 1.2, cursor: "grab" }}
                    whileDrag={{ scale: 1.3, cursor: "grabbing" }}
                    initial={{ scale: 0, x: snack.x, y: snack.y, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    onDragEnd={(e, info) => handleSnackDrop(snack.id, info)}
                    className="absolute pointer-events-auto text-4xl z-[55] select-none"
                >
                    {snack.icon}
                </motion.div>
            ))}
        </AnimatePresence>

        {/* The Pet */}
        <motion.div
          ref={petRef}
          drag
          dragConstraints={constraintsRef}
          dragElastic={0.1}
          dragMomentum={false}
          onDragStart={() => { isDraggingRef.current = true; }}
          onDragEnd={() => { setTimeout(() => { isDraggingRef.current = false; }, 150); }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="absolute bottom-4 left-10 w-24 h-24 pointer-events-auto cursor-grab active:cursor-grabbing"
          onClick={handleInteract}
        >
          {/* Hearts */}
          <div className="absolute inset-0 pointer-events-none flex justify-center items-center z-40">
            <AnimatePresence>
                {hearts.map(heart => (
                    <motion.div
                        key={heart.id}
                        initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
                        animate={{ opacity: 0, scale: 1.5, x: heart.x, y: heart.y - 50 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="absolute text-xl"
                    >
                        💖
                    </motion.div>
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
                    transition={{ duration: 0.3 }}
                    className="absolute -top-10 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-bold px-3 py-2 rounded-2xl shadow-lg border-2 border-pink-200 whitespace-nowrap z-50 select-none"
                    style={{ transformOrigin: "bottom right" }} 
                >
                    {speech}
                </motion.div>
            )}
          </AnimatePresence>

          {/* Sprite */}
          <motion.div
            animate={state === 'dancing' ? { y: [0, -8, 0] } : { y: 0 }}
            transition={state === 'dancing' ? { repeat: Infinity, duration: 0.4 } : {}}
            className="w-full h-full touch-none"
          >
             <div 
                key={state} 
                className="w-full h-full"
                style={{
                    backgroundImage: "url('/sprite/pet.png')", 
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '400% 300%', 
                    backgroundPositionY: yPosition,
                    imageRendering: 'pixelated',
                    transform: isFacingRight ? 'scaleX(1)' : 'scaleX(-1)', 
                    animation: `playRow ${currentAnim.speed}s steps(${currentAnim.steps}) infinite alternate`
                }}
            />
          </motion.div>
        </motion.div>
      </div>

      <style jsx global>{`
        @keyframes playRow {
          from { background-position-x: 0%; }
          to { background-position-x: 100%; }
        }
      `}</style>
    </>
  );
}