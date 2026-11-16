import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Shuffle,
  Play,
  ListPlus,
  Download,
  Search,
  Music,
} from 'lucide-react';
import {
  ScreenLayout,
  ScreenHeader,
  SortBar,
  MiniPlayer,
  BottomNav,
  TrackItem,
  Toast,
} from './ui';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import {
  searchOnlineTracks,
  getTrendingTracks,
  addOnlineTrackToPlaylist,
  importOnlineTrack,
  type OnlineTrack,
} from '../lib/onlineMusicService';
import { getAllPlaylists, type Playlist } from '../lib/playlistService';
import type { Track } from '../lib/trackService';

interface OnlineSearchScreenProps {
  onSwitchToTracks?: () => void;
  onSwitchToPlaylists?: () => void;
}

export function OnlineSearchScreen({
  onSwitchToTracks,
  onSwitchToPlaylists,
}: OnlineSearchScreenProps) {
  const {
    currentTrack,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    seek,
    playTrack,
    togglePlay,
    nextTrack,
    prevTrack,
    refreshTracks,
  } = useAudioPlayer();

  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlineTracks, setOnlineTracks] = useState<OnlineTrack[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [selectedTrackForOptions, setSelectedTrackForOptions] = useState<OnlineTrack | null>(null);
  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState<boolean>(false);
  const [availablePlaylists, setAvailablePlaylists] = useState<Playlist[]>([]);
  const [savingTrackId, setSavingTrackId] = useState<number | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Search online tracks
  const performSearch = useCallback(async (query: string) => {
    const term = query.trim();
    setIsLoading(true);
    try {
      // Use trending for initial/empty query, search for user input
      const results = term
        ? await searchOnlineTracks(term, 30)
        : await getTrendingTracks(30);
      setOnlineTracks(results);
    } catch (err) {
      console.error('Gagal memuat musik online:', err);
      showToast('Gagal memuat musik online. Periksa koneksi internet.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    performSearch('');
  }, [performSearch]);

  // Handle typing search with debounce
  const handleQueryChange = (val: string) => {
    setSearchQuery(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch(val || '');
    }, 500);
  };

  // Filtered & sorted tracks
  const displayedTracks = useMemo(() => {
    const list = [...onlineTracks];
    list.sort((a, b) => {
      const comp = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
      return sortAsc ? comp : -comp;
    });
    return list;
  }, [onlineTracks, sortAsc]);

  // Get current playing online track's artwork for MiniPlayer
  const currentArtwork = useMemo(() => {
    if (!currentTrack) return undefined;
    const match = onlineTracks.find((t) => t.previewUrl === currentTrack.blob_key);
    return match?.artworkUrl || undefined;
  }, [currentTrack, onlineTracks]);

  // Play an online track directly
  const handlePlayOnlineTrack = async (onlineTrack: OnlineTrack) => {
    if (currentTrack?.blob_key === onlineTrack.previewUrl) {
      togglePlay();
      return;
    }

    const tempTrack: Track = {
      id: onlineTrack.id,
      title: onlineTrack.title,
      artist: onlineTrack.artist,
      album: onlineTrack.album,
      duration: onlineTrack.duration,
      file_name: `${onlineTrack.title}.m4a`,
      file_size: 1024 * 1024,
      mime_type: 'audio/mp4',
      blob_key: onlineTrack.previewUrl,
      created_at: new Date().toISOString(),
      is_favorite: 0,
    };

    await playTrack(tempTrack);
  };

  // Shuffle play
  const handleShuffle = () => {
    if (displayedTracks.length === 0) return;
    const randomIndex = Math.floor(Math.random() * displayedTracks.length);
    handlePlayOnlineTrack(displayedTracks[randomIndex]);
  };

  // Save to local tracks collection
  const handleSaveToCollection = async (onlineTrack: OnlineTrack) => {
    setSavingTrackId(onlineTrack.id);
    try {
      await importOnlineTrack(onlineTrack);
      await refreshTracks();
      showToast(`"${onlineTrack.title}" disimpan ke koleksi Tracks`);
      setSelectedTrackForOptions(null);
    } catch (err) {
      console.error('Gagal menyimpan lagu ke koleksi:', err);
      showToast('Gagal menyimpan lagu ke koleksi');
    } finally {
      setSavingTrackId(null);
    }
  };

  // Open playlist selector
  const handleOpenAddToPlaylist = async (onlineTrack: OnlineTrack) => {
    try {
      const lists = await getAllPlaylists();
      setAvailablePlaylists(lists);
      setSelectedTrackForOptions(onlineTrack);
      setIsAddToPlaylistOpen(true);
    } catch (err) {
      console.error('Gagal mengambil daftar playlist:', err);
    }
  };

  // Add online track to selected playlist
  const handleSelectPlaylist = async (playlist: Playlist) => {
    if (!selectedTrackForOptions) return;
    setSavingTrackId(selectedTrackForOptions.id);

    try {
      const { success } = await addOnlineTrackToPlaylist(
        playlist.id,
        selectedTrackForOptions
      );
      if (success) {
        await refreshTracks();
        showToast(`Lagu ditambahkan ke "${playlist.title}"`);
        setIsAddToPlaylistOpen(false);
        setSelectedTrackForOptions(null);
      } else {
        showToast('Lagu sudah ada di playlist ini');
      }
    } catch (err) {
      console.error('Gagal menambahkan lagu ke playlist:', err);
      showToast('Gagal menambahkan lagu ke playlist');
    } finally {
      setSavingTrackId(null);
    }
  };

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isAddToPlaylistOpen) setIsAddToPlaylistOpen(false);
        else if (selectedTrackForOptions) setSelectedTrackForOptions(null);
        else if (isSearchOpen) {
          setIsSearchOpen(false);
          setSearchQuery('');
          performSearch('top hits');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddToPlaylistOpen, selectedTrackForOptions, isSearchOpen, performSearch]);

  return (
    <ScreenLayout>
      {/* Screen Header (Identical design to Tracks & Playlists) */}
      <ScreenHeader
        title="Online"
        isSearchOpen={isSearchOpen}
        searchQuery={searchQuery}
        onSearchChange={handleQueryChange}
        onToggleSearch={() => {
          setIsSearchOpen((prev) => !prev);
          if (isSearchOpen) {
            setSearchQuery('');
            performSearch('');
          }
        }}
        searchPlaceholder="Cari lagu atau artis online..."
      />

      {/* Floating Modern Toast Notification */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* SortBar (Identical design to TracksScreen) */}
      <SortBar
        className="px-5 pt-1 pb-2 shrink-0"
        label={sortAsc ? 'Name (A-Z)' : 'Name (Z-A)'}
        onSortClick={() => setSortAsc(!sortAsc)}
        rightContent={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShuffle}
              disabled={displayedTracks.length === 0}
              className="w-8 h-8 rounded-full bg-[#1c1c1e] hover:bg-[#252528] text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer disabled:opacity-40"
              aria-label="Acak Lagu"
              title="Acak Lagu"
            >
              <Shuffle className="w-4 h-4 stroke-[2]" />
            </button>
          </div>
        }
      />

      {/* Main Track List Container */}
      <main className="flex-1 min-h-0 overflow-y-auto px-5 pb-3 overscroll-contain scrollbar-none flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[#8e8e93] text-sm py-12">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mb-3" />
            <span>Mencari lagu online...</span>
          </div>
        ) : displayedTracks.length === 0 ? (
          /* Empty State (Identical to TracksScreen) */
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4 my-auto select-none">
            <Search className="w-10 h-10 text-[#3a3a3e] mb-3 stroke-[1.5]" />
            <h4 className="text-[15px] font-medium text-white mb-1">
              Tidak Ada Hasil
            </h4>
            <p className="text-[12.5px] text-[#8e8e93] max-w-[240px]">
              Tidak ditemukan lagu online yang cocok dengan "{searchQuery}"
            </p>
          </div>
        ) : (
          /* Track Items List (Uses standard TrackItem identical to TracksScreen) */
          <div className="space-y-1">
            {displayedTracks.map((track) => (
              <TrackItem
                key={track.id}
                title={track.title}
                subtitle={`${track.artist} • ${track.album}`}
                coverImage={track.artworkUrl}
                isActive={currentTrack?.blob_key === track.previewUrl}
                isBuffering={currentTrack?.blob_key === track.previewUrl && isBuffering}
                onClick={() => handlePlayOnlineTrack(track)}
                onOptions={() => setSelectedTrackForOptions(track)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Flat Mini Player with Seeker Slider */}
      <MiniPlayer
        trackTitle={currentTrack ? currentTrack.title : 'Belum ada lagu'}
        subtitle={
          currentTrack
            ? currentTrack.artist || 'Online Stream'
            : undefined
        }
        coverImage={currentArtwork}
        isPlaying={isPlaying}
        isBuffering={isBuffering}
        currentTime={currentTime}
        duration={duration}
        onSeek={seek}
        onTogglePlay={togglePlay}
        onPrev={prevTrack}
        onNext={nextTrack}
      />

      {/* Fixed Bottom Navigation (Identical design to TracksScreen & PlaylistScreen) */}
      <BottomNav
        activeTab="online"
        onChangeTab={(tab) => {
          if (tab === 'tracks') onSwitchToTracks?.();
          if (tab === 'playlists') onSwitchToPlaylists?.();
        }}
      />

      {/* Track Options Modal / Bottom Sheet (Identical design to TracksScreen) */}
      {selectedTrackForOptions && !isAddToPlaylistOpen && (
        <div
          onClick={() => setSelectedTrackForOptions(null)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#1c1c1f] rounded-t-[24px] p-6 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] shadow-2xl cursor-default"
          >
            {/* Modal Drag handle */}
            <div className="w-10 h-1 bg-[#3a3a3e] rounded-full mx-auto mb-5" />

            <div className="flex items-center gap-3.5 mb-5 pb-4">
              {selectedTrackForOptions.artworkUrl ? (
                <img
                  src={selectedTrackForOptions.artworkUrl}
                  alt={selectedTrackForOptions.title}
                  className="w-11 h-11 rounded-[12px] object-cover shrink-0 bg-[#242428]"
                />
              ) : (
                <div className="w-11 h-11 rounded-[12px] bg-[#242428] flex items-center justify-center text-white shrink-0">
                  <Music className="w-5 h-5 stroke-[2]" />
                </div>
              )}
              <div className="min-w-0">
                <h4 className="text-white font-medium text-[14.5px] truncate tracking-tight">
                  {selectedTrackForOptions.title}
                </h4>
                <p className="text-[#8e8e93] text-xs mt-0.5 truncate">
                  {selectedTrackForOptions.artist} • {selectedTrackForOptions.album}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  handlePlayOnlineTrack(selectedTrackForOptions);
                  setSelectedTrackForOptions(null);
                }}
                className="w-full h-9 rounded-full bg-[#0061FE] hover:bg-[#0052d9] text-white font-medium text-[13px] inline-flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-white text-white" />
                <span>Putar Sekarang</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenAddToPlaylist(selectedTrackForOptions)}
                className="w-full h-9 rounded-full bg-[#252528] hover:bg-[#2e2e32] text-white font-medium text-[13px] inline-flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <ListPlus className="w-3.5 h-3.5 stroke-[2]" />
                <span>Tambah ke Playlist</span>
              </button>

              <button
                type="button"
                disabled={savingTrackId === selectedTrackForOptions.id}
                onClick={() => handleSaveToCollection(selectedTrackForOptions)}
                className="w-full h-9 rounded-full bg-[#252528] hover:bg-[#2e2e32] text-white font-medium text-[13px] inline-flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 stroke-[2]" />
                <span>Simpan ke Koleksi Tracks</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTrackForOptions(null)}
                className="w-full h-9 rounded-full bg-[#1c1c1e] hover:bg-[#252528] text-[#8e8e93] hover:text-white font-medium text-[13px] active:scale-95 transition-all cursor-pointer inline-flex items-center justify-center"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select Playlist Modal (Identical design to TracksScreen) */}
      {isAddToPlaylistOpen && selectedTrackForOptions && (
        <div
          onClick={() => setIsAddToPlaylistOpen(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#1c1c1f] rounded-t-[24px] p-6 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] shadow-2xl max-h-[75vh] flex flex-col cursor-default"
          >
            <div className="w-10 h-1 bg-[#3a3a3e] rounded-full mx-auto mb-4 shrink-0" />

            <div className="flex items-center justify-between pb-3 shrink-0">
              <div>
                <h3 className="text-white font-medium text-[15.5px] tracking-tight">
                  Pilih Playlist
                </h3>
                <p className="text-[#8e8e93] text-[12px] truncate max-w-[240px]">
                  {selectedTrackForOptions.title}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddToPlaylistOpen(false)}
                className="h-8 px-3 rounded-full bg-[#252528] text-white font-medium text-[12px] active:scale-95 transition-all cursor-pointer"
              >
                Batal
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pt-2 scrollbar-none">
              {availablePlaylists.length === 0 ? (
                <div className="text-center py-8 text-[#8e8e93] text-xs">
                  Belum ada playlist. Buat playlist terlebih dahulu di tab Playlists.
                </div>
              ) : (
                availablePlaylists.map((pl) => (
                  <button
                    key={pl.id}
                    type="button"
                    disabled={savingTrackId === selectedTrackForOptions.id}
                    onClick={() => handleSelectPlaylist(pl)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-[#252528] hover:bg-[#2d2d32] active:scale-[0.99] transition-all cursor-pointer text-left disabled:opacity-50"
                  >
                    <div className="min-w-0 pr-3">
                      <h4 className="text-white font-medium text-[14px]">{pl.title}</h4>
                      <p className="text-[#8e8e93] text-[11.5px] mt-0.5">{pl.tracks_count || 0} lagu</p>
                    </div>
                    <span className="text-[12px] text-[#0061FE] font-medium">+ Pilih</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </ScreenLayout>
  );
}
