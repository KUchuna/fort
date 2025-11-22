"use client";
import { motion } from "motion/react";
import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-main p-6 rounded-[20px] text-lg uppercase">
      <div className="flex justify-between items-center">
        <Link href={"/"} className="uppercase"><i>Tamar</i> <span className="font-semibold">Chirgadze</span></Link>

        <ul className="flex gap-6 font-light select-none">
          <Link href={"/gallery"}>
            <motion.li
              whileHover={{ backgroundColor: "#F8AFA6", scale: 1.1 }}
              whileTap={{scale: 0.9}}
              className="px-2 py-1 rounded-md cursor-pointer bg-main"
            >
                Gallery
            </motion.li>
          </Link>
          <Link href={"/chatroom"}>
            <motion.li
              whileHover={{ backgroundColor: "#F8AFA6", scale: 1.1 }}
              whileTap={{scale: 0.9}}
              className="px-2 py-1 rounded-md cursor-pointer bg-main"
            >
                Chatroom
            </motion.li>
          </Link>
          <Link href={"/myspace"}>
            <motion.li
              whileHover={{ backgroundColor: "#F8AFA6", scale: 1.1 }}
              whileTap={{scale: 0.9}}
              className="px-2 py-1 rounded-md cursor-pointer bg-main"
            >
                Personal Space
            </motion.li>
          </Link>
        </ul>
      </div>
    </header>
  );
}
