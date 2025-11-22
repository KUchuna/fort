//@ts-nocheck

"use client"

import React, { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { 
  getAccessToken, 
  transferPlayback, 
  searchSpotify, 
  getUserPlaylists, 
  getPlaylistDetails, 
  startPlayback,
  toggleShuffle,
  setRepeatMode,
} from '@/app/actions'

// --- Interfaces ---
interface SpotifyImage { url: string }
interface SpotifyArtist { name: string }
interface SpotifyAlbum { images: SpotifyImage[]; name: string }
interface SpotifyTrack {
  id?: string;
  uri?: string;
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
  shuffle: boolean
  repeat_mode: 0 | 1 | 2 
}

interface Playlist {
  id: string;
  name: string;
  images: SpotifyImage[];
  uri: string;
  href: string;
  tracks: { total: number };
}

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

export default function SpotifyPlayer({onPlayChange}) {

  useEffect(() => {    
    const hasReloaded = sessionStorage.getItem('page_reloaded');
    if (!hasReloaded) {
      sessionStorage.setItem('page_reloaded', 'true');
      window.location.reload();
    } else {
      return () => sessionStorage.removeItem('page_reloaded');
    }
  }, []);

  // --- State ---
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

  // --- Feature State ---
  const [view, setView] = useState<'search' | 'playlists' | 'liked-songs' | 'playlist-detail'>('search')
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([])
  
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [likedSongs, setLikedSongs] = useState<SpotifyTrack[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<{ info: Playlist, tracks: SpotifyTrack[] } | null>(null)
  
  const [activeContext, setActiveContext] = useState<'playlist' | 'liked-songs' | 'none'>('none')

  const [shuffleState, setShuffleState] = useState(false)
  const [repeatState, setRepeatState] = useState<0 | 1 | 2>(0)

  const progressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const seekDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const playerRef = useRef<Spotify.Player | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const trackHasStartedRef = useRef(false)

  // --- Helper: Update State ---
  const updateState = (state: PlayerState) => {
    setCurrentTrack(state.track_window.current_track)
    setIsPaused(state.paused)
    onPlayChange(!state.paused)
    setDuration(state.duration)
    setPosition(state.position)
    
    setShuffleState(state.shuffle)
    setRepeatState(state.repeat_mode)
  }

  // --- 1. Load Data ---
  useEffect(() => {
    const loadMusicData = async () => {
      try {
        const token = await getAccessToken();
        
        const fetchLikedSongs = async () => {
          let allTracks: SpotifyTrack[] = [];
          let url = 'https://api.spotify.com/v1/me/tracks?limit=50'; 
          while (url) {
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) break;
            const data = await res.json();
            if (data.items) {
               const tracks = data.items.map((item: any) => item.track);
               allTracks = [...allTracks, ...tracks];
            }
            url = data.next;
          }
          setLikedSongs(allTracks);
        };

        const fetchPlaylists = async () => {
             const data = await getUserPlaylists();
             if(data.items) setPlaylists(data.items);
        };

        fetchLikedSongs();
        fetchPlaylists();

      } catch (err) {
        console.error("Failed to load music data", err);
      }
    };
    loadMusicData();
  }, []);

  // --- 2. Initialize Player ---
  useEffect(() => {
    let isMounted = true;

    const initializePlayer = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!isMounted) return; 

      const spotifyPlayer = new window.Spotify.Player({
        name: 'My Personal Page',
        getOAuthToken: async (cb) => { 
          try {
            const token = await getAccessToken()
            cb(token)
          } catch (err) { console.error(err) }
        },
        volume: 0.5
      })

      playerRef.current = spotifyPlayer
      setPlayer(spotifyPlayer)

      spotifyPlayer.addListener('ready', ({ device_id }) => {
        if (!isMounted) return;
        console.log('Device Ready:', device_id)
        setDeviceId(device_id)
        setError(null) 
      })

      spotifyPlayer.addListener('player_state_changed', (state) => {
        if (!isMounted || !state) return;
        updateState(state)
        setIsActive(true)
      })
      
      spotifyPlayer.addListener('initialization_error', ({ message }) => setError(`Init error: ${message}`))
      spotifyPlayer.addListener('authentication_error', ({ message }) => setError(`Auth error: ${message}`))
      spotifyPlayer.addListener('account_error', ({ message }) => setError(`Account error: ${message}`))

      spotifyPlayer.connect()
    }

    if (window.Spotify) {
      initializePlayer()
    } else {
      window.onSpotifyWebPlaybackSDKReady = initializePlayer
      const script = document.createElement("script")
      script.src = "https://sdk.scdn.co/spotify-player.js"
      script.async = true
      document.body.appendChild(script)
    }

    return () => {
      isMounted = false;
      if (playerRef.current) playerRef.current.disconnect();
    }
  }, [])

  // --- 3. Progress Interval ---
  useEffect(() => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    
    if (!isPaused && player) {
      if (position > 0) trackHasStartedRef.current = true;

      progressTimerRef.current = setInterval(() => {
        setPosition(prev => (prev + 1000 > duration ? duration : prev + 1000))
      }, 1000)
    }
    return () => { if (progressTimerRef.current) clearInterval(progressTimerRef.current) }
  }, [isPaused, duration, player, position])


  // --- Handlers ---
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchQuery(val)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    if (val.trim().length === 0) {
      setSearchResults([])
      return
    }
    searchTimeoutRef.current = setTimeout(async () => {
        try {
            const data = await searchSpotify(val)
            setSearchResults(data.tracks?.items || [])
        } catch (err) { console.error(err) }
    }, 500)
  }

  const handlePlayTrack = useCallback(async (trackUri: string, contextUri?: string, origin: 'playlist' | 'liked-songs' | 'none' = 'none') => {
    if (!deviceId || !player) {
      setError("Player loading... please wait.");
      return;
    }

    trackHasStartedRef.current = false; 
    setActiveContext(origin)

    const attemptPlay = async () => {
      if (contextUri && contextUri !== 'spotify:user:me:collection') {
         await startPlayback(deviceId, contextUri, trackUri);
      } else {
         await startPlayback(deviceId, undefined, trackUri);
      }
    }

    try {
      await player.activateElement();
      try {
        await attemptPlay();
      } catch (firstError) {
        console.warn("Retry playback...", firstError);
        await transferPlayback(deviceId);
        await new Promise(resolve => setTimeout(resolve, 500));
        await attemptPlay();
      }
      setIsActive(true);
      setIsPaused(false);
      setError(null);
    } catch (finalError: any) {
      console.error("Playback failed", finalError);
      setError("Could not play.");
    }
  }, [deviceId, player]);

  const handleOpenPlaylist = async (playlist: Playlist) => {
    try {
      const details = await getPlaylistDetails(playlist.href)
      const tracks = details.tracks.items.map((item: any) => item.track).filter((t: any) => t)
      setSelectedPlaylist({ info: playlist, tracks })
      setView('playlist-detail')
    } catch (err) { console.error(err) }
  }

  const handleToggleShuffle = async () => {
      const oldState = shuffleState;
      const newState = !oldState;
      setShuffleState(newState); // Optimistic update
      try {
          await toggleShuffle(deviceId, newState);
      } catch (err) {
          console.log("Shuffle API toggle might have failed (expected for Liked Songs), but local state updated.");
      }
  }

  const handleToggleRepeat = async () => {
      const nextState = repeatState === 0 ? 1 : repeatState === 1 ? 2 : 0;
      setRepeatState(nextState)
      const stateStr = nextState === 1 ? 'context' : nextState === 2 ? 'track' : 'off';
      await setRepeatMode(deviceId, stateStr)
  }

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!player) return
    const newPos = Number(e.target.value)
    setPosition(newPos)
    if (seekDebounceRef.current) clearTimeout(seekDebounceRef.current)
    seekDebounceRef.current = setTimeout(() => player.seek(newPos), 100)
  }, [player])

  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!player) return;
    const vol = Number(e.target.value);
    setVolume(vol); 
    player.setVolume(vol);
  }, [player]);

  const handleTogglePlay = useCallback(() => player?.togglePlay(), [player])

  const handleTransfer = useCallback(async () => {
    if (!deviceId || !player) return
    setIsLoading(true)
    try {
      await player.activateElement();
      await transferPlayback(deviceId)
      const state = await player.getCurrentState()
      if (state) {
          updateState(state)
          setIsActive(true)
      }
    } catch (err) {
      setError("Transfer failed.")
    } finally {
      setIsLoading(false)
    }
  }, [deviceId, player])

  // --- NEXT / PREVIOUS LOGIC (Wrapped in useCallback) ---
  const handleNext = useCallback(async () => {
    if (activeContext === 'liked-songs') {
        const currentIndex = likedSongs.findIndex(t => t.uri === currentTrack.uri || t.id === currentTrack.id)
        
        if (currentIndex !== -1) {
            let nextIndex;
            if (shuffleState) {
                nextIndex = Math.floor(Math.random() * likedSongs.length);
                if (likedSongs.length > 1 && nextIndex === currentIndex) {
                    nextIndex = (nextIndex + 1) % likedSongs.length;
                }
            } else {
                nextIndex = currentIndex < likedSongs.length - 1 ? currentIndex + 1 : 0
            }
            const nextTrack = likedSongs[nextIndex]
            await handlePlayTrack(nextTrack.uri!, undefined, 'liked-songs')
        }
    } else {
        player?.nextTrack()
    }
  }, [activeContext, likedSongs, currentTrack, shuffleState, player, handlePlayTrack]);

  const handlePrevious = useCallback(async () => {
    if (activeContext === 'liked-songs') {
        const currentIndex = likedSongs.findIndex(t => t.uri === currentTrack.uri || t.id === currentTrack.id)
        if (currentIndex !== -1) {
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : likedSongs.length - 1
            const prevTrack = likedSongs[prevIndex]
            await handlePlayTrack(prevTrack.uri!, undefined, 'liked-songs')
        }
    } else {
        player?.previousTrack()
    }
  }, [activeContext, likedSongs, currentTrack, player, handlePlayTrack]);

  // --- AUTO-ADVANCE EFFECT (Fixed Dependency Array) ---
  useEffect(() => {
    if (activeContext === 'liked-songs') {
        if (isPaused && position === 0 && trackHasStartedRef.current) {
            console.log("Track finished manually, advancing...");
            trackHasStartedRef.current = false; 
            handleNext();
        }
    }
  }, [isPaused, position, activeContext, handleNext]); // <--- Fixed: removed likedSongs/currentTrack/shuffleState to allow handleNext to handle it via closure


  if (error) return (
    <div className="flex flex-col items-center justify-center p-6 bg-red-950/80 backdrop-blur-md rounded-2xl border border-red-800 w-full max-w-md text-center">
      <h3 className="text-white font-bold mb-2">Error</h3>
      <p className="text-red-300 text-sm mb-4">{error}</p>
      <button onClick={() => { setError(null); window.location.reload() }}
        className="px-6 py-2 bg-red-500 text-white rounded-full font-medium hover:bg-red-400 transition-all hover:scale-105 active:scale-95"
      >Retry</button>
    </div>
  )

  const hasAlbumArt = currentTrack.album.images[0]?.url
  const progressPercent = duration ? (position / duration) * 100 : 0

 return (
    <div className="min-w-[400px] max-w-[400px] w-full flex flex-col gap-4">
      <div className="w-full bg-[#181818] p-4 rounded-[20px] border border-[#282828] h-[250px] flex flex-col mt-6">
        
        {/* --- TOP NAVIGATION --- */}
        <div className="flex gap-4 mb-4 border-b border-[#282828] pb-2">
            <button onClick={() => setView('search')} className={`text-sm font-bold transition ${view === 'search' ? 'text-white' : 'text-[#b3b3b3] hover:text-white'}`}>Search</button>
            <button onClick={() => setView('playlists')} className={`text-sm font-bold transition ${view === 'playlists' || view === 'playlist-detail' ? 'text-white' : 'text-[#b3b3b3] hover:text-white'}`}>Playlists</button>
            <button onClick={() => setView('liked-songs')} className={`text-sm font-bold transition ${view === 'liked-songs' ? 'text-[#1DB954]' : 'text-[#b3b3b3] hover:text-[#1DB954]'}`}>Liked Songs</button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
            
            {/* --- VIEW: SEARCH --- */}
            {view === 'search' && (
                <>
                    <input 
                        type="text" 
                        placeholder="Search songs..." 
                        value={searchQuery}
                        onChange={handleSearch}
                        className="w-full bg-[#2a2a2a] text-white text-sm rounded-full px-4 py-2 outline-none mb-2 placeholder:text-[#7a7a7a]"
                    />
                    <div className="flex flex-col gap-2">
                        {searchResults.length === 0 && searchQuery.length > 0 && <p className="text-xs text-[#7a7a7a] text-center mt-4">No results found</p>}
                        {searchResults.map(track => (
                            <div key={track.id} onClick={() => handlePlayTrack(track.uri!)} className="flex items-center gap-3 p-2 hover:bg-[#282828] rounded-md cursor-pointer group transition">
                                <div className="w-10 h-10 relative shrink-0 bg-[#333]">
                                    {track.album.images[0] && <Image src={track.album.images[0].url} fill alt="art" className="object-cover rounded" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm truncate ${currentTrack.uri === track.uri ? 'text-[#1DB954]' : 'text-white'}`}>{track.name}</p>
                                    <p className="text-xs text-[#b3b3b3] truncate">{track.artists[0].name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* --- VIEW: PLAYLISTS --- */}
            {view === 'playlists' && (
                <div className="flex flex-col gap-2">
                    {playlists.length === 0 && <p className="text-xs text-[#7a7a7a] text-center mt-4">No playlists found or loading...</p>}
                    {playlists.map(pl => (
                          <div key={pl.id} onClick={() => handleOpenPlaylist(pl)} className="flex items-center gap-3 p-2 hover:bg-[#282828] rounded-md cursor-pointer transition">
                             <div className="w-12 h-12 relative shrink-0 bg-[#333]">
                                    {pl.images?.[0] && <Image src={pl.images[0].url} fill alt="art" className="object-cover rounded" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate font-medium">{pl.name}</p>
                                <p className="text-xs text-[#b3b3b3]">{pl.tracks.total} tracks</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- VIEW: LIKED SONGS --- */}
            {view === 'liked-songs' && (
                <div className="flex flex-col">
                    <div className="flex items-center gap-3 mb-4 p-2 bg-gradient-to-r from-[#450af5] to-[#c4efd9]/10 rounded-md">
                        <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-[#450af5] to-[#8e8e8e] text-white rounded-md shadow-lg">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-md">Liked Songs</h3>
                            <p className="text-xs text-white/70">{likedSongs.length} songs</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        {likedSongs.length === 0 && <p className="text-xs text-[#7a7a7a] text-center mt-4">Loading Liked Songs...</p>}
                        {likedSongs.map((track, idx) => (
                            <div 
                                id={`track-${track.id}`}
                                key={`${track.id}-${idx}`} 
                                onClick={() => handlePlayTrack(track.uri!, undefined, 'liked-songs')} 
                                className="flex items-center gap-3 p-2 hover:bg-[#282828] rounded-md cursor-pointer group transition"
                            >
                                <span className="text-xs text-[#7a7a7a] w-4 text-center group-hover:hidden">{idx + 1}</span>
                                <span className="text-xs text-white w-4 text-center hidden group-hover:block">▶</span>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm truncate ${currentTrack.uri === track.uri ? 'text-[#1DB954]' : 'text-white'}`}>{track.name}</p>
                                    <p className="text-xs text-[#b3b3b3] truncate">{track.artists[0].name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- VIEW: PLAYLIST DETAIL --- */}
            {view === 'playlist-detail' && selectedPlaylist && (
                <div className="flex flex-col">
                      <button onClick={() => setView('playlists')} className="flex items-center gap-1 text-xs text-[#b3b3b3] hover:text-white mb-3 w-fit">
                        Back to Playlists
                      </button>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-16 h-16 relative shrink-0 shadow-lg">
                            {selectedPlaylist.info.images?.[0] && <Image src={selectedPlaylist.info.images[0].url} fill alt="art" className="object-cover rounded-md" />}
                        </div>
                        <h3 className="text-white font-bold text-lg truncate">{selectedPlaylist.info.name}</h3>
                      </div>
                      <div className="flex flex-col gap-1">
                        {selectedPlaylist.tracks.map((track, idx) => (
                            <div 
                                id={`track-${track.id}`}
                                key={`${track.id}-${idx}`} 
                                onClick={() => handlePlayTrack(track.uri!, selectedPlaylist.info.uri, 'playlist')} 
                                className="flex items-center gap-3 p-2 hover:bg-[#282828] rounded-md cursor-pointer group transition"
                            >
                                <span className="text-xs text-[#7a7a7a] w-4 text-center group-hover:hidden">{idx + 1}</span>
                                <span className="text-xs text-white w-4 text-center hidden group-hover:block">▶</span>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm truncate ${currentTrack.uri === track.uri ? 'text-[#1DB954]' : 'text-white'}`}>{track.name}</p>
                                    <p className="text-xs text-[#b3b3b3] truncate">{track.artists[0].name}</p>
                                </div>
                            </div>
                        ))}
                      </div>
                </div>
            )}
        </div>
      </div>

      {!isActive ? (
        <div className="w-full h-[150px] flex flex-col items-center justify-center bg-[#181818] rounded-[20px] border border-[#282828] p-6 text-center">
            <p className="text-[#b3b3b3] text-xs mb-4">Player is ready. Click a song above OR connect manually.</p>
            <button 
                onClick={handleTransfer}
                disabled={isLoading || !deviceId}
                className={`px-6 py-2 rounded-full font-bold text-xs tracking-wide transition-all 
                ${(!deviceId) ? 'bg-[#282828] text-[#555] cursor-not-allowed' : 'bg-[#1DB954] text-black hover:scale-105 hover:bg-[#1ed760] active:scale-95'}`}
            >
                {isLoading ? 'CONNECTING...' : !deviceId ? 'INITIALIZING...' : 'CONNECT PLAYER'}
            </button>
        </div>
      ) : (
        <div className="w-full flex flex-col h-fit p-5 rounded-[20px] bg-[#181818] shadow-xl overflow-hidden relative border border-[#282828]">           
           <div className="flex items-center gap-4 mb-6">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
               className="relative w-20 h-20 rounded-lg overflow-hidden shadow-lg shrink-0 bg-[#282828] group"
             >
               {hasAlbumArt ? (
                 <Image src={hasAlbumArt} alt="Album Art" fill className="object-cover" sizes="56px" priority />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-[#b3b3b3]">
                    <div className="w-8 h-8 bg-[#333] rounded-full animate-pulse"></div>
                 </div>
               )}
             </motion.div>
             
             <div className="flex-1 min-w-0 overflow-hidden flex flex-col justify-center">
               <motion.h3 key={currentTrack.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-white text-[15px] truncate hover:underline cursor-pointer">
                 {currentTrack.name || "No track playing"}
               </motion.h3>
               <p className="text-[12px] text-[#b3b3b3] truncate hover:text-white hover:underline cursor-pointer transition-colors">
                 {currentTrack.artists[0]?.name || "Unknown artist"}
               </p>
             </div>
           </div>

           <div className="group flex flex-col gap-1 mb-4">
             <div className="relative w-full h-1 rounded-full bg-[#4d4d4d]">
                <input type="range" min={0} max={duration} value={position} onChange={handleSeek} className="absolute top-0 left-0 w-full h-full opacity-0 z-10 cursor-pointer"/>
               <div className="h-full rounded-full bg-white group-hover:bg-[#1db954] transition-colors" style={{ width: `${progressPercent}%` }} />
               <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 pointer-events-none" style={{ left: `${progressPercent}%`, marginLeft: '-6px' }} />
             </div>
             <div className="flex justify-between text-[11px] text-[#a7a7a7] font-sans mt-1">
               <span>{formatTime(position)}</span>
               <span>{formatTime(duration)}</span>
             </div>
           </div>

           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2 w-24 group">
    <div className="relative w-full h-1 rounded-full bg-[#4d4d4d] flex items-center">
        <input 
            type="range" 
            min={0} 
            max={1} 
            step={0.01} 
            value={volume} 
            onChange={handleVolume} 
            className="absolute w-full h-3 opacity-0 z-20 cursor-pointer -top-1" 
        />
        <div 
            className="h-full rounded-full bg-[#b3b3b3] group-hover:bg-[#1db954] transition-colors z-10" 
            style={{ width: `${volume * 100}%` }} 
        />
        <div 
            className="absolute h-3 w-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"
            style={{ left: `calc(${volume * 100}% - 6px)` }}
        />
    </div>
</div>

             <div className="flex items-center gap-3">
               <button 
  onClick={handleToggleShuffle} 
  className={`transition ${shuffleState ? 'text-[#1db954] hover:text-[#1ed760]' : 'text-[#b3b3b3] hover:text-white'}`}
  aria-label="Toggle Shuffle"
>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
    </svg>
</button>

               <button className="text-[#b3b3b3] hover:text-white transition" onClick={handlePrevious}>
                 <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3.3 1a.7.7 0 0 1 .7.7v5.15l9.95-5.744a.7.7 0 0 1 1.05.606v12.575a.7.7 0 0 1-1.05.607L4 9.149V14.3a.7.7 0 0 1-.7.7H1.7a.7.7 0 0 1-.7-.7V1.7a.7.7 0 0 1 .7-.7h1.6z"/></svg>
               </button>
               
               <button className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-black hover:scale-105 transition active:scale-95" onClick={handleTogglePlay}>
                 {isPaused ? (
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5"><path d="M8 5v14l11-7z"/></svg>
                 ) : (
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                 )}
               </button>
               
               <button className="text-[#b3b3b3] hover:text-white transition" onClick={handleNext}>
                 <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M12.7 1a.7.7 0 0 0-.7.7v5.15L2.05 1.107A.7.7 0 0 0 1 1.712v12.575a.7.7 0 0 0 1.05.607L12 9.149V14.3a.7.7 0 0 0 .7.7h1.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-1.6z"/></svg>
               </button>

                <button onClick={handleToggleRepeat} className={`text-[#b3b3b3] hover:text-white transition relative`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={repeatState > 0 ? "text-[#1DB954]" : ""}><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
                    {repeatState === 2 && <div className="absolute -top-1 -right-1 bg-[#1DB954] text-black text-[8px] font-bold rounded-full w-3 h-3 flex items-center justify-center">1</div>}
               </button>
             </div>
           </div>
        </div>
      )}

    </div>
  )
}