"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Gift, Music, Sparkles, Camera } from "lucide-react";
import Image from "next/image";

// --- Components ---

// 1. Floating Background Shapes
const FloatingShape = ({
  color,
  size,
  top,
  left,
  delay,
}: {
  color: string;
  size: number;
  top: string;
  left: string;
  delay: number;
}) => {
  return (
    <motion.div
      className={`absolute rounded-full opacity-40 blur-xl ${color}`}
      style={{ width: size, height: size, top, left }}
      animate={{
        y: [0, -20, 0],
        x: [0, 10, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut",
      }}
    />
  );
};

export default function BirthdayPage() {
  const [isWished, setIsWished] = useState(false);

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6 } },
  };

  return (
    <div className="relative min-h-screen py-20 w-full overflow-hidden bg-background font-gilroy text-slate-800 flex items-center justify-center p-4">
      {/* --- Ambient Background --- */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <FloatingShape color="bg-main" size={300} top="-5%" left="-10%" delay={0} />
        <FloatingShape color="bg-accent" size={200} top="60%" left="85%" delay={2} />
        <FloatingShape color="bg-main" size={150} top="10%" left="80%" delay={1} />
        <FloatingShape color="bg-white" size={100} top="80%" left="10%" delay={3} />
      </div>

      {/* --- Main Card --- */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-md border border-white/50 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Card Header Decoration */}
        <div className="h-2 w-full bg-accent" />

        <div className="p-8 flex flex-col items-center text-center">
          
          {/* 1. Header Text */}
          <motion.div variants={itemVariants} className="mb-6">
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }} 
              transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
              className="inline-block"
            >
              <span className="text-4xl">🎉</span>
            </motion.div>
            <h1 className="text-4xl font-bold text-accent tracking-wide mt-2">
              Happy Birthday Ninikia!
            </h1>
            <p className="text-slate-500 mt-2 text-sm uppercase tracking-widest font-semibold">
              Celebrating You
            </p>
          </motion.div>

          {/* 2. DEDICATED IMAGE PLACEHOLDER */}
          {/* Replace '/your-image.jpg' with your actual image path */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            className="relative w-full aspect-[4/5] bg-main rounded-xl overflow-hidden shadow-inner border-4 border-white mb-8 group"
          >
            {/* Logic: If no image is present, show a placeholder icon. 
                Once you add your image, remove the 'flex' and 'justify-center' 
                and ensure the image covers the div. */}
            
            {/* --- INSERT IMAGE HERE --- */}
            <Image 
               src="/images/birthday.jpg"
               alt="Birthday Person"
               className="w-full h-full object-cover object-bottom-left"
               // fallback for when you haven't added the image yet:
               onError={(e) => {
                 e.currentTarget.style.display = 'none';
                 // @ts-ignore
                 e.currentTarget.nextSibling.style.display = 'flex'; 
               }}
               width={500}
               height={500}
            />
            {/* ------------------------- */}

            {/* Fallback Placeholder (Visible if image breaks or isn't set) */}
            <div className="hidden absolute inset-0 flex-col items-center justify-center text-white/50 gap-2">
               <Camera size={48} />
               <span className="text-sm font-medium">Insert Photo Here</span>
            </div>

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.div>

          {/* 3. Message Section */}
          <motion.div variants={itemVariants} className="space-y-4 mb-8 px-4">
            <p className="text-slate-600 leading-relaxed">
              Wishing you a day filled with sweetness, laughter, and everything
              beautiful. May this year bring you as much joy as you bring to
              everyone around you.
            </p>
          </motion.div>

          {/* 4. Interaction Buttons */}
          <motion.div variants={itemVariants} className="flex gap-4 w-full justify-center">
             
             {/* "Send Love" Button */}
             <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => setIsWished(true)}
              className={`${
                isWished ? "bg-accent text-white" : "bg-main text-slate-700"
              } flex-1 py-3 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 transition-colors duration-300`}
            >
              <Heart
                size={20}
                className={isWished ? "fill-white" : "fill-none"}
              />
              {isWished ? "Sent!" : "Send Love"}
            </motion.button>

            {/* Secondary Action (e.g., Playlist or Gift) */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              className="w-12 h-12 flex items-center justify-center bg-white border-2 border-main rounded-xl text-accent shadow-sm"
            >
              <Gift size={20} />
            </motion.button>

          </motion.div>
        </div>
      </motion.div>

      {/* --- Confetti Effect (Simple Framer Motion Implementation) --- */}
      <AnimatePresence>
        {isWished && (
          <>
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 1, 
                  x: "50vw", // Start from center
                  y: "50vh",
                  scale: 0
                }}
                animate={{
                  opacity: 0,
                  x: `calc(50vw + ${(Math.random() - 0.5) * 600}px)`,
                  y: `calc(50vh - ${Math.random() * 400 + 100}px)`,
                  rotate: Math.random() * 360,
                  scale: Math.random() + 0.5,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute z-50 pointer-events-none"
              >
                {i % 3 === 0 ? (
                  <Heart size={24} className="text-accent fill-accent" />
                ) : i % 3 === 1 ? (
                  <Sparkles size={24} className="text-main fill-main" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-accent" />
                )}
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}