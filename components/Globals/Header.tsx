"use client";
import { motion } from "motion/react";

export default function Header() {
  return (
    <header className="bg-main p-6 rounded-[20px] text-lg uppercase">
      <div className="flex justify-between items-center">
        <p className="uppercase"><i>Name</i> <span className="font-semibold">surname</span></p>

        <ul className="flex gap-6 font-light select-none">
          <motion.li
            whileHover={{ backgroundColor: "#F8AFA6", scale: 1.1 }}
            whileTap={{scale: 0.9}}
            className="px-2 py-1 rounded-md cursor-pointer bg-main"
          >
            About Me
          </motion.li>

          <motion.li
            whileHover={{ backgroundColor: "#F8AFA6", scale: 1.1 }}
            whileTap={{scale: 0.9}}
            className="px-2 py-1 rounded-md cursor-pointer bg-main"
          >
            Gallery
          </motion.li>

          <motion.li
            whileHover={{ backgroundColor: "#F8AFA6", scale: 1.1 }}
            whileTap={{scale: 0.9}}
            className="px-2 py-1 rounded-md cursor-pointer bg-main"
          >
            Personal Space
          </motion.li>
        </ul>
      </div>
    </header>
  );
}
