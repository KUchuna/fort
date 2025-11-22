"use client"

import Image from "next/image";
import flower from "@/public/icons/flower.svg";
import circle from "@/public/icons/circle.svg";
import {motion} from "motion/react";
import HeroImage from "./HeroImage";
import obsessions from "@/public/icons/obsessions.png"

interface HomeLeftProps {
    obsession: any
}

export default function HomeLeft({obsession}: HomeLeftProps) {
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
                    <p className="mt-auto mb-20 3xl:text-5xl text-3xl w-[70%]">
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
                        I’m an outgoing and endlessly curious person who loves saying yes to new experiences - whether it’s discovering hidden places, trying something completely unexpected, or meeting people with stories that spark my imagination. I’m happiest when life feels a little adventurous, a little chaotic, and full of possibility.
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
                    className="group rounded-[20px] p-6 bg-accent flex flex-col flex-1 justify-between">
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-start w-full gap-6 items-center text-white">
                            <h2 className="text-3xl font-semibold">Current Obsessions</h2>
                            <Image src={obsessions} alt="" width={30} height={30} className="group-hover:drop-shadow-[0_-10px_6px_rgba(255,255,255,0.8)] transition-all duration-300"/>
                        </div>
                        <p className="font-medium">What has captured my imagination lately</p>
                    </div>
                    <div>
                        <p>{obsession?.description}</p>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}