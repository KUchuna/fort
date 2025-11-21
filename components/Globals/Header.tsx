"use client";
import { motion } from "motion/react";
import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-main p-6 rounded-[20px] text-lg uppercase">
      <div className="flex justify-between items-center">
        <Link href={"/"} className="uppercase"><i>Tamar</i> <span className="font-semibold">Chirgadze</span></Link>

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
            <Link href={"/gallery"}>
              Gallery
            </Link>
          </motion.li>

          <motion.li
            whileHover={{ backgroundColor: "#F8AFA6", scale: 1.1 }}
            whileTap={{scale: 0.9}}
            className="px-2 py-1 rounded-md cursor-pointer bg-main"
          >
            <Link href={"/myspace"}>
              Personal Space
            </Link>
          </motion.li>
        </ul>
      </div>
    </header>
  );
}
