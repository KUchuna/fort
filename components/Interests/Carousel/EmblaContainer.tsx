"use client"

import './embla.css'
import EmblaCarousel from './EmblaCarousel'
import { EmblaOptionsType } from 'embla-carousel'
import { Sparkles } from 'lucide-react'

const SLIDES = [
    {
        id: 1,
        image: '/images/interests/music.jpg', 
        title: "Sonic Moods",
        description: "Music isn't just background noise; it's the soundtrack to my life. Whether it's rainy day jazz or upbeat pop, I curate playlists for every specific emotion."
    },
    {
        id: 2,
        image: '/images/interests/travel.jpg',
        title: "Wanderlust",
        description: "Collecting sunsets and passport stamps. My favorite memories usually involve getting lost in a new city without a map and finding the best local coffee."
    },
    {
        id: 3,
        image: '/images/interests/anime.webp',
        title: "Anime",
        description: "I appreciate the storytelling depth in animation. From comforting visuals to complex character arcs, it is a huge source of my visual inspiration."
    },
    {
        id: 4,
        image: '/images/interests/video.jpg',
        title: "Visual Diaries",
        description: "Capturing moments is fun, but weaving them together is where the magic happens. I love video editing and color grading to make memories feel cinematic."
    },
    {
        id: 5,
        image: '/images/interests/fashion.jpg',
        title: "Curated Style",
        description: "It's not about trends, it's about expression. I view fashion and shopping as a way to curate a personal aesthetic that speaks before I even say a word."
    },
]

const OPTIONS: EmblaOptionsType = { loop: true }

export default function EmblaContainer() {
    return (
        <section className="w-full py-20 bg-background relative overflow-hidden">
            
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-main rounded-full blur-[100px] opacity-40 pointer-events-none" />
            
            <div className="max-w-7xl mx-auto px-6 md:px-12 mb-12 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-white rounded-full border border-main">
                                <Sparkles className="w-3 h-3 text-accent" />
                            </div>
                            <span className="text-xs font-gilroy font-bold tracking-[0.2em] uppercase text-accent">
                                My Collections
                            </span>
                        </div>
                        <h2 className="font-gilroy text-4xl md:text-5xl font-bold text-black leading-tight">
                            Things that make my <br />
                            <span className="italic text-accent">heart beat</span> faster.
                        </h2>
                    </div>

                    <div className="max-w-sm">
                        <p className="text-black/60 text-sm leading-relaxed border-l-2 border-accent pl-4">
                            Welcome to my digital garden. Click on any card below to dive deeper into the inspirations that fuel my creativity and daily life.
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative z-10">
                 <EmblaCarousel slides={SLIDES} options={OPTIONS}/>
            </div>
            
        </section>
    )
}