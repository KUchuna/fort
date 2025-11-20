"use client"

import { useRef } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import Image from "next/image"
import temp from "@/public/images/TEMP2.jpg"

export default function HeroImage() {
  const ref = useRef<HTMLDivElement>(null)

  // 1. Use MotionValues instead of useState
  // This prevents React from re-rendering on every mouse move
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // 2. Create smooth spring animations based on the raw inputs
  const mouseXSpring = useSpring(x, { stiffness: 200, damping: 15 })
  const mouseYSpring = useSpring(y, { stiffness: 200, damping: 15 })

  // 3. Transform the standard -1 to 1 range into pixel movement
  // This replaces your: x: -pos.x * 30
  const xRange = useTransform(mouseXSpring, [-1, 1], [30, -30])
  const yRange = useTransform(mouseYSpring, [-1, 1], [30, -30])

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return

    const clientX = e.clientX - rect.left
    const clientY = e.clientY - rect.top

    const xPercent = (clientX / rect.width) * 2 - 1
    const yPercent = (clientY / rect.height) * 2 - 1

    // Update the MotionValues directly (does not trigger re-render)
    x.set(xPercent)
    y.set(yPercent)
  }

  const handleMouseLeave = () => {
    // Reset to center
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{
        y: -6,
        scale: 1.02,
        boxShadow: "0px 8px 20px rgba(255, 182, 193, 0.25)",
      }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="rounded-[20px] overflow-hidden"
    >
      <motion.div
        style={{
          x: xRange,
          y: yRange, 
          scale: 1.05
        }}
        whileHover={{scale: 1.2}}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-full h-full"
      >
        <Image
          src={temp}
          width={500}
          height={500}
          alt="image"
          className="w-full h-full object-cover object-center pointer-events-none"
        />
      </motion.div>
    </motion.div>
  )
}