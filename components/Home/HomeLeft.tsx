"use client"

import Image from "next/image";
import flower from "@/public/icons/flower.svg";
import circle from "@/public/icons/circle.svg";
import {motion} from "motion/react";
import HeroImage from "./HeroImage";

export default function HomeLeft() {
    return (
        <section className="flex flex-col gap-6 w-[70%]">
            <div className="flex gap-6 w-full h-[60%]">
                <motion.div className="relative container flex w-[80%] group"
                     whileHover={{
                        y: -6,
                        scale: 1.02,
                        boxShadow: "0px 8px 20px rgba(255, 182, 193, 0.25)",
                    }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                    <p className="mt-auto mb-20 text-5xl w-[70%]">
                        A <span className="font-semibold">Vibrant</span> Personality Thriving on <span className="font-semibold">Connection, Spontaneity, and Discovery</span>
                    </p>
                    <Image src={flower} alt="" width={200} height={200} className="absolute right-6 top-6 group-hover:rotate-90 transition-all duration-200"/>
                </motion.div>
                <HeroImage />
            </div>

            <div className="flex gap-6 h-[40%]">
                <motion.div
                    whileHover={{
                        y: -6,
                        scale: 1.02,
                        boxShadow: "0px 8px 20px rgba(255, 182, 193, 0.25)",
                    }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="flex flex-1 container relative group">
                    <p className="mt-auto 3xl:w-5/7 3xl:text-lg text-sm">
                        I’m an outgoing and endlessly curious person who loves saying yes to new experiences - whether it’s discovering hidden places, trying something completely unexpected, or meeting people with stories that spark my imagination. I’m happiest when life feels a little adventurous, a little chaotic, and full of possibility. I like to think of myself as someone who brings energy and warmth wherever I go, someone who laughs easily, connects quickly, and embraces every moment with an open mind. If there’s something new to explore, I’m already on my way.
                    </p>
                    <Image src={circle} alt="" width={100} height={100} className="absolute left-6 top-6 group-hover:-rotate-90 transition-all duration-200 w-[50px] 3xl:w-[100px]"/>
                </motion.div>
                <motion.div
                    whileHover={{
                        y: -6,
                        scale: 1.02,
                        boxShadow: "0px 8px 20px rgba(255, 182, 193, 0.25)",
                    }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="rounded-[20px] p-6 bg-accent flex flex-col flex-1 justify-between">
                    <div className="flex justify-between w-full">
                        <button>HELLO WORLD</button>
                        <button>SEE MORE</button>
                    </div>
                    <div>
                        <p className="text-5xl">Contact me</p>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}