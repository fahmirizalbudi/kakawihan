import { useState, useRef, useMemo } from 'react';
import {
  Shuffle,
  Play,
  FolderOpen,
  Trash2,
  FileAudio,
  ListPlus,
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
  } = useAudioPlayer();

  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [selectedTrackForOptions, setSelectedTrackForOptions] = useState<Track | null>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState<boolean>(false);
  const [availablePlaylists, setAvailablePlaylists] = useState<Playlist[]>([]);

  const folderInputRef = useRef<HTMLInputElement | null>(null);

  // Handle files selected from folder picker
  const handleFolderSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const added = await scanAudioFiles(files);
      if (added > 0) {
        setScanMessage(`Berhasil menambahkan ${added} lagu dari folder`);
      } else {
        setScanMessage('Tidak ada file audio (.mp3, .wav, .m4a, dll) di folder ini.');
      }
      setTimeout(() => setScanMessage(null), 3500);
    } catch {
      setScanMessage('Gagal memindai file audio dari folder.');
      setTimeout(() => setScanMessage(null), 3500);
    } finally {
      e.target.value = '';
    }
  };

  // Scan 1 folder
  const handleScanFolder = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        // @ts-expect-error File System Access API
        const dirHandle = await window.showDirectoryPicker();
        const audioFiles: File[] = [];

        async function scanDirectory(handle: any) {
          for await (const entry of handle.values()) {
            if (entry.kind === 'file') {
              const file = await entry.getFile();
              if (
                file.type.startsWith('audio/') ||
                /\.(mp3|wav|ogg|m4a|aac|flac|weba)$/i.test(file.name)
              ) {
                audioFiles.push(file);
              }
            } else if (entry.kind === 'directory') {
              await scanDirectory(entry);
            }
          }
        }

        await scanDirectory(dirHandle);

        if (audioFiles.length > 0) {
          const added = await scanAudioFiles(audioFiles);
          setScanMessage(`Berhasil menambahkan ${added} lagu dari folder "${dirHandle.name}"`);
          setTimeout(() => setScanMessage(null), 3500);
        } else {
          setScanMessage(`Tidak ada file audio di folder "${dirHandle.name}".`);
          setTimeout(() => setScanMessage(null), 3500);
        }
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        // Fallback to folder input
      }
    }

    folderInputRef.current?.click();
  };

  const handleShuffle = () => {
    if (tracks.length === 0) return;
    const randomIndex = Math.floor(Math.random() * tracks.length);
    playTrack(tracks[randomIndex]);
  };

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    playTrack(tracks[0]);
  };

  // Sorted tracks
  const sortedTracks = useMemo(() => {
    return [...tracks].sort((a, b) =>
      sortAsc
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title)
    );
  }, [tracks, sortAsc]);

  return (
    <ScreenLayout>
      {/* Hidden Folder Input for scanning 1 whole folder */}
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is standard for folder upload in modern browsers
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
        onChange={handleFolderSelected}
      />

      {/* Screen Header */}
      <ScreenHeader title="Tracks" />

      {/* Action Row: Scan Folder & Shuffle */}
      <div className="flex items-center gap-2.5 px-5 pt-1 pb-2 shrink-0">
        <button
          type="button"
          onClick={handleScanFolder}
          className="h-9 px-4 rounded-full bg-[#0061FE] hover:bg-[#0052d9] text-white font-medium text-[13px] inline-flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
        >
          <FolderOpen className="w-4 h-4 stroke-[2]" />
          <span>Scan Folder</span>
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
            <span className="text-white font-medium">Memindai folder audio ke SQLite...</span>
            <span className="text-xs text-[#8e8e93] mt-1">Harap tunggu sebentar</span>
          </div>
        ) : tracks.length === 0 ? (
          /* Empty State - Flat style inspired by screenshot */
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4 my-auto select-none">
            {/* Flat Document outline icon with plus sign */}
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
              Pindai folder musik dari perangkat Anda untuk menambahkan lagu
            </p>

            {/* Flat Blue Action Button - unified size, not oversized */}
            <button
              type="button"
              onClick={handleScanFolder}
              className="h-9 px-5 rounded-full bg-[#0061FE] hover:bg-[#0052d9] text-white font-medium text-[13px] inline-flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Scan Folder Lagu</span>
            </button>
          </div>
        ) : (
          /* Track Items List */
          <div className="space-y-1">
            {sortedTracks.map((track) => (
              <TrackItem
                key={track.id}
                title={track.title}
                subtitle={`${(track.file_size / (1024 * 1024)).toFixed(1)} MB • ${track.file_name.split('.').pop()?.toUpperCase() || 'AUDIO'}`}
                isActive={currentTrack?.id === track.id}
                onClick={() => playTrack(track)}
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
                  Belum ada playlist. Buat playlist terlebih dahulu di tab Playlists.
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
