import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  Play,
  ArrowLeft,
  Trash2,
  FolderPlus,
  ListMusic,
  Check,
  Folder,
  Camera,
  ImagePlus,
} from 'lucide-react';
import {
  ScreenLayout,
  ScreenHeader,
  MiniPlayer,
  BottomNav,
  PlaylistItem,
  TrackItem,
  Toast,
} from './ui';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import {
  getAllPlaylists,
  createPlaylist,
  deletePlaylist,
  getPlaylistTracks,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  type Playlist,
} from '../lib/playlistService';
import type { Track } from '../lib/trackService';

interface PlaylistScreenProps {
  onSwitchToTracks?: () => void;
}

export function PlaylistScreen({ onSwitchToTracks }: PlaylistScreenProps) {
  const {
    tracks: allLibraryTracks,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    seek,
    playTrack,
    togglePlay,
    nextTrack,
    prevTrack,
  } = useAudioPlayer();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState<boolean>(false);

  // Bottom sheet & form state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCover, setNewCover] = useState<string>('');
  const [isAddTracksModalOpen, setIsAddTracksModalOpen] = useState<boolean>(false);
  const [selectedTrackForOptions, setSelectedTrackForOptions] = useState<Track | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch all playlists
  const fetchPlaylists = useCallback(async () => {
    try {
      const data = await getAllPlaylists();
      setPlaylists(data);
    } catch (err) {
      console.error('Gagal mengambil daftar playlist:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  // Load tracks for a selected playlist
  const loadPlaylistTracks = useCallback(async (playlist: Playlist) => {
    setIsLoadingTracks(true);
    setSelectedPlaylist(playlist);
    try {
      const tracks = await getPlaylistTracks(playlist.id);
      setPlaylistTracks(tracks);
    } catch (err) {
      console.error('Gagal memuat lagu playlist:', err);
    } finally {
      setIsLoadingTracks(false);
    }
  }, []);

  // Handle cover image selection
  const handleCoverSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setNewCover(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Save new playlist with title and cover
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const created = await createPlaylist(newTitle.trim(), '', newCover);
      setNewTitle('');
      setNewCover('');
      setIsCreateModalOpen(false);
      await fetchPlaylists();
      showToast(`Playlist "${created.title}" berhasil ditambahkan`);
    } catch (err) {
      console.error('Gagal menambahkan playlist:', err);
      showToast('Gagal menambahkan playlist');
    }
  };

  // Delete playlist
  const handleDelete = async (playlist: Playlist) => {
    try {
      await deletePlaylist(playlist.id);
      if (selectedPlaylist?.id === playlist.id) {
        setSelectedPlaylist(null);
      }
      await fetchPlaylists();
      showToast(`Playlist "${playlist.title}" dihapus`);
    } catch (err) {
      console.error('Gagal menghapus playlist:', err);
      showToast('Gagal menghapus playlist');
    }
  };

  // Add / Remove track to playlist
  const handleToggleTrackInPlaylist = async (track: Track) => {
    if (!selectedPlaylist) return;
    const exists = playlistTracks.some((t) => t.id === track.id);

    try {
      if (exists) {
        await removeTrackFromPlaylist(selectedPlaylist.id, track.id);
        const updated = playlistTracks.filter((t) => t.id !== track.id);
        setPlaylistTracks(updated);
        showToast(`Lagu dihapus dari playlist`);
      } else {
        await addTrackToPlaylist(selectedPlaylist.id, track.id);
        setPlaylistTracks([...playlistTracks, track]);
        showToast(`Lagu ditambahkan ke playlist`);
      }
      await fetchPlaylists();
    } catch (err) {
      console.error('Gagal memperbarui playlist:', err);
    }
  };

  // Play entire playlist
  const handlePlayPlaylistAll = () => {
    if (playlistTracks.length === 0) return;
    playTrack(playlistTracks[0]);
  };

  return (
    <ScreenLayout>
      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Main View: Playlist List or Playlist Detail */}
      {!selectedPlaylist ? (
        /* PLAYLISTS LIST VIEW */
        <>
          <ScreenHeader
            title="Playlists"
            actions={
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="h-8 px-3.5 rounded-full bg-[#0061FE] hover:bg-[#0052d9] text-white font-medium text-[12.5px] inline-flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Tambah Playlist</span>
              </button>
            }
          />

          <main className="flex-1 min-h-0 overflow-y-auto px-5 pb-3 overscroll-contain scrollbar-none flex flex-col">
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-[#8e8e93] text-sm py-12">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mb-3" />
                <span>Memuat playlist...</span>
              </div>
            ) : playlists.length === 0 ? (
              /* Empty State - Matching the flat style */
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
                  Belum Ada Playlist
                </h3>
                <p className="text-[13px] text-[#8e8e93] max-w-[260px] leading-relaxed mb-6">
                  Kelompokkan dan susun lagu-lagu favorit Anda dalam playlist
                </p>

                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="h-9 px-5 rounded-full bg-[#0061FE] hover:bg-[#0052d9] text-white font-medium text-[13px] inline-flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Playlist</span>
                </button>
              </div>
            ) : (
              /* Playlist List */
              <div className="space-y-1 pt-1">
                {playlists.map((item) => (
                  <PlaylistItem
                    key={item.id}
                    title={item.title}
                    subtitle={`${item.tracks_count || 0} lagu`}
                    coverImage={item.cover_image || undefined}
                    onClick={() => loadPlaylistTracks(item)}
                  />
                ))}
              </div>
            )}
          </main>
        </>
      ) : (
        /* PLAYLIST DETAIL VIEW */
        <>
          <header className="px-5 pt-[calc(env(safe-area-inset-top,0px)+18px)] pb-2 flex items-center justify-between shrink-0 bg-[#101012] z-20">
            <button
              type="button"
              onClick={() => setSelectedPlaylist(null)}
              className="text-[#8e8e93] hover:text-white p-1 -ml-1 active:scale-95 transition-all cursor-pointer flex items-center gap-1 text-[13.5px] font-medium"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2]" />
              <span>Kembali</span>
            </button>

            <button
              type="button"
              onClick={() => handleDelete(selectedPlaylist)}
              className="text-red-400 hover:text-red-300 p-1.5 active:scale-95 transition-all cursor-pointer"
              aria-label="Hapus Playlist"
            >
              <Trash2 className="w-4 h-4 stroke-[2]" />
            </button>
          </header>

          <main className="flex-1 min-h-0 overflow-y-auto px-5 pb-3 overscroll-contain scrollbar-none flex flex-col">
            {/* Playlist Header Card */}
            <div className="flex items-center gap-4 py-3 shrink-0">
              {selectedPlaylist.cover_image ? (
                <img
                  src={selectedPlaylist.cover_image}
                  alt={selectedPlaylist.title}
                  className="w-14 h-14 rounded-[16px] object-cover shrink-0 bg-[#1c1c1e]"
                />
              ) : (
                <div className="w-14 h-14 rounded-[16px] bg-[#1c1c1e] text-[#0061FE] flex items-center justify-center shrink-0">
                  <ListMusic className="w-7 h-7 stroke-[2]" />
                </div>
              )}

              <div className="min-w-0">
                <h2 className="text-white font-semibold text-[18px] tracking-tight leading-tight truncate">
                  {selectedPlaylist.title}
                </h2>
                <p className="text-[#8e8e93] text-[12.5px] mt-1">
                  {playlistTracks.length} lagu tersimpan
                </p>
              </div>
            </div>

            {/* Action Buttons: Play All & Add Tracks */}
            <div className="flex items-center gap-2.5 py-2.5 shrink-0">
              <button
                type="button"
                onClick={handlePlayPlaylistAll}
                disabled={playlistTracks.length === 0}
                className="h-9 px-4 rounded-full bg-[#0061FE] hover:bg-[#0052d9] text-white font-medium text-[13px] inline-flex items-center gap-1.5 disabled:opacity-40 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
                <span>Putar Semua</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddTracksModalOpen(true)}
                className="h-9 px-3.5 rounded-full bg-[#1c1c1e] hover:bg-[#252528] text-white font-medium text-[13px] inline-flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2]" />
                <span>Tambah Lagu</span>
              </button>
            </div>

            {/* Playlist Tracks List */}
            {isLoadingTracks ? (
              <div className="flex-1 flex flex-col items-center justify-center text-[#8e8e93] text-sm py-12">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mb-3" />
                <span>Memuat lagu playlist...</span>
              </div>
            ) : playlistTracks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-10 px-4 my-auto select-none">
                <Folder className="w-12 h-12 text-[#3a3a3e] mb-3 stroke-[1.5]" />
                <h4 className="text-[15px] font-medium text-white mb-1">
                  Playlist ini masih kosong
                </h4>
                <p className="text-[12.5px] text-[#8e8e93] mb-5">
                  Tambahkan lagu favorit dari koleksi lokal Anda
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddTracksModalOpen(true)}
                  className="h-9 px-4 rounded-full bg-[#0061FE] hover:bg-[#0052d9] text-white font-medium text-[13px] inline-flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Pilih Lagu</span>
                </button>
              </div>
            ) : (
              <div className="space-y-1 pt-1">
                {playlistTracks.map((track) => (
                  <TrackItem
                    key={track.id}
                    title={track.title}
                    subtitle={`${(track.file_size / (1024 * 1024)).toFixed(1)} MB`}
                    isActive={currentTrack?.id === track.id}
                    onClick={() => playTrack(track)}
                    onOptions={() => setSelectedTrackForOptions(track)}
                  />
                ))}
              </div>
            )}
          </main>
        </>
      )}

      {/* Mini Player with Seeker Slider */}
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
        activeTab="playlists"
        onChangeTab={(tab) => {
          if (tab === 'tracks') onSwitchToTracks?.();
        }}
      />

      {/* BOTTOM SHEET DIALOG: Tambah Playlist (Style sama persis dengan TracksScreen) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#1c1c1f] rounded-t-[24px] p-6 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] shadow-2xl">
            {/* Drag handle */}
            <div className="w-10 h-1 bg-[#3a3a3e] rounded-full mx-auto mb-5 shrink-0" />

            {/* Header: Sesuai struktur TracksScreen */}
            <div className="flex items-center gap-3.5 mb-5 pb-4">
              <div className="w-11 h-11 rounded-[12px] bg-[#242428] flex items-center justify-center text-white shrink-0">
                <FolderPlus className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-white font-medium text-[14.5px] truncate tracking-tight">
                  Tambah Playlist
                </h4>
                <p className="text-[#8e8e93] text-xs mt-0.5 truncate">
                  {newTitle.trim() || 'Playlist baru tanpa nama'}
                </p>
              </div>
            </div>

            {/* Hidden image input for cover */}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverSelected}
            />

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Input 1: Cover Image Picker */}
              <div>
                <label className="text-[#8e8e93] text-xs font-medium block mb-1.5">
                  Foto Sampul (Opsional)
                </label>
                <div className="flex items-center gap-3.5 p-2.5 rounded-2xl bg-[#242428]">
                  <div
                    onClick={() => coverInputRef.current?.click()}
                    className="w-11 h-11 rounded-[10px] bg-[#1c1c1f] hover:bg-[#18181b] transition-colors cursor-pointer flex items-center justify-center relative overflow-hidden group shrink-0"
                  >
                    {newCover ? (
                      <>
                        <img
                          src={newCover}
                          alt="Sampul"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Camera className="w-3.5 h-3.5 text-white" />
                        </div>
                      </>
                    ) : (
                      <ImagePlus className="w-5 h-5 text-[#8e8e93] group-hover:text-white transition-colors" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-white text-[13px] font-medium truncate">
                      {newCover ? 'Sampul dipilih' : 'Pilih dari galeri'}
                    </p>
                    {newCover ? (
                      <button
                        type="button"
                        onClick={() => setNewCover('')}
                        className="text-red-400 hover:text-red-300 text-[11px] font-medium cursor-pointer"
                      >
                        Hapus foto
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        className="text-[#0061FE] text-[11px] font-medium cursor-pointer"
                      >
                        Ketuk untuk memilih foto
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Input 2: Nama Playlist */}
              <div>
                <label className="text-[#8e8e93] text-xs font-medium block mb-1.5">
                  Nama Playlist
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="Contoh: Lagu Favorit"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#242428] text-white text-[13.5px] placeholder-[#8e8e93] focus:outline-none"
                />
              </div>

              {/* Action Buttons: Stack vertikal sama seperti TracksScreen */}
              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="w-full h-9 rounded-full bg-[#0061FE] hover:bg-[#0052d9] disabled:opacity-40 text-white font-medium text-[13px] inline-flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  <span>Simpan Playlist</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewTitle('');
                    setNewCover('');
                  }}
                  className="w-full h-9 rounded-full bg-[#1c1c1e] hover:bg-[#252528] text-[#8e8e93] hover:text-white font-medium text-[13px] active:scale-95 transition-all cursor-pointer inline-flex items-center justify-center"
                >
                  Tutup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOTTOM SHEET 2: Tambah Lagu ke Playlist */}
      {isAddTracksModalOpen && selectedPlaylist && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#1c1c1f] rounded-t-[24px] p-6 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] shadow-2xl max-h-[80vh] flex flex-col">
            <div className="w-10 h-1 bg-[#3a3a3e] rounded-full mx-auto mb-4 shrink-0" />

            <div className="flex items-center justify-between pb-3 shrink-0">
              <div>
                <h3 className="text-white font-medium text-[15.5px] tracking-tight">
                  Pilih Lagu untuk Playlist
                </h3>
                <p className="text-[#8e8e93] text-[12px]">
                  {selectedPlaylist.title}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddTracksModalOpen(false)}
                className="h-8 px-3 rounded-full bg-[#252528] text-white font-medium text-[12px] active:scale-95 transition-all cursor-pointer"
              >
                Selesai
              </button>
            </div>

            {/* Track list to select from */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pt-2 scrollbar-none">
              {allLibraryTracks.length === 0 ? (
                <div className="text-center py-8 text-[#8e8e93] text-xs">
                  Belum ada lagu di library. Silakan pindai folder musik di tab Tracks terlebih dahulu.
                </div>
              ) : (
                allLibraryTracks.map((track) => {
                  const isAdded = playlistTracks.some((t) => t.id === track.id);
                  return (
                    <div
                      key={track.id}
                      onClick={() => handleToggleTrackInPlaylist(track)}
                      className="flex items-center justify-between py-2 px-2 rounded-xl hover:bg-[#252528] active:bg-[#2a2a2e] transition-colors cursor-pointer select-none"
                    >
                      <div className="min-w-0 pr-3">
                        <h4 className="text-white font-medium text-[14px] truncate">
                          {track.title}
                        </h4>
                        <p className="text-[#8e8e93] text-[11.5px] truncate">
                          {(track.file_size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          isAdded
                            ? 'bg-[#0061FE] text-white'
                            : 'bg-[#252528] text-[#8e8e93]'
                        }`}
                      >
                        {isAdded ? (
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM SHEET 3: Track Options in Playlist Detail */}
      {selectedTrackForOptions && selectedPlaylist && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#1c1c1f] rounded-t-[24px] p-6 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] shadow-2xl">
            <div className="w-10 h-1 bg-[#3a3a3e] rounded-full mx-auto mb-5" />

            <div className="flex items-center gap-3.5 mb-5 pb-4">
              <div className="w-11 h-11 rounded-[12px] bg-[#242428] flex items-center justify-center text-white shrink-0">
                <ListMusic className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-white font-medium text-[14.5px] truncate tracking-tight">
                  {selectedTrackForOptions.title}
                </h4>
                <p className="text-[#8e8e93] text-xs mt-0.5 truncate">
                  {selectedPlaylist.title}
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
                  await removeTrackFromPlaylist(selectedPlaylist.id, selectedTrackForOptions.id);
                  setPlaylistTracks(playlistTracks.filter((t) => t.id !== selectedTrackForOptions.id));
                  await fetchPlaylists();
                  setSelectedTrackForOptions(null);
                  showToast('Lagu dihapus dari playlist');
                }}
                className="w-full h-9 rounded-full bg-red-500/15 hover:bg-red-500/20 text-red-400 font-medium text-[13px] inline-flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus dari Playlist Ini</span>
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
    </ScreenLayout>
  );
}
