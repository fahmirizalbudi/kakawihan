import { useState, useRef, useMemo } from 'react';
import {
  Shuffle,
  Play,
  Trash2,
  FileAudio,
  ListPlus,
  Heart,
  Search,
  Plus,
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
import type { Track } from '../lib/trackService';
import { getAllPlaylists, addTrackToPlaylist, type Playlist } from '../lib/playlistService';

interface TracksScreenProps {
  onSwitchToPlaylists?: () => void;
}

export function TracksScreen({ onSwitchToPlaylists }: TracksScreenProps) {
  const {
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
    deleteTrack,
    deleteMultipleTracks,
    toggleFavorite,
  } = useAudioPlayer();

  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTrackForOptions, setSelectedTrackForOptions] = useState<Track | null>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState<boolean>(false);
  const [availablePlaylists, setAvailablePlaylists] = useState<Playlist[]>([]);

  // Multi-selection delete state
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle files selected from file picker
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const added = await scanAudioFiles(files);
      if (added > 0) {
        setScanMessage(`Berhasil menambahkan ${added} lagu`);
      } else {
        setScanMessage('Tidak ada file audio yang valid.');
      }
      setTimeout(() => setScanMessage(null), 3500);
    } catch {
      setScanMessage('Gagal menambahkan file audio.');
      setTimeout(() => setScanMessage(null), 3500);
    } finally {
      e.target.value = '';
    }
  };

  // Pick audio files
  const handlePickFiles = async () => {
    if ('showOpenFilePicker' in window) {
      try {
        // @ts-expect-error File System Access API
        const fileHandles = await window.showOpenFilePicker({
          multiple: true,
          types: [
            {
              description: 'Audio Files',
              accept: {
                'audio/*': ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.weba', '.opus'],
              },
            },
          ],
        });
        const files: File[] = [];
        for (const handle of fileHandles) {
          const file = await handle.getFile();
          files.push(file);
        }
        if (files.length > 0) {
          const added = await scanAudioFiles(files);
          if (added > 0) {
            setScanMessage(`Berhasil menambahkan ${added} lagu`);
          } else {
            setScanMessage('Tidak ada file audio yang valid.');
          }
          setTimeout(() => setScanMessage(null), 3500);
        }
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        // Fallback to file input
      }
    }

    fileInputRef.current?.click();
  };

  // Filtered and sorted tracks
  const displayedTracks = useMemo(() => {
    let result = tracks;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist?.toLowerCase().includes(q) ||
          t.album?.toLowerCase().includes(q) ||
          t.file_name.toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) =>
      sortAsc
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title)
    );
  }, [tracks, sortAsc, searchQuery]);

  const handleShuffle = () => {
    const list = displayedTracks.length > 0 ? displayedTracks : tracks;
    if (list.length === 0) return;
    const randomIndex = Math.floor(Math.random() * list.length);
    playTrack(list[randomIndex]);
  };

  const handlePlayAll = () => {
    const list = displayedTracks.length > 0 ? displayedTracks : tracks;
    if (list.length === 0) return;
    playTrack(list[0]);
  };

  // Selection handlers
  const handleLongPressTrack = (trackId: number) => {
    setIsSelectionMode(true);
    setSelectedIds(new Set([trackId]));
  };

  const handleToggleSelectTrack = (trackId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === displayedTracks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedTracks.map((t) => t.id)));
    }
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleConfirmBatchDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      await deleteMultipleTracks(ids);
      setScanMessage(`Berhasil menghapus ${ids.length} lagu`);
      setTimeout(() => setScanMessage(null), 3500);
      exitSelectionMode();
      setIsDeleteConfirmOpen(false);
    } catch {
      setScanMessage('Gagal menghapus lagu terpilih');
      setTimeout(() => setScanMessage(null), 3500);
    }
  };

  return (
    <ScreenLayout>
      {/* Hidden File Input for selecting multiple music files */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.weba,.opus"
        className="hidden"
        onChange={handleFilesSelected}
      />

      {/* Screen Header */}
      <ScreenHeader
        title="Tracks"
        isSearchOpen={isSearchOpen}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleSearch={() => {
          setIsSearchOpen((prev) => !prev);
          if (isSearchOpen) setSearchQuery('');
        }}
        searchPlaceholder="Cari lagu atau artis..."
      />

      {/* Action Row: Normal or Selection Actions */}
      <div className="flex items-center gap-2 px-5 pt-1 pb-2 shrink-0">
        {isSelectionMode ? (
          <>
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="h-9 px-4 rounded-full bg-red-500/15 hover:bg-red-500/20 disabled:opacity-40 text-red-400 font-medium text-[13px] inline-flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
              <span>Hapus ({selectedIds.size})</span>
            </button>

            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="h-9 px-3.5 rounded-full bg-[#1c1c1e] hover:bg-[#252528] text-white font-medium text-[13px] inline-flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <span>{selectedIds.size === displayedTracks.length ? 'Batal Semua' : 'Pilih Semua'}</span>
            </button>

            <button
              type="button"
              onClick={exitSelectionMode}
              className="h-9 px-3.5 rounded-full bg-[#1c1c1e] hover:bg-[#252528] text-[#8e8e93] hover:text-white font-medium text-[13px] inline-flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer ml-auto"
            >
              <span>Selesai</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handlePickFiles}
              className="h-9 px-4 rounded-full bg-[#0061FE] hover:bg-[#0052d9] text-white font-medium text-[13px] inline-flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Pilih Lagu</span>
            </button>

            <button
              type="button"
              onClick={handleShuffle}
              disabled={tracks.length === 0}
              className="h-9 px-3.5 rounded-full bg-[#1c1c1e] hover:bg-[#252528] text-white font-medium text-[13px] inline-flex items-center gap-1.5 disabled:opacity-40 active:scale-95 transition-all cursor-pointer"
            >
              <Shuffle className="w-4 h-4 stroke-[2]" />
              <span>Shuffle</span>
            </button>
          </>
        )}
      </div>

      {/* Floating Modern Toast Notification */}
      {scanMessage && (
        <Toast
          message={scanMessage}
          onClose={() => setScanMessage(null)}
        />
      )}

      {/* Sort Bar (only shown when tracks exist) */}
      {tracks.length > 0 && (
        <SortBar
          className="px-5 pt-1 pb-2 shrink-0"
          label={sortAsc ? 'Name (A-Z)' : 'Name (Z-A)'}
          onSortClick={() => setSortAsc(!sortAsc)}
          rightContent={
            <button
              type="button"
              onClick={handlePlayAll}
              className="h-8 px-3 rounded-full bg-[#1c1c1e] hover:bg-[#252528] text-white font-medium text-[12.5px] inline-flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white text-white" />
              <span>Play all</span>
            </button>
          }
        />
      )}

      {/* Main Track List / Empty State Container */}
      <main className="flex-1 min-h-0 overflow-y-auto px-5 pb-3 overscroll-contain scrollbar-none flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[#8e8e93] text-sm py-12">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mb-3" />
            <span>Memuat database SQLite...</span>
          </div>
        ) : isScanning ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[#8e8e93] text-sm py-12">
            <div className="w-6 h-6 border-2 border-[#0061FE] border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-white font-medium">Menambahkan file audio ke database...</span>
            <span className="text-xs text-[#8e8e93] mt-1">Harap tunggu sebentar</span>
          </div>
        ) : tracks.length === 0 ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4 my-auto select-none">
            <div className="w-16 h-20 text-[#3a3a3e] mb-5">
              <svg
                className="w-full h-full"
                viewBox="0 0 64 80"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M10 2C5.58 2 2 5.58 2 10V70C2 74.42 5.58 78 10 78H54C58.42 78 62 74.42 62 70V22L42 2H10Z"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M42 2V22H62"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M32 38V54M24 46H40"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <h3 className="text-[16.5px] font-medium text-white mb-1 tracking-tight">
              Belum Ada Lagu
            </h3>
            <p className="text-[13px] text-[#8e8e93] max-w-[260px] leading-relaxed mb-6">
              Pilih file musik dari perangkat Anda untuk menambahkan lagu
            </p>

            <button
              type="button"
              onClick={handlePickFiles}
              className="h-9 px-5 rounded-full bg-[#0061FE] hover:bg-[#0052d9] text-white font-medium text-[13px] inline-flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Pilih File Lagu</span>
            </button>
          </div>
        ) : displayedTracks.length === 0 ? (
          /* Empty Search State */
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4 my-auto select-none">
            <Search className="w-10 h-10 text-[#3a3a3e] mb-3 stroke-[1.5]" />
            <h4 className="text-[15px] font-medium text-white mb-1">
              Tidak Ada Hasil
            </h4>
            <p className="text-[12.5px] text-[#8e8e93] max-w-[240px]">
              Tidak ditemukan lagu yang cocok dengan "{searchQuery}"
            </p>
          </div>
        ) : (
          /* Track Items List */
          <div className="space-y-1">
            {displayedTracks.map((track) => (
              <TrackItem
                key={track.id}
                title={track.title}
                subtitle={`${(track.file_size / (1024 * 1024)).toFixed(1)} MB • ${track.file_name.split('.').pop()?.toUpperCase() || 'AUDIO'}`}
                isActive={currentTrack?.id === track.id}
                isSelectionMode={isSelectionMode}
                isSelected={selectedIds.has(track.id)}
                onClick={() => {
                  if (isSelectionMode) {
                    handleToggleSelectTrack(track.id);
                  } else {
                    playTrack(track);
                  }
                }}
                onOptions={() => setSelectedTrackForOptions(track)}
                onLongPress={() => handleLongPressTrack(track.id)}
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
            ? `${(currentTrack.file_size / (1024 * 1024)).toFixed(1)} MB`
            : undefined
        }
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onSeek={seek}
        onTogglePlay={togglePlay}
        onPrev={prevTrack}
        onNext={nextTrack}
      />

      {/* Fixed Bottom Navigation (Playlists & Tracks) */}
      <BottomNav
        activeTab="tracks"
        onChangeTab={(tab) => {
          if (tab === 'playlists') onSwitchToPlaylists?.();
        }}
      />

      {/* Batch Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#1c1c1f] rounded-t-[24px] p-6 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] shadow-2xl">
            <div className="w-10 h-1 bg-[#3a3a3e] rounded-full mx-auto mb-5" />

            <div className="flex items-center gap-3.5 mb-5 pb-4">
              <div className="w-11 h-11 rounded-[12px] bg-[#242428] flex items-center justify-center text-white shrink-0">
                <Trash2 className="w-5 h-5 stroke-[2] text-red-400" />
              </div>
              <div className="min-w-0">
                <h4 className="text-white font-medium text-[14.5px] truncate tracking-tight">
                  Hapus {selectedIds.size} Lagu Terpilih?
                </h4>
                <p className="text-[#8e8e93] text-xs mt-0.5 truncate">
                  Lagu akan dihapus permanen dari penyimpanan lokal perangkat.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleConfirmBatchDelete}
                className="w-full h-9 rounded-full bg-red-500/15 hover:bg-red-500/20 text-red-400 font-medium text-[13px] inline-flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus {selectedIds.size} Lagu Terpilih</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="w-full h-9 rounded-full bg-[#1c1c1e] hover:bg-[#252528] text-[#8e8e93] hover:text-white font-medium text-[13px] active:scale-95 transition-all cursor-pointer inline-flex items-center justify-center"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Track Options Modal / Bottom Sheet */}
      {selectedTrackForOptions && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#1c1c1f] rounded-t-[24px] p-6 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] shadow-2xl">
            {/* Modal Drag handle */}
            <div className="w-10 h-1 bg-[#3a3a3e] rounded-full mx-auto mb-5" />

            <div className="flex items-center gap-3.5 mb-5 pb-4">
              <div className="w-11 h-11 rounded-[12px] bg-[#242428] flex items-center justify-center text-white shrink-0">
                <FileAudio className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-white font-medium text-[14.5px] truncate tracking-tight">
                  {selectedTrackForOptions.title}
                </h4>
                <p className="text-[#8e8e93] text-xs mt-0.5 truncate">
                  {selectedTrackForOptions.file_name} • {(selectedTrackForOptions.file_size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  playTrack(selectedTrackForOptions);
                  setSelectedTrackForOptions(null);
                }}
                className="w-full h-9 rounded-full bg-[#0061FE] hover:bg-[#0052d9] text-white font-medium text-[13px] inline-flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-white text-white" />
                <span>Putar Sekarang</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  const isFav = selectedTrackForOptions.is_favorite === 1;
                  await toggleFavorite(selectedTrackForOptions.id);
                  setScanMessage(isFav ? 'Dihapus dari Favorit' : 'Ditambahkan ke Favorit');
                  setTimeout(() => setScanMessage(null), 3000);
                  setSelectedTrackForOptions(null);
                }}
                className={`w-full h-9 rounded-full font-medium text-[13px] inline-flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer ${
                  selectedTrackForOptions.is_favorite === 1
                    ? 'bg-pink-500/15 hover:bg-pink-500/20 text-pink-400'
                    : 'bg-[#252528] hover:bg-[#2e2e32] text-white'
                }`}
              >
                <Heart
                  className={`w-3.5 h-3.5 stroke-[2] ${selectedTrackForOptions.is_favorite === 1 ? 'fill-pink-400' : ''}`}
                />
                <span>{selectedTrackForOptions.is_favorite === 1 ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  const lists = await getAllPlaylists();
                  setAvailablePlaylists(lists);
                  setIsAddToPlaylistOpen(true);
                }}
                className="w-full h-9 rounded-full bg-[#252528] hover:bg-[#2e2e32] text-white font-medium text-[13px] inline-flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <ListPlus className="w-3.5 h-3.5 stroke-[2]" />
                <span>Tambah ke Playlist</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  deleteTrack(selectedTrackForOptions.id);
                  setSelectedTrackForOptions(null);
                }}
                className="w-full h-9 rounded-full bg-red-500/15 hover:bg-red-500/20 text-red-400 font-medium text-[13px] inline-flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Lagu</span>
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

      {/* Select Playlist Modal */}
      {isAddToPlaylistOpen && selectedTrackForOptions && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#1c1c1f] rounded-t-[24px] p-6 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] shadow-2xl max-h-[75vh] flex flex-col">
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
                  Belum ada playlist. Tambahkan playlist terlebih dahulu di tab Playlists.
                </div>
              ) : (
                availablePlaylists.map((pl) => (
                  <button
                    key={pl.id}
                    type="button"
                    onClick={async () => {
                      await addTrackToPlaylist(pl.id, selectedTrackForOptions.id);
                      setIsAddToPlaylistOpen(false);
                      setSelectedTrackForOptions(null);
                      setScanMessage(`Lagu ditambahkan ke "${pl.title}"`);
                      setTimeout(() => setScanMessage(null), 3500);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-[#252528] hover:bg-[#2d2d32] active:scale-[0.99] transition-all cursor-pointer text-left"
                  >
                    <div>
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
