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
  isLoading: boolean;
  isScanning: boolean;
  currentTime: number;
  duration: number;
  seek: (time: number) => void;
  playTrack: (track: Track) => Promise<void>;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  scanAudioFiles: (files: FileList | File[]) => Promise<number>;
  seedDemoTrack: () => Promise<void>;
  deleteTrack: (id: number) => Promise<void>;
  refreshTracks: () => Promise<void>;
  toggleFavorite: (trackId: number) => Promise<number>;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
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

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onDurationChange = () => setDuration(audio.duration || 0);

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('durationchange', onDurationChange);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.pause();
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      }
    };
  }, []);

  // Fetch tracks from SQLite on mount
  const refreshTracks = useCallback(async () => {
    try {
      const data = await getAllTracks();
      setTracks(data);
      if (data.length > 0 && !currentTrack) {
        setCurrentTrack(data[0]);
      }
    } catch (err) {
      console.error('Gagal mengambil daftar lagu dari SQLite:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentTrack]);

  useEffect(() => {
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
      // 1. Fetch audio blob from IndexedDB
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
      recordRecentlyPlayed(track.id).catch(() => {});
    } catch (err) {
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
    async (files: FileList | File[]): Promise<number> => {
      setIsScanning(true);
      try {
        const count = await scanFilesService(files);
        await refreshTracks();
        return count;
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
          audioRef.current?.pause();
          setIsPlaying(false);
        }
        await deleteTrackService(id);
        await refreshTracks();
      } catch (err) {
        console.error('Gagal menghapus lagu:', err);
      }
    },
    [currentTrack, refreshTracks]
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
        refreshTracks,
        toggleFavorite,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
}
