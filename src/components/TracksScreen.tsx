import { useState, useRef } from 'react';
import {
  Shuffle,
  Play,
  Plus,
  Music,
  FolderOpen,
  Sparkles,
  Trash2,
  X,
  FileAudio,
} from 'lucide-react';
import {
  ScreenLayout,
  ScreenHeader,
  SortBar,
  ActionButton,
  MiniPlayer,
  BottomNav,
  TrackItem,
} from './ui';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import type { Track } from '../lib/trackService';

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
    playTrack,
    togglePlay,
    nextTrack,
    prevTrack,
    scanAudioFiles,
    seedDemoTrack,
    deleteTrack,
  } = useAudioPlayer();

  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [selectedTrackForOptions, setSelectedTrackForOptions] = useState<Track | null>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle files selected from phone file picker
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const added = await scanAudioFiles(files);
      setScanMessage(`Berhasil menambahkan ${added} lagu ke SQLite`);
      setTimeout(() => setScanMessage(null), 3500);
    } catch {
      setScanMessage('Gagal memindai beberapa file audio.');
      setTimeout(() => setScanMessage(null), 3500);
    } finally {
      // Reset input value so same files can be re-selected if needed
      e.target.value = '';
    }
  };

  const handleTriggerScan = () => {
    fileInputRef.current?.click();
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

  // Sort tracks
  const sortedTracks = [...tracks].sort((a, b) => {
    return sortAsc
      ? a.title.localeCompare(b.title)
      : b.title.localeCompare(a.title);
  });

  return (
    <ScreenLayout>
      {/* Hidden File Input for scanning audio files from phone */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.weba"
        multiple
        className="hidden"
        onChange={handleFilesSelected}
      />

      {/* Header */}
      <ScreenHeader title="Tracks" />

      {/* Sort & Action Bar */}
      <SortBar
        className="px-5 pt-2 pb-4 shrink-0 bg-[#0c0c0c] z-20"
        label={sortAsc ? 'Name (A-Z)' : 'Name (Z-A)'}
        onSortClick={() => setSortAsc(!sortAsc)}
        rightContent={
          <div className="flex items-center gap-2">
            <ActionButton
              icon={<Shuffle className="w-4 h-4 stroke-[2.2]" />}
              label="Shuffle"
              onClick={handleShuffle}
            />
            <ActionButton
              icon={<Play className="w-4 h-4 fill-white text-white ml-0.5" />}
              label="Play all"
              onClick={handlePlayAll}
            />
            <ActionButton
              icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
              label="Scan Lagu dari HP"
              onClick={handleTriggerScan}
            />
          </div>
        }
      />

      {/* Toast Notification */}
      {scanMessage && (
        <div className="mx-5 mb-2 px-3.5 py-2 rounded-xl bg-[#1e1e24] border border-white/10 text-xs text-slate-200 flex items-center justify-between shadow-lg animate-in fade-in duration-200">
          <span>{scanMessage}</span>
          <button
            type="button"
            onClick={() => setScanMessage(null)}
            className="text-slate-400 hover:text-white ml-2 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Track List Container */}
      <main className="flex-1 min-h-0 overflow-y-auto px-5 space-y-4 pb-4 overscroll-contain scrollbar-none">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 text-[#8e8e93] text-sm">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mb-3" />
            <span>Memuat database SQLite...</span>
          </div>
        ) : isScanning ? (
          <div className="flex flex-col items-center justify-center h-48 text-[#8e8e93] text-sm">
            <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-white font-medium">Memindai & menyimpan lagu ke SQLite...</span>
            <span className="text-xs text-slate-400 mt-1">Harap tunggu sebentar</span>
          </div>
        ) : sortedTracks.length === 0 ? (
          /* Empty State */
          <div className="bg-[#141416] border border-white/[0.06] rounded-[24px] p-6 text-center my-4 flex flex-col items-center shadow-lg">
            <div className="w-14 h-14 rounded-2xl bg-[#1f1f24] border border-white/10 flex items-center justify-center text-white mb-4 shadow">
              <Music className="w-7 h-7 stroke-[1.8]" />
            </div>

            <h3 className="text-base font-bold text-white mb-1.5 tracking-tight">
              Belum Ada Lagu di SQLite
            </h3>
            <p className="text-xs text-[#8e8e93] max-w-[270px] leading-relaxed mb-5">
              Pindai dan tambahkan file audio (.mp3, .m4a, .wav) langsung dari HP Anda ke database lokal.
            </p>

            <div className="flex flex-col w-full gap-2.5">
              <button
                type="button"
                onClick={handleTriggerScan}
                className="w-full py-3 px-4 rounded-xl bg-white text-black font-semibold text-sm flex items-center justify-center gap-2 active:scale-98 transition-transform cursor-pointer shadow-md hover:bg-slate-100"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Pindai Lagu dari HP</span>
              </button>

              <button
                type="button"
                onClick={seedDemoTrack}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1e1e24] hover:bg-[#25252c] text-slate-300 font-medium text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-transform cursor-pointer border border-white/10"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Muat Lagu Contoh (Demo Chime)</span>
              </button>
            </div>
          </div>
        ) : (
          /* Track Items List */
          sortedTracks.map((track) => (
            <TrackItem
              key={track.id}
              title={track.title}
              isActive={currentTrack?.id === track.id}
              onClick={() => playTrack(track)}
              onOptions={() => setSelectedTrackForOptions(track)}
            />
          ))
        )}
      </main>

      {/* Floating Mini Player */}
      <MiniPlayer
        trackTitle={currentTrack ? currentTrack.title : 'Belum ada lagu'}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onPrev={prevTrack}
        onNext={nextTrack}
      />

      {/* Fixed Bottom Navigation */}
      <BottomNav
        activeTab="tracks"
        onChangeTab={(tab) => {
          if (tab === 'playlists') onSwitchToPlaylists?.();
        }}
      />

      {/* Track Options Modal / Bottom Sheet */}
      {selectedTrackForOptions && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#18181b] border-t border-white/10 rounded-t-[28px] p-6 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] shadow-2xl">
            {/* Modal Drag handle */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

            <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-white/[0.08]">
              <div className="w-12 h-12 rounded-[14px] bg-[#222228] border border-white/10 flex items-center justify-center text-white shrink-0">
                <FileAudio className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-white font-semibold text-sm truncate tracking-tight">
                  {selectedTrackForOptions.title}
                </h4>
                <p className="text-slate-400 text-xs mt-0.5 truncate">
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
                className="w-full py-3 px-4 rounded-xl bg-white text-black font-semibold text-sm flex items-center justify-center gap-2 active:scale-98 transition-transform cursor-pointer"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Putar Sekarang</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  deleteTrack(selectedTrackForOptions.id);
                  setSelectedTrackForOptions(null);
                }}
                className="w-full py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-sm flex items-center justify-center gap-2 active:scale-98 transition-transform cursor-pointer border border-red-500/20"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus dari Database</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTrackForOptions(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-transparent text-slate-400 hover:text-white font-medium text-xs active:scale-98 transition-transform cursor-pointer text-center"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </ScreenLayout>
  );
}
