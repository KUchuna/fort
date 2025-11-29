"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import Link from "next/link";
import Image from "next/image"; // Don't forget this import
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import gift from "@/public/images/gift.png";

export default function Header() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  
  const { data: session } = authClient.useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  // --- UPDATED NAV LINKS ---
  const navLinks = [
    { name: "About me", href: "/interests" },
    { name: "Gallery", href: "/gallery" },
    { name: "Chatroom", href: "/chatroom" },
    // Added the 'image' property here
    { name: "Wishlist", href: "/wishlist", image: gift }, 
  ];

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
  }, [isOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await authClient.signOut({
        fetchOptions: {
            onSuccess: () => {
                setIsOpen(false); 
                router.refresh(); 
                router.push("/"); 
            }
        }
    });
    setIsLoggingOut(false);
  };

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || isOpen
            ? "py-4 bg-white/70 backdrop-blur-md border-b border-white/20 shadow-sm"
            : "py-6 bg-transparent"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {isScrolled && (
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
        )}

        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
          
          {/* Logo */}
          <Link href={"/"} className="relative z-50 group">
            <div className="uppercase font-gilroy text-lg tracking-wide text-black">
              <span className="italic font-light group-hover:text-accent transition-colors duration-300">Tamar</span>{" "}
              <span className="font-bold">Chirgadze</span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden md:flex gap-8 items-center">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="relative group">
                
                {/* --- GIFT IMAGE LOGIC --- */}
                {link.image && (
                    <motion.div
                        className="absolute -top-5 -right-3 pointer-events-none"
                        animate={{ 
                            y: [0, -3, 0], 
                            rotate: [0, 5, 0, -5, 0] 
                        }}
                        transition={{ 
                            duration: 4, 
                            repeat: Infinity, 
                            ease: "easeInOut" 
                        }}
                    >
                        <Image 
                            src={link.image} 
                            alt="gift" 
                            className="w-6 h-auto drop-shadow-sm" 
                        />
                    </motion.div>
                )}

                <span className="font-gilroy font-medium text-sm uppercase tracking-wider text-black/80 hover:text-black transition-colors">
                  {link.name}
                </span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
            
            <div className="flex items-center gap-3">
                <Link href="/myspace">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-5 py-2 rounded-full bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-accent transition-colors"
                    >
                        Personal space
                    </motion.button>
                </Link>

                {session && (
                    <motion.button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        whileHover={{ scale: 1.1, color: "#ef4444" }} 
                        whileTap={{ scale: 0.9 }}
                        className="p-2 rounded-full text-black/60 hover:bg-black/5 transition-colors"
                        title="Sign out"
                    >
                        {isLoggingOut ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <LogOut className="w-5 h-5" />
                        )}
                    </motion.button>
                )}
            </div>
          </nav>

          {/* Mobile Toggle */}
          <div className="md:hidden relative z-50">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full hover:bg-black/5 transition-colors"
            >
                <motion.div
                    animate={isOpen ? "open" : "closed"}
                    className="w-6 h-6 flex flex-col justify-center gap-1.5"
                >
                    <motion.span 
                        variants={{
                            closed: { rotate: 0, y: 0 },
                            open: { rotate: 45, y: 8, backgroundColor: "#000" }
                        }}
                        className="w-6 h-0.5 bg-black block origin-center transition-colors"
                    />
                    <motion.span 
                        variants={{
                            closed: { opacity: 1 },
                            open: { opacity: 0 }
                        }}
                        className="w-6 h-0.5 bg-black block transition-colors"
                    />
                    <motion.span 
                        variants={{
                            closed: { rotate: 0, y: 0 },
                            open: { rotate: -45, y: -8, backgroundColor: "#000" }
                        }}
                        className="w-6 h-0.5 bg-black block origin-center transition-colors"
                    />
                </motion.div>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-white/95 backdrop-blur-xl md:hidden flex flex-col items-center justify-center "
          >
            <div className="absolute top-1/4 right-0 w-64 h-64 bg-main rounded-full blur-[100px] opacity-50" />
            <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-accent rounded-full blur-[100px] opacity-30" />

            <ul className="flex flex-col items-center gap-8 relative z-10">
              {navLinks.map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                  className="relative"
                >
                  <Link 
                    href={link.href} 
                    onClick={() => setIsOpen(false)}
                    className="font-gilroy font-bold text-3xl text-black hover:text-accent transition-colors relative"
                  >
                    {/* --- MOBILE GIFT IMAGE --- */}
                    {link.image && (
                        <motion.div
                            className="absolute -top-6 -right-6 pointer-events-none"
                            animate={{ rotate: [0, 10, 0, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <Image 
                                src={link.image} 
                                alt="gift" 
                                className="w-8 h-auto" 
                            />
                        </motion.div>
                    )}
                    {link.name}
                  </Link>
                </motion.li>
              ))}

              <motion.li
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: 0.1 + 3 * 0.1 }}
                >
                  <Link 
                    href={"/myspace"} 
                    onClick={() => setIsOpen(false)}
                    className="font-gilroy font-bold text-3xl text-black hover:text-accent transition-colors"
                  >
                    Personal space
                  </Link>
                </motion.li>

                {session && (
                    <motion.li
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ delay: 0.1 + 4 * 0.1 }}
                    >
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="flex items-center gap-2 font-gilroy font-bold text-xl text-red-500 hover:text-red-600 transition-colors mt-4"
                        >
                            {isLoggingOut ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <LogOut className="w-5 h-5" />
                                    Logout
                                </>
                            )}
                        </button>
                    </motion.li>
                )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}