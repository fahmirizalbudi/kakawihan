import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import {
  getAllTracks,
  scanAudioFiles as scanFilesService,
  deleteTrack as deleteTrackService,
  deleteMultipleTracks as deleteMultipleService,
  seedDemoTrack as seedDemoService,
  toggleFavorite as toggleFavoriteService,
  type Track,
} from '../lib/trackService';
import { getAudioBlob } from '../lib/sqlite';
import { recordRecentlyPlayed } from '../lib/recentlyPlayedService';

interface AudioPlayerContextType {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  isBuffering: boolean;
  isLoading: boolean;
  isScanning: boolean;
  currentTime: number;
  duration: number;
  seek: (time: number) => void;
  playTrack: (track: Track) => Promise<void>;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  scanAudioFiles: (files: FileList | File[]) => Promise<{ added: number; duplicates: number }>;
  seedDemoTrack: () => Promise<void>;
  deleteTrack: (id: number) => Promise<void>;
  deleteMultipleTracks: (ids: number[]) => Promise<void>;
  refreshTracks: () => Promise<void>;
  toggleFavorite: (trackId: number) => Promise<number>;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);

  // Initialize Audio instance once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    const onPlay = () => { setIsPlaying(true); setIsBuffering(false); };
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onWaiting = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);
    const onPlaying = () => setIsBuffering(false);

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('playing', onPlaying);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('playing', onPlaying);
      audio.pause();
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      }
    };
  }, []);

  const isInitializedRef = useRef<boolean>(false);

  // Stop playback completely and reset player state
  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }
    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }
    setIsPlaying(false);
    setIsBuffering(false);
    setCurrentTrack(null);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  // Fetch tracks from SQLite on mount
  const refreshTracks = useCallback(async () => {
    try {
      const data = await getAllTracks();
      setTracks(data);
      if (!isInitializedRef.current) {
        isInitializedRef.current = true;
        if (data.length > 0) {
          setCurrentTrack(data[0]);
        }
      } else {
        setCurrentTrack((prev) => {
          if (!prev) return null;
          const stillExists = data.find((t) => t.id === prev.id);
          return stillExists || null;
        });
      }
    } catch (err) {
      console.error('Gagal mengambil daftar lagu dari SQLite:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshTracks();
  }, [refreshTracks]);

  // Play a specific track
  const playTrack = useCallback(async (track: Track) => {
    const audio = audioRef.current;
    if (!audio) return;

    // If same track is already loaded, simply resume
    if (currentTrack?.id === track.id && audio.src) {
      try {
        await audio.play();
      } catch (e) {
        console.warn('Gagal memutar audio:', e);
      }
      return;
    }

    try {
      // Handle streaming online URL directly
      if (track.blob_key.startsWith('http://') || track.blob_key.startsWith('https://')) {
        if (currentBlobUrlRef.current) {
          URL.revokeObjectURL(currentBlobUrlRef.current);
          currentBlobUrlRef.current = null;
        }

        setCurrentTrack(track);
        setIsBuffering(true);

        audio.src = track.blob_key;
        audio.load();
        await audio.play();

        if (track.id > 0) {
          recordRecentlyPlayed(track.id).catch(() => {});
        }
        return;
      }

      // 1. Fetch audio blob from IndexedDB for local tracks
      const blob = await getAudioBlob(track.blob_key);
      if (!blob) {
        console.error('File audio tidak ditemukan di penyimpanan lokal!');
        return;
      }

      // 2. Revoke previous blob URL
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      }

      // 3. Create fresh Object URL and assign to audio
      const objectUrl = URL.createObjectURL(blob);
      currentBlobUrlRef.current = objectUrl;

      audio.src = objectUrl;
      audio.load();
      await audio.play();

      setCurrentTrack(track);

      // Record to recently played (fire-and-forget)
      if (track.id > 0) {
        recordRecentlyPlayed(track.id).catch(() => {});
      }
    } catch (err) {
      // AbortError is expected when rapidly switching tracks - silently ignore
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      console.warn('Audio play request interrupted or failed:', err);
    }
  }, [currentTrack]);

  // Toggle play/pause
  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      if (!audio.src && currentTrack) {
        await playTrack(currentTrack);
      } else if (audio.src) {
        try {
          await audio.play();
        } catch (e) {
          console.warn('Gagal melanjutkan audio:', e);
        }
      } else if (tracks.length > 0) {
        await playTrack(tracks[0]);
      }
    }
  }, [isPlaying, currentTrack, tracks, playTrack]);

  // Seek to specific time in seconds
  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const safeTime = Math.max(0, Math.min(time, audio.duration || duration || 0));
    audio.currentTime = safeTime;
    setCurrentTime(safeTime);
  }, [duration]);

  // Next track
  const nextTrack = useCallback(() => {
    if (tracks.length === 0) return;
    const currentIndex = currentTrack
      ? tracks.findIndex((t) => t.id === currentTrack.id)
      : -1;
    const nextIndex = (currentIndex + 1) % tracks.length;
    playTrack(tracks[nextIndex]);
  }, [tracks, currentTrack, playTrack]);

  // Previous track
  const prevTrack = useCallback(() => {
    if (tracks.length === 0) return;
    const currentIndex = currentTrack
      ? tracks.findIndex((t) => t.id === currentTrack.id)
      : -1;
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    playTrack(tracks[prevIndex]);
  }, [tracks, currentTrack, playTrack]);

  // Auto-play next track when audio ends
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      nextTrack();
    };

    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [nextTrack]);

  // Scan multiple files from device
  const scanAudioFiles = useCallback(
    async (files: FileList | File[]): Promise<{ added: number; duplicates: number }> => {
      setIsScanning(true);
      try {
        const result = await scanFilesService(files);
        await refreshTracks();
        return result;
      } catch (err) {
        console.error('Gagal memindai file audio:', err);
        throw err;
      } finally {
        setIsScanning(false);
      }
    },
    [refreshTracks]
  );

  // Seed demo chime track
  const seedDemoTrack = useCallback(async () => {
    setIsScanning(true);
    try {
      const demo = await seedDemoService();
      await refreshTracks();
      await playTrack(demo);
    } catch (err) {
      console.error('Gagal memuat lagu demo:', err);
    } finally {
      setIsScanning(false);
    }
  }, [refreshTracks, playTrack]);

  // Delete track
  const deleteTrack = useCallback(
    async (id: number) => {
      try {
        if (currentTrack?.id === id) {
          stopPlayback();
        }
        await deleteTrackService(id);
        await refreshTracks();
      } catch (err) {
        console.error('Gagal menghapus lagu:', err);
      }
    },
    [currentTrack, stopPlayback, refreshTracks]
  );

  // Delete multiple tracks
  const deleteMultipleTracks = useCallback(
    async (ids: number[]) => {
      try {
        if (currentTrack && ids.includes(currentTrack.id)) {
          stopPlayback();
        }
        await deleteMultipleService(ids);
        await refreshTracks();
      } catch (err) {
        console.error('Gagal menghapus beberapa lagu:', err);
      }
    },
    [currentTrack, stopPlayback, refreshTracks]
  );

  // Toggle favorite
  const toggleFavorite = useCallback(
    async (trackId: number): Promise<number> => {
      const newVal = await toggleFavoriteService(trackId);
      await refreshTracks();
      return newVal;
    },
    [refreshTracks]
  );

  return (
    <AudioPlayerContext.Provider
      value={{
        tracks,
        currentTrack,
        isPlaying,
        isBuffering,
        isLoading,
        isScanning,
        currentTime,
        duration,
        seek,
        playTrack,
        togglePlay,
        nextTrack,
        prevTrack,
        scanAudioFiles,
        seedDemoTrack,
        deleteTrack,
        deleteMultipleTracks,
        refreshTracks,
        toggleFavorite,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
}
