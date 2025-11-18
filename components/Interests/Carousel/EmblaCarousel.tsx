"use client"

import React, { useState } from 'react'
import { EmblaOptionsType } from 'embla-carousel'
import { PrevButton, NextButton, usePrevNextButtons } from './EmblaCarouselArrowButtons'
import useEmblaCarousel from 'embla-carousel-react'
import TiltCard from '@/components/Globals/TiltCard'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import temp from "@/public/images/interests.png"

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

  // Use null instead of 0 as default
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selectedCard = slides.find((s) => s.id === selectedId)

  return (
    <section className="embla">
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container">
          {slides.map((slide) => (
            <motion.div
              className="embla__slide"
              key={slide.id}
              layoutId={`card-container-${slide.id.toString()}`}
              onClick={() => setSelectedId(slide.id)}
              style={{ cursor: 'pointer' }}
            >
              <TiltCard>
                <motion.div className="card-content" layoutId={`card-content-${slide.id.toString()}`}>
                  <motion.div className="card-image-container" layoutId={`card-image-container-${slide.id.toString()}`}>
                    <Image 
                      src={temp} width={100} height={100} alt=''
                      className="card-image"
                      style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: 10 }}
                    />
                  </motion.div>
                  <motion.div className="title-container" layoutId={`title-container-${slide.id.toString()}`} style={{ padding: '10px' }}>
                    <span className="category">{slide.category}</span>
                    <h2>{slide.title}</h2>
                  </motion.div>
                </motion.div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Carousel Controls */}
      <div className="embla__controls">
        <div className="embla__buttons">
          <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
          <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
        </div>
      </div>

      {/* Fullscreen Overlay + Expanded Card */}
      <AnimatePresence>
        {selectedId !== null && selectedCard && (
          <>
            <motion.div
              className="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
            />

            <motion.div
              className="card-content-container open"
              layoutId={`card-container-${selectedId.toString()}`}
              style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }}
            >
              <motion.div className="card-content" layoutId={`card-content-${selectedId.toString()}`}>
                <motion.div className="card-image-container" layoutId={`card-image-container-${selectedId.toString()}`}>
                  <Image
                    className="card-image"
                    src={temp}
                    alt={selectedCard.title}
                    style={{ width: '100%', height: '300px', objectFit: 'cover' }}
                  />
                </motion.div>
                <motion.div className="title-container" layoutId={`title-container-${selectedId.toString()}`} style={{ padding: '20px' }}>
                  <span className="category">{selectedCard.category}</span>
                  <h2>{selectedCard.title}</h2>
                </motion.div>
                <motion.div className="content-container" animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                  <p>This is expanded content for the card. You can put text, images, or any other component here.</p>
                  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum vestibulum.</p>
                </motion.div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  )
}

export default EmblaCarousel
