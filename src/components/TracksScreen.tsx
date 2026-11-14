import { useState } from 'react';
import {
  Search,
  Settings,
  ChevronDown,
  Shuffle,
  Play,
  Download,
  MoreVertical,
  SkipBack,
  SkipForward,
  Pause,
  Music,
} from 'lucide-react';

interface TrackItem {
  id: string;
  title: string;
}

const TRACKS: TrackItem[] = [
  { id: '1', title: 'Afterglow' },
  { id: '2', title: 'Crystal Dreams' },
  { id: '3', title: 'Desert Bloom' },
  { id: '4', title: 'Echoes in the Sky' },
  { id: '5', title: 'Electric Soul' },
  { id: '6', title: 'Neon Mirage' },
];

interface TracksScreenProps {
  onSwitchToPlaylists?: () => void;
}

export function TracksScreen({ onSwitchToPlaylists }: TracksScreenProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeTrack, setActiveTrack] = useState<string>('Crystal Dreams');

  return (
    <div className="fixed inset-0 w-full h-[100dvh] max-h-[100dvh] bg-black text-white flex flex-col select-none overflow-hidden font-['Montserrat',sans-serif]">
      {/* 1. Top Header (Tracks + Search + Settings) */}
      <header className="px-6 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2 flex items-center justify-between shrink-0 bg-black z-20">
        <h1 className="text-[27px] font-bold text-white tracking-tight">Tracks</h1>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="text-white hover:text-white/80 active:scale-95 transition-transform cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-[21px] h-[21px] stroke-[2.2]" />
          </button>
          <button
            type="button"
            className="text-white hover:text-white/80 active:scale-95 transition-transform cursor-pointer"
            aria-label="Settings"
          >
            <Settings className="w-[21px] h-[21px] stroke-[2.2]" />
          </button>
        </div>
      </header>

      {/* 2. Controls Bar: Sort + Action Buttons (Shuffle, Play, Download) */}
      <div className="px-6 flex items-center justify-between pt-1 pb-3 shrink-0 bg-black z-20">
        {/* Sort Button */}
        <button
          type="button"
          className="flex items-center gap-1.5 text-white active:opacity-80 transition-opacity cursor-pointer"
        >
          <svg
            className="w-4 h-4 text-white"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M1 3.5h5a.75.75 0 0 1 0 1.5H1a.75.75 0 0 1 0-1.5zm0 4h3.5a.75.75 0 0 1 0 1.5H1a.75.75 0 0 1 0-1.5zm0 4h2a.75.75 0 0 1 0 1.5H1a.75.75 0 0 1 0-1.5z" />
            <path
              fillRule="evenodd"
              d="M11.22 2.22a.75.75 0 0 1 1.06 0l2.5 2.5a.75.75 0 1 1-1.06 1.06L12.5 4.56v9.19a.75.75 0 0 1-1.5 0V4.56L9.78 5.78a.75.75 0 0 1-1.06-1.06l2.5-2.5z"
            />
          </svg>
          <span className="font-semibold text-[14px]">Name</span>
          <ChevronDown className="w-3.5 h-3.5 text-white ml-0.5 stroke-[2.5]" />
        </button>

        {/* 3 Action Buttons in Rounded Circles */}
        <div className="flex items-center gap-2.5">
          {/* 1. Shuffle */}
          <button
            type="button"
            className="w-[38px] h-[38px] rounded-full bg-[#1c1c1f] hover:bg-[#28282c] active:scale-90 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
            aria-label="Shuffle"
          >
            <Shuffle className="w-4 h-4 stroke-[2.2]" />
          </button>

          {/* 2. Play */}
          <button
            type="button"
            className="w-[38px] h-[38px] rounded-full bg-[#1c1c1f] hover:bg-[#28282c] active:scale-90 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
            aria-label="Play all"
          >
            <Play className="w-4 h-4 fill-white text-white ml-0.5" />
          </button>

          {/* 3. Download */}
          <button
            type="button"
            className="w-[38px] h-[38px] rounded-full bg-[#1c1c1f] hover:bg-[#28282c] active:scale-90 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
            aria-label="Download"
          >
            <Download className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* 3. Scrollable Tracks List (HANYA BAGIAN INI YANG SCROLL) */}
      <main className="flex-1 min-h-0 overflow-y-auto px-6 space-y-4 pb-4 overscroll-contain scrollbar-none">
        {TRACKS.map((track) => {
          const isCurrentActive = activeTrack === track.title;
          return (
            <div
              key={track.id}
              onClick={() => setActiveTrack(track.title)}
              className="flex items-center justify-between group active:scale-[0.99] transition-transform cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Rounded Icon Container */}
                <div
                  className={`w-[56px] h-[56px] rounded-[18px] flex items-center justify-center shrink-0 border transition-all ${
                    isCurrentActive
                      ? 'bg-[#1e1e24] border-white/20 text-white shadow-md'
                      : 'bg-[#151518] border-white/[0.05] text-[#8e8e93] group-hover:text-white group-hover:bg-[#1a1a1e]'
                  }`}
                >
                  <Music className="w-6 h-6 stroke-[1.8]" />
                </div>

                <span
                  className={`font-semibold text-[15px] truncate tracking-tight transition-colors ${
                    isCurrentActive ? 'text-white font-bold' : 'text-white group-hover:text-slate-200'
                  }`}
                >
                  {track.title}
                </span>
              </div>

              <button
                type="button"
                className="p-1.5 text-[#8e8e93] hover:text-white transition-colors cursor-pointer shrink-0"
                aria-label={`Options for ${track.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <MoreVertical className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>
          );
        })}
      </main>

      {/* 4. Floating Mini Player (Tetap di atas Bottom Nav, tidak ikut scroll) */}
      <div className="px-5 mb-2 shrink-0 z-30">
        <div className="bg-[#171719] border border-white/[0.06] rounded-[22px] p-2 pr-4 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-3 min-w-0">
            {/* Music note icon for mini player */}
            <div className="w-11 h-11 rounded-[14px] bg-[#1e1e24] border border-white/10 flex items-center justify-center shrink-0 text-white shadow">
              <Music className="w-5 h-5 stroke-[1.9]" />
            </div>

            <span className="text-white font-semibold text-[14px] truncate tracking-tight">
              {activeTrack}
            </span>
          </div>

          <div className="flex items-center gap-3.5 shrink-0 ml-2">
            <button
              type="button"
              className="text-white active:scale-90 transition-transform cursor-pointer"
              aria-label="Previous track"
            >
              <SkipBack className="w-4 h-4 fill-white" />
            </button>

            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer hover:bg-slate-100"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-black text-black" />
              ) : (
                <Play className="w-4 h-4 fill-black text-black ml-0.5" />
              )}
            </button>

            <button
              type="button"
              className="text-white active:scale-90 transition-transform cursor-pointer"
              aria-label="Next track"
            >
              <SkipForward className="w-4 h-4 fill-white" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Fixed Bottom Navigation Bar (Selalu menempel di dasar layar mobile, gesture hint dihapus) */}
      <nav className="bg-black border-t border-white/[0.06] px-12 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center justify-around shrink-0 z-30">
        {/* Tab 1: 4 Rounded Squares Grid (Playlists) */}
        <button
          type="button"
          onClick={onSwitchToPlaylists}
          className="p-2 transition-transform active:scale-90 cursor-pointer text-[#636366] hover:text-[#8e8e93]"
          aria-label="Playlists tab"
        >
          <div className="grid grid-cols-2 gap-[3px] w-[21px] h-[21px] opacity-40 hover:opacity-70 transition-opacity">
            <div className="bg-white rounded-[4px]" />
            <div className="bg-white rounded-[4px]" />
            <div className="bg-white rounded-[4px]" />
            <div className="bg-white rounded-[4px]" />
          </div>
        </button>

        {/* Tab 2: Musical Note (Tracks - Active Tab) */}
        <button
          type="button"
          className="p-2 transition-transform active:scale-90 cursor-pointer text-white"
          aria-label="Tracks tab active"
        >
          <Music className="w-[23px] h-[23px] stroke-[2.2] text-white" />
        </button>
      </nav>
    </div>
  );
}
