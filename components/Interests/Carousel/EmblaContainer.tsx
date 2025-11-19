"use client"

import './embla.css'
import EmblaCarousel from './EmblaCarousel'

const SLIDE_COUNT = 5
const SLIDES = Array.from(Array(SLIDE_COUNT).keys())

export default function EmblaContainer() {
    return (
        <EmblaCarousel slides={SLIDES} />
    )
}