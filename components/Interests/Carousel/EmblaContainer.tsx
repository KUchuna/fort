"use client"

import './embla.css'
import EmblaCarousel from './EmblaCarousel'

const SLIDES = [
    {
        id: 1,
        image: '/images/interests/music.jpg',
        title: "Music",
        description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Placeat explicabo, quisquam commodi nemo doloremque ullam? Eius nostrum placeat maiores"
    },
    {
        id: 2,
        image: '/images/interests/travel.jpg',
        title: "Travel",
        description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Placeat explicabo, quisquam commodi nemo doloremque ullam? Eius nostrum placeat maiores"
    },
    {
        id: 3,
        image: '/images/interests/music.jpg',
        title: "Music",
        description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Placeat explicabo, quisquam commodi nemo doloremque ullam? Eius nostrum placeat maiores"
    },
    {
        id: 4,
        image: '/images/interests/music.jpg',
        title: "Music",
        description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Placeat explicabo, quisquam commodi nemo doloremque ullam? Eius nostrum placeat maiores"
    },
    {
        id: 5,
        image: '/images/interests/music.jpg',
        title: "Music",
        description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Placeat explicabo, quisquam commodi nemo doloremque ullam? Eius nostrum placeat maiores"
    },
]

export default function EmblaContainer() {
    return (
        <EmblaCarousel slides={SLIDES} />
    )
}