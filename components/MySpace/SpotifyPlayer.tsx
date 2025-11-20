//@ts-nocheck
"use client"

import React, { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  getAccessToken, 
  transferPlayback, 
  getUserPlaylists, 
  searchSpotify, 
  playContent,
  getPlaylistTracks, 
  toggleShuffle, 
  setRepeatMode as setSpotifyRepeat
} from '@/app/actions'

// --- Types ---
interface SpotifyImage { url: string }
interface SpotifyArtist { name: string }
interface SpotifyAlbum { images: SpotifyImage[]; name: string }
interface SpotifyTrack {
  id?: string
  uri?: string
  name: string
  album: SpotifyAlbum
  artists: SpotifyArtist[]
  duration_ms: number
}
interface SpotifyPlaylist {
  id: string
  uri: string
  name: string
  images: SpotifyImage[]
  owner: { display_name: string }
}
interface PlayerState {
  paused: boolean
  position: number
  duration: number
  shuffle: boolean // NEW
  repeat_mode: 0 | 1 | 2 // NEW (0: off, 1: context, 2: track)
  track_window: { current_track: SpotifyTrack }
}

// --- Utils ---
const formatTime = (ms: number) => {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
}

const TRACK_INITIAL_STATE: SpotifyTrack = {
  name: "",
  album: { images: [{ url: "" }], name: "" },
  artists: [{ name: "" }],
  duration_ms: 0
}

