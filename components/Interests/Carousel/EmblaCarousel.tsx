"use client"

import React, { useState } from 'react'
import { EmblaOptionsType } from 'embla-carousel'
import AutoScroll from 'embla-carousel-auto-scroll'
import useEmblaCarousel from 'embla-carousel-react'
import TiltCard from '@/components/Globals/TiltCard'
import { motion, AnimatePresence } from "framer-motion"
import Image from 'next/image'

interface Slide {
  id: number;
  image: string;
  title: string;
  description: string;
} 

type PropType = {
  slides: Slide[]
  options?: EmblaOptionsType
}

const MotionImage = motion(Image);

const EmblaCarousel: React.FC<PropType> = (props) => {
  const { slides, options } = props
  const [emblaRef, emblaApi] = useEmblaCarousel(options, [AutoScroll({ playOnInit: true, speed: 2, startDelay: 500, stopOnInteraction: false })])

  const [selectedId, setSelectedId] = useState<number | null>(null)

  const selectedSlide = slides.find(slide => slide.id === selectedId)


  return (
    <section className="embla relative">
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container">
          {slides.map((slide) => (
            <div className="embla__slide" key={slide.id}>
              <div onClick={() => setSelectedId(slide.id)} className="cursor-pointer h-full">
                <TiltCard>
                  <motion.div
                    className="relative w-full h-69 rounded-xl overflow-hidden"
                    layoutId={`card-container-${slide.id}`}
                  >
                    <motion.div
                      layoutId={`card-image-container-${slide.id}`}
                      className="absolute inset-0 z-10"
                    >
                      <MotionImage
                        src={slide.image}
                        alt={`Card ${slide.id}`}
                        className="w-full h-full object-cover"
                        priority
                        width={1000}
                        height={1000}
                      />
                    </motion.div>
                    <motion.div className="absolute bottom-0 left-0 p-4 z-30">
                      <h2 className="text-white font-bold">{slide.title}</h2>
                    </motion.div>
                  </motion.div>
                </TiltCard>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selectedId !== null && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-start justify-center pt-6 pointer-events-none"
            key={selectedId}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
            />

            <motion.div
              layoutId={`card-container-${selectedId}`}
              className="relative w-full h-max max-w-[90%] md:max-w-[45%] bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col pointer-events-auto my-auto"
              transition={{
                layout: { type: "spring", stiffness: 300, damping: 40 },
              }}
            >
              <motion.div
                layoutId={`card-image-container-${selectedId}`}
                className="w-full relative shrink-0 overflow-hidden"
                transition={{
                  layout: { type: "spring", stiffness: 300, damping: 30 },
                }}
              >
                <MotionImage
                  src={selectedSlide?.image}
                  alt={`Card ${selectedId}`}
                  className="w-full h-full origin-top-left" 
                  priority
                  initial={{ scale: 1 }}    // Start normal
                  animate={{ scale: 1.3 }}  // Zoom in on open
                  exit={{ scale: 1 }}       // Zoom back out on close
                  transition={{
                    duration: 0.6,
                    ease: "easeInOut",
                  }}
                  width={1000}
                  height={1000}
                />
              </motion.div>

              <div className="p-6 text-white">
                <h2 className="text-3xl font-bold mb-4">{selectedSlide?.title}</h2>
                <p className="leading-relaxed text-sm">
                  {selectedSlide?.description}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default EmblaCarousel