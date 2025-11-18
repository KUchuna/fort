"use client"

import './embla.css'
import EmblaCarousel from './EmblaCarousel'

const SLIDES = [
  { id: 0, title: 'Slide 1', category: 'Category A' },
  { id: 1, title: 'Slide 2', category: 'Category B' },
  { id: 2, title: 'Slide 3', category: 'Category C' },
  { id: 3, title: 'Slide 4', category: 'Category D' },
  { id: 4, title: 'Slide 5', category: 'Category E' },
]

export default function EmblaContainer() {
  return <EmblaCarousel slides={SLIDES} />
}