// --- Icons ---
const IconHome = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
const IconSearch = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
const IconLibrary = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
const IconShuffle = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
const IconRepeat = ({mode}: {mode: number}) => (
  <div className="relative">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v6z"/></svg>
    {mode === 2 && <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-pink-500 text-black rounded-full w-3 h-3 flex items-center justify-center">1</span>}
  </div>
)
const IconBack = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>

export default function SpotifyPlayer() {
  // --- Player State ---
  const [player, setPlayer] = useState<Spotify.Player | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack>(TRACK_INITIAL_STATE)
  const [deviceId, setDeviceId] = useState<string>("")
  const [duration, setDuration] = useState(0)
  const [position, setPosition] = useState(0)
  const [volume, setVolume] = useState(0.5)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // NEW: Shuffle/Repeat State
  const [shuffleState, setShuffleState] = useState(false)
  const [repeatMode, setRepeatMode] = useState<0|1|2>(0)

  // --- Navigation State ---
  const [activeTab, setActiveTab] = useState<'player' | 'search' | 'library'>('player')
  
  // --- Data State ---
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  
  // NEW: Selected Playlist State for "View Songs"
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null)
  const [playlistTracks, setPlaylistTracks] = useState<SpotifyTrack[]>([])
  const [loadingTracks, setLoadingTracks] = useState(false)

  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  const progressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const seekDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const playerRef = useRef<Spotify.Player | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // --- Initialization ---
  const initializePlayer = useCallback(async () => {
    if (playerRef.current) { setPlayer(playerRef.current); return }

    const spotifyPlayer = new window.Spotify.Player({
      name: 'My Personal Page',
      getOAuthToken: async (cb) => { 
        try { const token = await getAccessToken(); cb(token) } 
        catch (err) { setError("Failed to get token") }
      },
      volume
    })

    playerRef.current = spotifyPlayer
    setPlayer(spotifyPlayer)

    spotifyPlayer.addListener('ready', ({ device_id }) => {
      setDeviceId(device_id)
      spotifyPlayer.getCurrentState().then(state => { if (state) updateState(state) })
    })

    spotifyPlayer.addListener('player_state_changed', (state) => updateState(state))
    spotifyPlayer.addListener('initialization_error', ({ message }) => setError(message))
    spotifyPlayer.addListener('authentication_error', ({ message }) => setError(message))
    spotifyPlayer.addListener('account_error', ({ message }) => setError(message))

    await spotifyPlayer.connect()
  }, [volume])

  const updateState = (state: PlayerState | null) => {
      if (!state) return
      setCurrentTrack(state.track_window.current_track)
      setIsPaused(state.paused)
      setDuration(state.duration)
      setPosition(state.position)
      
      setShuffleState(state.shuffle)
      setRepeatMode(state.repeat_mode as 0 | 1 | 2)
      setIsActive(true)
  }

  useEffect(() => {
    if (window.Spotify) { initializePlayer() } 
    else {
      const script = document.createElement("script")
      script.src = "https://sdk.scdn.co/spotify-player.js"
      script.async = true
      window.onSpotifyWebPlaybackSDKReady = initializePlayer
      document.body.appendChild(script)
    }
  }, [initializePlayer])

  // --- Timer ---
  useEffect(() => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    if (!isPaused && isActive) {
      progressTimerRef.current = setInterval(() => {
        setPosition(prev => (prev + 1000 > duration ? duration : prev + 1000))
      }, 1000)
    }
    return () => { if (progressTimerRef.current) clearInterval(progressTimerRef.current) }
  }, [isPaused, duration, isActive])

  // --- Data Fetching ---
  useEffect(() => {
    if (activeTab === 'library' && playlists.length === 0) {
      getUserPlaylists().then(setPlaylists).catch(console.error)
    }
  }, [activeTab, playlists.length])

  // --- Actions ---

  const handleToggleShuffle = async () => {
    if(!deviceId) return
    // Optimistic UI update
    setShuffleState(!shuffleState)
    await toggleShuffle(deviceId, !shuffleState)
  }

  const handleToggleRepeat = async () => {
    if(!deviceId) return
    
    const nextMode = repeatMode === 0 ? 1 : repeatMode === 1 ? 2 : 0
    const modeString = nextMode === 0 ? 'off' : nextMode === 1 ? 'context' : 'track'
    
    setRepeatMode(nextMode)
    
    await setSpotifyRepeat(deviceId, modeString)
  }

  const openPlaylist = async (playlist: SpotifyPlaylist) => {
    setSelectedPlaylist(playlist)
    setLoadingTracks(true)
    try {
      const tracks = await getPlaylistTracks(playlist.id)
      setPlaylistTracks(tracks.filter(t => t)) // filter nulls
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingTracks(false)
    }
  }

  const playTrackOrPlaylist = async (uri: string, isContext: boolean) => {
    if (!deviceId) return
    try {
      await playContent(deviceId, uri, isContext)
      setActiveTab('player')
    } catch (err) {
      setError("Could not play selection")
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    if (query.length > 2) {
      setIsSearching(true)
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await searchSpotify(query)
          setSearchResults(results)
        } catch (e) { console.error(e) } finally { setIsSearching(false) }
      }, 500)
    } else { setSearchResults([]) }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!player) return
    const newPos = Number(e.target.value)
    setPosition(newPos)
    if (seekDebounceRef.current) clearTimeout(seekDebounceRef.current)
    seekDebounceRef.current = setTimeout(() => player.seek(newPos), 100)
  }

  // --- Connection UI ---
  const handleTransfer = async () => {
    if (!deviceId) return
    setIsLoading(true)
    try { await transferPlayback(deviceId); setIsActive(true) } 
    catch (err) { setError("Failed to connect") } 
    finally { setIsLoading(false) }
  }

  if (!isActive) {
    return (
      <div className="w-full max-w-md mt-6 p-6 bg-black/90 backdrop-blur-xl rounded-[20px] border border-neutral-800 text-center shadow-2xl">
         <div className="mb-4 text-5xl animate-pulse">🎧</div>
         <h3 className="text-white font-bold mb-2 text-lg">Personal Spotify</h3>
         <p className="text-neutral-400 text-sm mb-6">Control music directly from here.</p>
         {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
         <button onClick={handleTransfer} className="w-full py-3 bg-pink-600 text-white rounded-xl font-medium transition hover:bg-pink-500 hover:scale-[1.02] active:scale-95 disabled:opacity-50">
           {isLoading ? 'Connecting...' : 'Start Listening'}
         </button>
      </div>
    )
  }

  return (
    <div className="w-full h-[400px] max-w-md mt-6 bg-black shadow-2xl rounded-[20px] overflow-hidden relative flex flex-col">
      <div className="flex-1 overflow-hidden relative p-6">
        <AnimatePresence mode="wait">
          
          {/* --- View: PLAYER --- */}
          {activeTab === 'player' && (
            <motion.div 
              key="player"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="flex flex-col h-full"
            >
              {/* Album Art & Info */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-lg bg-neutral-800 shrink-0">
                  {currentTrack.album.images[0]?.url ? (
                    <Image src={currentTrack.album.images[0].url} alt="Art" fill className="object-cover" />
                  ) : <div className="w-full h-full flex items-center justify-center text-neutral-600">🎵</div>}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-white text-xl truncate leading-tight">{currentTrack.name}</h3>
                  <p className="text-pink-400/80 truncate text-sm mt-1">{currentTrack.artists.map(a => a.name).join(', ')}</p>
                  <p className="text-neutral-500 text-xs mt-1 truncate">{currentTrack.album.name}</p>
                </div>
              </div>

              <div className="mt-auto">
                {/* Seek Bar */}
                <input type="range" min={0} max={duration} value={position} onChange={handleSeek}
                  className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:h-1.5 transition-all mb-2"
                  style={{ background: `linear-gradient(to right, #ec4899 0%, #ec4899 ${(position/duration)*100}%, #262626 ${(position/duration)*100}%, #262626 100%)` }}
                />
                <div className="flex justify-between text-xs text-neutral-400 font-mono mb-4">
                  <span>{formatTime(position)}</span>
                  <span>{formatTime(duration)}</span>
                </div>

                {/* Main Controls */}
                <div className="flex items-center justify-between px-2">
                    {/* Shuffle Button */}
                    <button 
                      onClick={handleToggleShuffle}
                      className={`p-2 transition-colors ${shuffleState ? 'text-pink-500' : 'text-neutral-500 hover:text-white'}`}
                    >
                      <IconShuffle />
                    </button>

                    <button onClick={() => player?.previousTrack()} className="text-neutral-400 hover:text-white p-2">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                    </button>
                    
                    <button onClick={() => player?.togglePlay()} className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 active:scale-95 transition shadow-glow">
                      {isPaused ? <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M8 5v14l11-7z"/></svg> : <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>}
                    </button>

                    <button onClick={() => player?.nextTrack()} className="text-neutral-400 hover:text-white p-2">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                    </button>

                    {/* Repeat Button */}
                    <button 
                      onClick={handleToggleRepeat}
                      className={`p-2 transition-colors ${repeatMode !== 0 ? 'text-pink-500' : 'text-neutral-500 hover:text-white'}`}
                    >
                      <IconRepeat mode={repeatMode} />
                    </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* --- View: SEARCH --- */}
          {activeTab === 'search' && (
            <motion.div 
              key="search"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="h-full flex flex-col"
            >
              <h2 className="text-white font-bold text-lg mb-4">Search</h2>
              <input 
                autoFocus type="text" placeholder="Search songs..." value={searchQuery} onChange={handleSearchChange}
                className="w-full bg-neutral-900 text-white px-4 py-3 rounded-xl border border-neutral-800 focus:border-pink-500 focus:outline-none text-sm mb-4 placeholder:text-neutral-600"
              />
              <div className="flex-1 overflow-y-auto custom-scrollbar -mr-4 pr-4">
                {searchResults.map(track => (
                  <button key={track.id} onClick={() => track.uri && playTrackOrPlaylist(track.uri, false)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-900 group text-left">
                    <div className="w-10 h-10 bg-neutral-800 rounded-md relative overflow-hidden shrink-0">
                      {track.album.images[2]?.url && <Image src={track.album.images[2].url} alt="" fill className="object-cover"/>}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate group-hover:text-pink-400 transition-colors">{track.name}</p>
                      <p className="text-neutral-500 text-xs truncate">{track.artists[0].name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* --- View: LIBRARY --- */}
          {activeTab === 'library' && !selectedPlaylist && (
            <motion.div 
              key="library-list"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="h-full flex flex-col"
            >
              <h2 className="text-white font-bold text-lg mb-4">My Playlists</h2>
              <div className="flex-1 overflow-y-auto custom-scrollbar -mr-4 pr-4 space-y-2">
                {playlists.map(pl => (
                  <button 
                    key={pl.id}
                    onClick={() => openPlaylist(pl)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-900 group text-left"
                  >
                      <div className="w-12 h-12 bg-neutral-800 rounded-md relative overflow-hidden shrink-0">
                        {pl.images[0]?.url && <Image src={pl.images[0].url} alt="" fill className="object-cover"/>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white text-sm font-medium truncate group-hover:text-pink-400 transition-colors">{pl.name}</p>
                        <p className="text-neutral-500 text-xs truncate">By {pl.owner.display_name}</p>
                      </div>
                      <div className="text-neutral-600 group-hover:text-white">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
                      </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* --- View: PLAYLIST DETAILS (Drill Down) --- */}
          {activeTab === 'library' && selectedPlaylist && (
            <motion.div
              key="library-detail"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="h-full flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <button 
                  onClick={() => setSelectedPlaylist(null)} 
                  className="text-neutral-400 hover:text-white p-1 hover:bg-neutral-800 rounded-full transition"
                >
                  <IconBack />
                </button>
                <h2 className="text-white font-bold text-lg truncate flex-1">{selectedPlaylist.name}</h2>
                <button 
                  onClick={() => playTrackOrPlaylist(selectedPlaylist.uri, true)}
                  className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white hover:scale-105 active:scale-95"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </button>
              </div>

              {/* Tracks List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar -mr-4 pr-4">
                {loadingTracks ? (
                   <div className="text-neutral-500 text-center text-xs mt-10 animate-pulse">Loading tracks...</div>
                ) : (
                  <div className="space-y-1">
                    {playlistTracks.map((track, i) => (
                      <button 
                        key={`${track.id}-${i}`}
                        onClick={() => track.uri && playTrackOrPlaylist(track.uri, false)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-900 group text-left"
                      >
                        <span className="text-neutral-600 text-xs w-4 text-center group-hover:text-pink-500 font-mono">{i+1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-sm font-medium truncate group-hover:text-pink-400 transition-colors">{track.name}</p>
                          <p className="text-neutral-500 text-xs truncate">{track.artists.map(a=>a.name).join(', ')}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="h-16 border-t border-neutral-800 bg-black/50 backdrop-blur-md flex items-center justify-around px-6 z-10">
        <NavButton active={activeTab === 'player'} onClick={() => setActiveTab('player')} icon={<IconHome />} label="Player" />
        <NavButton active={activeTab === 'search'} onClick={() => setActiveTab('search')} icon={<IconSearch />} label="Search" />
        <NavButton active={activeTab === 'library'} onClick={() => { setActiveTab('library'); setSelectedPlaylist(null) }} icon={<IconLibrary />} label="Library" />
      </div>
    </div>
  )
}

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'text-pink-500 scale-110' : 'text-neutral-500 hover:text-white'}`}>
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
)