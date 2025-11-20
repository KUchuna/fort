//@ts-nocheck

"use client"

import React, { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { getAccessToken, transferPlayback } from '@/app/actions'

interface SpotifyImage { url: string }
interface SpotifyArtist { name: string }
interface SpotifyAlbum { images: SpotifyImage[] }
interface SpotifyTrack {
  name: string
  album: SpotifyAlbum
  artists: SpotifyArtist[]
  duration_ms: number
}
interface PlayerState {
  paused: boolean
  position: number
  duration: number
  track_window: { current_track: SpotifyTrack }
}

const formatTime = (ms: number) => {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
}

const TRACK_INITIAL_STATE: SpotifyTrack = {
  name: "",
  album: { images: [{ url: "" }] },
  artists: [{ name: "" }],
  duration_ms: 0
}

export default function SpotifyPlayer() {
  const [player, setPlayer] = useState<Spotify.Player | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack>(TRACK_INITIAL_STATE)
  const [deviceId, setDeviceId] = useState<string>("")
  const [duration, setDuration] = useState(0)
  const [position, setPosition] = useState(0)
  const [volume, setVolume] = useState(0.5)
  const [isLoading, setIsLoading] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const progressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const seekDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const playerRef = useRef<Spotify.Player | null>(null)

  const initializePlayer = useCallback(async () => {
    if (playerRef.current) {
      setPlayer(playerRef.current)
      return
    }

    const spotifyPlayer = new window.Spotify.Player({
      name: 'My Personal Page',
      getOAuthToken: async (cb) => { 
        try {
          const token = await getAccessToken()
          cb(token)
        } catch (err) {
          setError("Failed to get access token")
          console.error(err)
        }
      },
      volume
    })

    playerRef.current = spotifyPlayer
    setPlayer(spotifyPlayer)

    spotifyPlayer.addListener('ready', ({ device_id }) => {
      console.log('Ready with Device ID', device_id)
      setError(null)
      setDeviceId(device_id)

      spotifyPlayer.getCurrentState().then(state => {
        if (state) {
          setCurrentTrack(state.track_window.current_track)
          setIsPaused(state.paused)
          setDuration(state.duration)
          setPosition(state.position)
          setIsActive(true)
        }
      })
    })

    spotifyPlayer.addListener('player_state_changed', (state: PlayerState | null) => {
      if (!state) return
      setCurrentTrack(state.track_window.current_track)
      setIsPaused(state.paused)
      setDuration(state.duration)
      setPosition(state.position)
      setIsActive(true)
    })

    spotifyPlayer.addListener('initialization_error', ({ message }) => setError(`Init error: ${message}`))
    spotifyPlayer.addListener('authentication_error', ({ message }) => setError(`Auth error: ${message}`))
    spotifyPlayer.addListener('account_error', ({ message }) => setError(`Account error: ${message}`))

    const connected = await spotifyPlayer.connect()
    if (!connected) setError('Failed to connect to Spotify')
  }, [volume])

  useEffect(() => {
    if (window.Spotify) {
      initializePlayer()
    } else {
      const script = document.createElement("script")
      script.src = "https://sdk.scdn.co/spotify-player.js"
      script.async = true
      script.onerror = () => setError("Failed to load Spotify SDK")
      document.body.appendChild(script)
      window.onSpotifyWebPlaybackSDKReady = initializePlayer
    }

    if (playerRef.current) {
      playerRef.current.getCurrentState().then(state => {
        if (state) {
          setCurrentTrack(state.track_window.current_track)
          setIsPaused(state.paused)
          setDuration(state.duration)
          setPosition(state.position)
          setDeviceId((playerRef.current! as any)._options.id || "")
          setIsActive(true)
        }
      })
    }
  }, [initializePlayer])

  useEffect(() => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    if (!isPaused && player) {
      progressTimerRef.current = setInterval(() => {
        setPosition(prev => (prev + 1000 > duration ? duration : prev + 1000))
      }, 1000)
    }
    return () => { if (progressTimerRef.current) clearInterval(progressTimerRef.current) }
  }, [isPaused, duration, player])

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!player) return
    const newPos = Number(e.target.value)
    setPosition(newPos)
    if (seekDebounceRef.current) clearTimeout(seekDebounceRef.current)
    seekDebounceRef.current = setTimeout(() => player.seek(newPos), 100)
  }, [player])

  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!player) return
    const vol = Number(e.target.value)
    setVolume(vol)
    player.setVolume(vol)
  }, [player])

  const handlePrevious = useCallback(() => player?.previousTrack(), [player])
  const handleTogglePlay = useCallback(() => player?.togglePlay(), [player])
  const handleNext = useCallback(() => player?.nextTrack(), [player])

  const handleTransfer = useCallback(async () => {
    if (!deviceId || !player) {
      setError("Device not ready yet")
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      await transferPlayback(deviceId)
      const state = await player.getCurrentState()
      if (state) {
        setCurrentTrack(state.track_window.current_track)
        setIsPaused(state.paused)
        setDuration(state.duration)
        setPosition(state.position)
        setIsActive(true)
      }
    } catch (err: any) {
      console.error(err)
      setError("Failed to transfer playback. Make sure Spotify is playing somewhere else first.")
    } finally {
      setIsLoading(false)
    }
  }, [deviceId, player])

  // Error UI
  if (error) return (
    <div className="flex flex-col items-center justify-center p-6 bg-red-950/80 backdrop-blur-md rounded-2xl border border-red-800 w-full max-w-md text-center">
      <h3 className="text-white font-bold mb-2">Error</h3>
      <p className="text-red-300 text-sm mb-4">{error}</p>
      <button onClick={() => { setError(null); initializePlayer() }}
        className="px-6 py-2 bg-red-500 text-white rounded-full font-medium hover:bg-red-400 transition-all hover:scale-105 active:scale-95"
      >Retry</button>
    </div>
  )

  // Show Connect Player if player exists but not active
  if (!isActive) {
    return (
      <div className="flex flex-col items-center justify-start h-fit mt-6 p-6 bg-[#181818] rounded-[20px] text-center shadow-lg border border-white/5 selection:bg-green-400">
        <div className="mb-4 text-[#1DB954]">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.66.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.4-1.02 15.6 1.44.54.3.719.96.42 1.5-.239.479-.899.66-1.44.36z"/>
          </svg>
        </div>

        <h3 className="text-white font-bold text-lg mb-2 tracking-tight">Ready to Play</h3>
        <p className="text-[#A7A7A7] text-sm mb-6 max-w-[250px] leading-relaxed selection:text-white">
          {deviceId ? "Click below to transfer playback to this device." : "Connecting to Spotify..."}
        </p>

        <button 
          onClick={handleTransfer}
          disabled={isLoading || !deviceId}
          className="px-8 py-3 bg-[#1DB954] text-black rounded-full font-bold text-sm tracking-wide transition-transform duration-100 hover:scale-105 hover:bg-[#1ed760] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:bg-[#1DB954]"
          aria-label="Connect to Spotify player"
        >
          {isLoading ? 'CONNECTING...' : deviceId ? 'CONNECT PLAYER' : 'INITIALIZING...'}
        </button>
      </div>
    )
  }

  const hasAlbumArt = currentTrack.album.images[0]?.url
  const progressPercent = duration ? (position / duration) * 100 : 0

  return (
    <div className="max-w-[400px] w-full flex flex-col h-fit mt-6 p-5 rounded-[20px] bg-[#181818] shadow-xl overflow-hidden relative border border-[#282828]">
      
      {/* Top Section: Art & Title */}
      <div className="flex items-center gap-4 mb-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-20 h-20 rounded-lg overflow-hidden shadow-lg shrink-0 bg-[#282828] group"
        >
          {hasAlbumArt ? (
            <Image src={hasAlbumArt} alt="Album Art" fill className="object-cover" sizes="56px" priority />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#b3b3b3]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm0 17.15c-3.45 0-6.35-2.35-7.5-5.65-.2-.55.1-1.15.65-1.35.55-.2 1.15.1 1.35.65.8 2.3 2.85 3.95 5.5 3.95s4.7-1.65 5.5-3.95c.2-.55.8-.85 1.35-.65.55.2.85.8.65 1.35-1.15 3.3-4.05 5.65-7.5 5.65zM12 6.85c3.45 0 6.35 2.35 7.5 5.65.2.55-.1 1.15-.65 1.35-.55.2-1.15-.1-1.35-.65-.8-2.3-2.85-3.95-5.5-3.95s-4.7 1.65-5.5 3.95c-.2.55-.8.85-1.35.65-.55-.2-.85-.8-.65-1.35 1.15-3.3 4.05-5.65 7.5-5.65z"/></svg>
            </div>
          )}
        </motion.div>
        
        <div className="flex-1 min-w-0 overflow-hidden flex flex-col justify-center">
          <motion.h3 
            key={currentTrack.name} 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="font-bold text-white text-[15px] truncate hover:underline cursor-pointer"
          >
            {currentTrack.name || "No track playing"}
          </motion.h3>
          <p className="text-[12px] text-[#b3b3b3] truncate hover:text-white hover:underline cursor-pointer transition-colors">
            {currentTrack.artists[0]?.name || "Unknown artist"}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="group flex flex-col gap-1 mb-4">
        <div className="relative w-full h-1 group-hover:h-1.5 transition-all duration-75 rounded-full bg-[#4d4d4d]">
           {/* Using standard input for interaction, but styled to look like Spotify's custom bar */}
           <input 
            type="range" 
            min={0} 
            max={duration} 
            value={position} 
            onChange={handleSeek}
            aria-label="Seek track position"
            className="absolute top-0 left-0 w-full h-full opacity-0 z-10 cursor-pointer"
          />
          {/* Visual Progress Bar */}
          <div 
            className="h-full rounded-full bg-white group-hover:bg-[#1db954] transition-colors"
            style={{ width: `${progressPercent}%` }}
          />
           {/* The Handle (Only shows on hover) */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 pointer-events-none"
            style={{ left: `${progressPercent}%`, marginLeft: '-6px' }} 
          />
        </div>
        
        <div className="flex justify-between text-[11px] text-[#a7a7a7] font-sans mt-1">
          <span>{formatTime(position)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        
        {/* Volume */}
        <div className="flex items-center gap-2 w-24 group">
          {/* Volume Bar - Logic similar to progress but simpler */}
          <div className="relative w-full h-1 rounded-full bg-[#4d4d4d] overflow-hidden">
             <input 
               type="range" min={0} max={1} step={0.01} value={volume} onChange={handleVolume}
               className="absolute top-0 left-0 w-full h-full opacity-0 z-10 cursor-pointer" 
             />
             <div className="h-full bg-white group-hover:bg-[#1db954] transition-colors" style={{ width: `${volume * 100}%` }} />
          </div>
        </div>

        {/* Playback Buttons */}
        <div className="flex items-center gap-5">
          <button className="text-[#b3b3b3] hover:text-white transition" onClick={handlePrevious} aria-label="Previous track">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3.3 1a.7.7 0 0 1 .7.7v5.15l9.95-5.744a.7.7 0 0 1 1.05.606v12.575a.7.7 0 0 1-1.05.607L4 9.149V14.3a.7.7 0 0 1-.7.7H1.7a.7.7 0 0 1-.7-.7V1.7a.7.7 0 0 1 .7-.7h1.6z"/></svg>
          </button>
          
          <button 
            className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-black hover:scale-105 transition active:scale-95" 
            onClick={handleTogglePlay} 
            aria-label={isPaused ? "Play" : "Pause"}
          >
            {isPaused ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5"><path d="M8 5v14l11-7z"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            )}
          </button>
          
          <button className="text-[#b3b3b3] hover:text-white transition" onClick={handleNext} aria-label="Next track">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M12.7 1a.7.7 0 0 0-.7.7v5.15L2.05 1.107A.7.7 0 0 0 1 1.712v12.575a.7.7 0 0 0 1.05.607L12 9.149V14.3a.7.7 0 0 0 .7.7h1.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-1.6z"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}