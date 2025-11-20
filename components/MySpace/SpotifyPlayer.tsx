"use client"

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { getAccessToken, transferPlayback } from '@/app/actions'

const formatTime = (ms: number) => {
  if (!ms && ms !== 0) return '0:00'
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
}

const trackInitialState = {
  name: "",
  album: { images: [{ url: "" }] },
  artists: [{ name: "" }]
}

export default function SpotifyPlayer() {
  // Player State
  const [player, setPlayer] = useState<any>(undefined)
  const [deviceId, setDeviceId] = useState<string>("")
  const [is_paused, setPaused] = useState(false)
  const [is_active, setActive] = useState(false)
  const [current_track, setTrack] = useState(trackInitialState)
  
  // UI State
  const [isLoading, setIsLoading] = useState(false) // <--- NEW: Tracks button click
  
  // Progress State
  const [duration, setDuration] = useState(0)
  const [position, setPosition] = useState(0)
  const [volume, setVolume] = useState(0.5)

  useEffect(() => {
    let isMounted = true
    let playerInstance: any = null

    const initializePlayer = () => {
      const player = new window.Spotify.Player({
        name: 'My Personal Page',
        getOAuthToken: async (cb: any) => { 
            try {
                const token = await getAccessToken(); 
                cb(token); 
            } catch (e) {
                console.error("Token Fetch Error", e);
            }
        },
        volume: 0.5
      })

      playerInstance = player

      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        if (isMounted) {
            console.log('✅ Spotify Player Ready. Device ID:', device_id)
            setDeviceId(device_id)
        }
      })

      player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('❌ Device ID has gone offline', device_id)
      })

      player.addListener('player_state_changed', (state: any) => {
        if (!isMounted || !state) return

        setTrack(state.track_window.current_track)
        setPaused(state.paused)
        setDuration(state.duration)
        setPosition(state.position)

        player.getCurrentState().then((state: any) => {
          if (isMounted) {
             // If we have a state, we are active!
             !state ? setActive(false) : setActive(true)
          }
        })
      })

      player.connect()
      if (isMounted) setPlayer(player)
    }

    // Initialize Logic
    if (window.Spotify) {
       initializePlayer()
    } else {
       window.onSpotifyWebPlaybackSDKReady = initializePlayer
       const script = document.createElement("script")
       script.src = "https://sdk.scdn.co/spotify-player.js"
       script.async = true
       document.body.appendChild(script)
    }

    // CLEANUP
    return () => {
      isMounted = false
      if (playerInstance) {
        console.log("🔌 Disconnecting Player...")
        playerInstance.disconnect()
      }
    }
  }, [])

  // Fake Timer
  useEffect(() => {
    if (is_paused || !is_active) return
    const interval = setInterval(() => {
      setPosition((prev) => Math.min(prev + 1000, duration))
    }, 1000)
    return () => clearInterval(interval)
  }, [is_paused, is_active, duration])


  // --- HANDLERS ---

  const handleTransfer = async () => {
    if (!deviceId) return
    
    setIsLoading(true) // Start loading spinner
    
    try {
        await transferPlayback(deviceId)
        // We don't manually setActive(true) here because we wait for the
        // 'player_state_changed' event to fire. 
        // But we can add a small timeout to reset loading if it hangs.
        setTimeout(() => setIsLoading(false), 2000) 
    } catch (error) {
        console.error("Transfer Failed", error)
        setIsLoading(false)
        alert("Failed to connect to Spotify. Check console.")
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPos = Number(e.target.value)
    setPosition(newPos)
    player.seek(newPos)
  }

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = Number(e.target.value)
    setVolume(newVol)
    player.setVolume(newVol)
  }

  // --- RENDER: INACTIVE STATE ---
  if (!is_active) { 
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-neutral-900/80 backdrop-blur-md rounded-2xl border border-neutral-800 w-full max-w-md text-center">
        <h3 className="text-white font-bold mb-2">
            {deviceId ? 'Ready to Play' : 'Initializing Player...'}
        </h3>
        <p className="text-neutral-400 text-sm mb-4">
            {deviceId ? 'Click below to wake up the player.' : 'Connecting to Spotify services...'}
        </p>
        
        <button 
          onClick={handleTransfer}
          disabled={!deviceId || isLoading} 
          className={`px-6 py-2 rounded-full font-medium transition-all shadow-[0_0_15px_rgba(236,72,153,0.4)] flex items-center gap-2
            ${deviceId && !isLoading
              ? 'bg-pink-500 text-white hover:bg-pink-400 hover:scale-105 active:scale-95 cursor-pointer' 
              : 'bg-neutral-700 text-neutral-500 cursor-not-allowed opacity-50'
            }
          `}
        >
          {isLoading ? (
             <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Connecting...
             </>
          ) : (
             deviceId ? 'Connect Player' : 'Loading...'
          )}
        </button>
      </div>
    )
  }

  // --- RENDER: ACTIVE PLAYER ---
  return (
    <div className="flex flex-col p-5 bg-neutral-950/90 backdrop-blur-xl rounded-3xl border border-white/10 w-full max-w-md shadow-2xl overflow-hidden relative group">
      
      {/* Top Row: Art & Info */}
      <div className="flex items-center gap-4 mb-6">
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-20 h-20 rounded-xl overflow-hidden shadow-lg shrink-0"
        >
          {current_track.album.images[0]?.url && (
              <Image 
                src={current_track.album.images[0].url} 
                alt="Album Art" 
                fill
                className={`object-cover ${!is_paused ? 'animate-pulse-slow' : ''}`} 
              />
          )}
        </motion.div>

        <div className="flex-1 min-w-0 overflow-hidden">
          <motion.h3 
            key={current_track.name} 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="font-bold text-white text-lg truncate"
          >
            {current_track.name}
          </motion.h3>
          <p className="text-sm text-pink-200/70 truncate">{current_track.artists[0].name}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex flex-col gap-1 mb-4 group/progress">
        <input 
          type="range" 
          min={0} 
          max={duration || 100} // Prevent NaN 
          value={position} 
          onChange={handleSeek}
          className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:h-2 transition-all"
        />
        <div className="flex justify-between text-xs text-neutral-500 font-medium font-mono">
          <span>{formatTime(position)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between">
        {/* Volume (Mini) */}
        <div className="flex items-center gap-2 w-24">
            <span className="text-xs text-neutral-500">🔊</span>
            <input 
                type="range" 
                min={0} 
                max={1} 
                step={0.01}
                value={volume}
                onChange={handleVolume}
                className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-neutral-400"
            />
        </div>

        {/* Playback Buttons */}
        <div className="flex items-center gap-4">
            <button 
            className="text-neutral-400 hover:text-white transition hover:scale-110 active:scale-95" 
            onClick={() => player.previousTrack()}
            >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
            </button>

            <button 
            className="w-12 h-12 flex items-center justify-center bg-white rounded-full text-black hover:scale-105 transition shadow-[0_0_20px_rgba(255,255,255,0.3)]" 
            onClick={() => player.togglePlay()}
            >
            {is_paused ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M8 5v14l11-7z"/></svg>
            ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            )}
            </button>

            <button 
            className="text-neutral-400 hover:text-white transition hover:scale-110 active:scale-95" 
            onClick={() => player.nextTrack()}
            >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
        </div>
      </div>

    </div>
  )
}