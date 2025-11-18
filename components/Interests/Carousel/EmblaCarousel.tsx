"use client"

import React, { useState } from "react"
import { EmblaOptionsType } from "embla-carousel"
import { PrevButton, NextButton, usePrevNextButtons } from "./EmblaCarouselArrowButtons"
import useEmblaCarousel from "embla-carousel-react"
import TiltCard from "@/components/Globals/TiltCard"
import { motion, AnimatePresence } from "framer-motion"
import temp from "@/public/images/interests.png"
import Image from "next/image"

type SlideType = {
  id: number
  title: string
  category: string
}

type PropType = {
  slides: SlideType[]
  options?: EmblaOptionsType
}

const EmblaCarousel: React.FC<PropType> = ({ slides, options }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(options)
  const { prevBtnDisabled, nextBtnDisabled, onPrevButtonClick, onNextButtonClick } = usePrevNextButtons(emblaApi)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selectedCard = slides.find((s) => s.id === selectedId)

  return (
    <section className="embla">
      {/* Carousel Viewport */}
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container">
          {slides.map((slide) => (
            <motion.div
              className="embla__slide"
              key={slide.id}
              layoutId={`card-container-${slide.id}`}
              onClick={() => setSelectedId(slide.id)}
              style={{ cursor: "pointer" }}
              initial={{ borderRadius: "20px" }}
            >
              <TiltCard>
                <motion.div 
                  className="card-content" 
                  style={{ height: "300px" }} // Thumbnail height
                >
                  <motion.div 
                    className="card-image-container" 
                    layoutId={`card-image-container-${slide.id}`}
                  >
                    <Image
                      className="card-image"
                      src={temp}
                      alt={slide.title}
                      fill
                      priority
                    />
                  </motion.div>

                  <motion.div 
                    className="title-container" 
                    layoutId={`title-container-${slide.id}`}
                  >
                    <span className="category">{slide.category}</span>
                    <h2 className="card-title">{slide.title}</h2>
                  </motion.div>
                </motion.div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="embla__controls">
        <div className="embla__buttons">
          <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
          <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
        </div>
      </div>

      {/* EXPANDED VIEW */}
      <AnimatePresence>
        {selectedId !== null && selectedCard && (
          <>
            <motion.div
              className="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
            />

            <div className="card-content-container open">
              <motion.div
                className="card-content"
                layoutId={`card-container-${selectedId}`}
                style={{ 
                    borderRadius: "20px", 
                    overflow: "hidden", 
                }}
              >
                <motion.div
                  className="card-image-container"
                  layoutId={`card-image-container-${selectedId}`}
                >
                  <Image
                    className="card-image"
                    src={temp}
                    alt={selectedCard.title}
                    fill
                    priority
                  />
                </motion.div>

                {/* TITLE */}
                <motion.div
                  className="title-container"
                  layoutId={`title-container-${selectedId}`}
                >
                  <span className="category">{selectedCard.category}</span>
                  <h2 className="card-title">{selectedCard.title}</h2>
                </motion.div>

                {/* TEXT CONTENT */}
                <motion.div
                  className="content-container"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                >
                  <p>
                    The image is fixed at the top, and this text is pushed down by padding. 
                  </p>
                  <p>
                     Because we added `overflowY: auto` to the parent motion div, 
                     you can now scroll this text, and the rounded corners will stay fixed!
                  </p>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                  </p>
                </motion.div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </section>
  )
}

export default EmblaCarousel