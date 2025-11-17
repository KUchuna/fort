"use client"

import Image from "next/image";
import temp from "@/public/images/TEMP.png";
import {motion} from "motion/react";

export default function HomeLeft() {
    return (
        <section className="flex flex-col gap-6 w-[70%] h-full">
            <div className="flex gap-6 w-full h-[60%]">
                <motion.div className="container flex w-[80%]"
                     whileHover={{
                        y: -6,
                        scale: 1.02,
                        boxShadow: "0px 8px 20px rgba(255, 182, 193, 0.25)",
                    }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                    <p className="mt-auto mb-20 text-5xl w-[70%] font-semibold">
                        Artist Redefining Architecture with AI-Driven Design
                    </p>
                </motion.div>
                <motion.div
                    whileHover={{
                        y: -6,
                        scale: 1.02,
                        boxShadow: "0px 8px 20px rgba(255, 182, 193, 0.25)",
                    }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }} 
                    className="rounded-[20px] overflow-hidden">
                    <Image src={temp} width={500} height={500} alt={"image"} className="w-full h-full object-cover"/>
                </motion.div>
            </div>

            <div className="flex gap-6 h-[40%]">
                <motion.div
                    whileHover={{
                        y: -6,
                        scale: 1.02,
                        boxShadow: "0px 8px 20px rgba(255, 182, 193, 0.25)",
                    }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="flex flex-1 container">
                    <p className="mt-auto w-5/7 text-lg">
                        Julia Huang is an innovative AI artist, renowned for blending cutting-edge technology with creative expression. Based in LA, she crafts unique digital art experiences accessible globally.
                    </p>
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