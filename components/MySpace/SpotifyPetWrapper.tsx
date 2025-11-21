'use client';

import { useState } from 'react';
import PixelPet from "@/components/MySpace/PixelPet";
import SpotifyPlayer from "@/components/MySpace/SpotifyPlayer";

export default function SpotifyPetWrapper() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="pt-6 relative">
      <PixelPet isMusicPlaying={isPlaying} />
      <div className="flex justify-between items-top">
        <SpotifyPlayer onPlayChange={setIsPlaying} />
      </div>
    </div>
  );
}