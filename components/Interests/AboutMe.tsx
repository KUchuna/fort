'use client';

import { motion } from "framer-motion";
import { MoveRight, Star, HeartHandshake } from "lucide-react";
import Image from "next/image"; 
import Link from "next/link";

export default function AboutMe() {
  return (
    <section className="w-full py-24 px-6 md:px-12 bg-white relative overflow-hidden rounded-[20px]">
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative w-full aspect-[4/5] md:aspect-square lg:aspect-[4/5]"
        >
          <div className="absolute top-8 -left-8 w-full h-full bg-main rounded-[3rem] -rotate-3" />
          <div className="absolute bottom-8 -right-8 w-full h-full border-2 border-accent rounded-[3rem] rotate-3" />
          
          <div className="absolute inset-0 bg-background rounded-[3rem] overflow-hidden shadow-2xl">
        
                <Image 
                   src="/images/TEMP3.jpg" 
                   alt="About Me" 
                   fill 
                   className="object-cover" 
                /> 
               
             <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-8 left-8 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white max-w-[200px]"
             >
                <div className="flex items-center gap-2 mb-1">
                    <HeartHandshake className="w-5 h-5 text-accent" />
                    <span className="font-gilroy font-bold text-sm">Vibe Check</span>
                </div>
                <p className="text-xs text-black/60">Always looking for the magic in the mundane.</p>
             </motion.div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-8"
        >
          <div>
            <span className="font-gilroy font-bold text-accent tracking-widest uppercase text-sm">
                About The Persona
            </span>
            <h2 className="font-gilroy text-5xl md:text-6xl font-bold mt-4 text-black leading-[1.1]">
              Dreaming in <br />
              <span className="relative inline-block">
                Color
                <span className="absolute bottom-1 left-0 w-full h-3 bg-main/50 -z-10 rounded-full" />
              </span>.
            </h2>
          </div>

          <div className="space-y-6 text-lg text-black/70 leading-relaxed font-medium">
            <p>
              Whether I'm curating playlists, exploring new aesthetics, or just trying to keep my plants alive, 
              I approach everything with a sense of wonder.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
             <div className="p-4 bg-background rounded-2xl border border-main/50">
                <Star className="w-5 h-5 text-accent mb-2 fill-accent" />
                <h4 className="font-gilroy font-bold text-black">Aesthetic</h4>
                <p className="text-sm text-black/60">Warm</p>
             </div>
             <div className="p-4 bg-background rounded-2xl border border-main/50">
                <MoveRight className="w-5 h-5 text-accent mb-2" />
                <h4 className="font-gilroy font-bold text-black">Focus</h4>
                <p className="text-sm text-black/60">Visual Storytelling</p>
             </div>
          </div>

          <div className="pt-4">
            <Link href={"https://www.linkedin.com/in/tamar-chirgadze-44b82720a/"} target="__blank">
                <button className="group flex items-center gap-3 px-8 py-4 bg-black text-white rounded-full font-gilroy font-bold transition-all hover:bg-accent hover:shadow-lg hover:shadow-accent/40">
                Get to know me
                <MoveRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
            </Link>
          </div>
        </motion.div>

      </div>
    </section>
  );
}