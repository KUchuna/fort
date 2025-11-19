"use client"

import { useRef, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import temp from "@/public/images/TEMP2.jpg"

export default function HeroImage() {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // convert to -1 → 1 range
    const xPercent = (x / rect.width) * 2 - 1
    const yPercent = (y / rect.height) * 2 - 1

    setPos({ x: xPercent, y: yPercent })
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setPos({ x: 0, y: 0 })}
      whileHover={{
        y: -6,
        scale: 1.02,
        boxShadow: "0px 8px 20px rgba(255, 182, 193, 0.25)",
      }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="rounded-[20px] overflow-hidden"
    >
      <motion.div
        animate={{
          scale: 1.2,
          x: -pos.x * 30, // adjust intensity
          y: -pos.y * 30,
        }}
        transition={{ type: "spring", stiffness: 80, damping: 15 }}
        className="w-full h-full"
      >
        <Image 
          src={temp}
          width={500}
          height={500}
          alt="image"
          className="w-full h-full object-cover object-center"
        />
      </motion.div>
    </motion.div>
  )
}
