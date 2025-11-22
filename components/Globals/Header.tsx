"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "About me", href: "/interests" },
    { name: "Gallery", href: "/gallery" },
    { name: "Chatroom", href: "/chatroom" },
    { name: "Personal Space", href: "/myspace" },
  ];

  return (
    // Preserved original header styling exactly
    <header className="bg-main p-6 md:rounded-[20px] sticky md:static top-0 z-1000 text-lg uppercase">
      <div className="flex justify-between items-center">
        <Link href={"/"} className="uppercase">
          <i>Tamar</i> <span className="font-semibold">Chirgadze</span>
        </Link>

        {/* Desktop Menu: Added 'hidden md:flex' to hide on mobile */}
        <ul className="hidden md:flex gap-6 font-light select-none">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <motion.li
                whileHover={{ backgroundColor: "#F8AFA6", scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="px-2 py-1 rounded-md cursor-pointer bg-main"
              >
                {link.name}
              </motion.li>
            </Link>
          ))}
        </ul>

        {/* Mobile Hamburger: Only visible on mobile (md:hidden) */}
        <div className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          <motion.div
            animate={isOpen ? "open" : "closed"}
            className="w-6 h-6 flex flex-col justify-center items-center gap-1.5 cursor-pointer"
          >
            <motion.span
              variants={{
                closed: { rotate: 0, y: 0 },
                open: { rotate: 45, y: 8 },
              }}
              className="w-full h-0.5 bg-black block origin-center"
            />
            <motion.span
              variants={{
                closed: { opacity: 1 },
                open: { opacity: 0 },
              }}
              className="w-full h-0.5 bg-black block"
            />
            <motion.span
              variants={{
                closed: { rotate: 0, y: 0 },
                open: { rotate: -45, y: -8 },
              }}
              className="w-full h-0.5 bg-black block origin-center"
            />
          </motion.div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden"
          >
            <ul className="flex flex-col items-center gap-4 pt-6 font-light select-none">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}>
                  <motion.li
                    whileHover={{ backgroundColor: "#F8AFA6", scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="px-2 py-1 rounded-md cursor-pointer bg-main"
                  >
                    {link.name}
                  </motion.li>
                </Link>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}