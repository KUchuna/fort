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

  // Initialize Spotify player (only once)
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

      // Sync state immediately
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

  // Load Spotify SDK and initialize
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

    // Sync player state on mount if it already exists
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

  // Progress timer
  useEffect(() => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    if (!isPaused && player) {
      progressTimerRef.current = setInterval(() => {
        setPosition(prev => (prev + 1000 > duration ? duration : prev + 1000))
      }, 1000)
    }
    return () => { if (progressTimerRef.current) clearInterval(progressTimerRef.current) }
  }, [isPaused, duration, player])

  // Handlers
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
      // Sync state after transfer
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
      <div className="flex flex-col items-center justify-start h-fit mt-6 p-5 bg-main rounded-[20px] text-center">
        <h3 className="text-black font-bold mb-2">Ready to Play</h3>
        <p className="text-neutral-400 text-sm mb-4">
          {deviceId ? "Click below to transfer playback to this device." : "Connecting to Spotify..."}
        </p>
        <button 
          onClick={handleTransfer}
          disabled={isLoading || !deviceId}
          className="px-6 py-2 bg-accent text-white rounded-full font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          aria-label="Connect to Spotify player"
        >
          {isLoading ? 'Connecting...' : deviceId ? 'Connect Player' : 'Initializing...'}
        </button>
      </div>
    )
  }

  // Album Art
  const hasAlbumArt = currentTrack.album.images[0]?.url

  return (
    <div className="max-w-[30%] w-full flex flex-col h-fit mt-6 p-5 rounded-[20px] bg-black shadow-2xl overflow-hidden relative">
      <div className="flex items-center gap-4 mb-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="relative w-20 h-20 rounded-xl overflow-hidden shadow-lg shrink-0 bg-neutral-800"
        >
          {hasAlbumArt ? (
            <Image src={hasAlbumArt} alt="Album Art" fill className="object-cover" sizes="80px" priority />
          ) : <div className="w-full h-full flex items-center justify-center text-neutral-600">🎵</div>}
        </motion.div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <motion.h3 key={currentTrack.name} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }} className="font-bold text-white text-lg truncate">{currentTrack.name || "No track playing"}</motion.h3>
          <p className="text-sm text-pink-200/70 truncate">{currentTrack.artists[0]?.name || "Unknown artist"}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex flex-col gap-1 mb-4">
        <input type="range" min={0} max={duration} value={position} onChange={handleSeek}
          aria-label="Seek track position"
          className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:h-2 transition-all"
          style={{ background: `linear-gradient(to right, rgb(236 72 153) 0%, rgb(236 72 153) ${(position/duration)*100}%, rgb(38 38 38) ${(position/duration)*100}%, rgb(38 38 38) 100%)` }}
        />
        <div className="flex justify-between text-xs text-neutral-500 font-medium font-mono">
          <span>{formatTime(position)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 w-24">
          <span className="text-xs" aria-hidden="true">🔊</span>
          <input type="range" min={0} max={1} step={0.01} value={volume} onChange={handleVolume}
            aria-label="Volume control" className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-neutral-400" />
        </div>
        <div className="flex items-center gap-4">
          <button className="text-neutral-400 hover:text-white transition hover:scale-110 active:scale-95" onClick={handlePrevious} aria-label="Previous track">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          <button className="w-12 h-12 flex items-center justify-center bg-white rounded-full text-black hover:scale-105 transition shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95" onClick={handleTogglePlay} aria-label={isPaused ? "Play" : "Pause"}>
            {isPaused ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M8 5v14l11-7z"/></svg> :
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>}
          </button>
          <button className="text-neutral-400 hover:text-white transition hover:scale-110 active:scale-95" onClick={handleNext} aria-label="Next track">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
