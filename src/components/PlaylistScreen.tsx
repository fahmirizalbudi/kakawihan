import { useState } from 'react';
import {
  Search,
  Settings,
  ChevronDown,
  ChevronRight,
  Plus,
  Music,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Wifi,
} from 'lucide-react';

interface PlaylistItem {
  id: string;
  title: string;
  tracksCount: number;
  coverImage: string;
}

const PLAYLISTS: PlaylistItem[] = [
  {
    id: '1',
    title: 'Chill Vibes',
    tracksCount: 7,
    coverImage: '/covers/chill-vibes.jpg',
  },
  {
    id: '2',
    title: 'Focus Mode',
    tracksCount: 4,
    coverImage: '/covers/focus-mode.jpg',
  },
  {
    id: '3',
    title: 'Late Night Loops',
    tracksCount: 5,
    coverImage: '/covers/late-night-loops.jpg',
  },
];

interface PlaylistScreenProps {
  onSwitchToTracks?: () => void;
}

export function PlaylistScreen({ onSwitchToTracks }: PlaylistScreenProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'grid' | 'music'>('grid');

  return (
    <div className="w-full h-full bg-black text-white flex flex-col select-none overflow-hidden font-['Montserrat',sans-serif]">
      {/* 1. iOS Status Bar */}
      <div className="pt-3 px-7 flex items-center justify-between text-white shrink-0 z-20">
        <span className="text-[14px] font-semibold tracking-tight">8:04</span>

        {/* Dynamic Island */}
        <div className="w-[105px] h-[26px] bg-black rounded-full flex items-center justify-end pr-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#1c1c1e] border border-[#2c2c2e]" />
        </div>

        {/* Signal, WiFi, Battery */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-end gap-[1.5px] h-3">
            <span className="w-[3px] h-1 bg-white rounded-[0.5px]"></span>
            <span className="w-[3px] h-1.5 bg-white rounded-[0.5px]"></span>
            <span className="w-[3px] h-2.5 bg-white rounded-[0.5px]"></span>
            <span className="w-[3px] h-3 bg-white rounded-[0.5px]"></span>
          </div>

          <Wifi className="w-3.5 h-3.5 text-white stroke-[2.5]" />

          {/* Battery pill showing 66 */}
          <div className="flex items-center">
            <div className="w-[23px] h-[11.5px] rounded-[3.5px] border border-white/50 p-[1px] flex items-center bg-[#facc15] text-[8.5px] font-extrabold text-black justify-center leading-none">
              66
            </div>
            <div className="w-[1.5px] h-[4px] bg-white/50 rounded-r-xs -ml-[0.5px]" />
          </div>
        </div>
      </div>

      {/* 2. Top Header (Playlists + Search + Settings) */}
      <div className="px-6 pt-5 pb-3 flex items-center justify-between shrink-0">
        <h1 className="text-[27px] font-bold text-white tracking-tight">Playlists</h1>
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
      </div>

      {/* 3. Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 pt-2 pb-2 scrollbar-none">
        {/* Top 2 Featured Cards */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* Card 1: Favorites */}
          <div>
            <div className="bg-[#151517] hover:bg-[#1a1a1d] active:scale-[0.98] transition-all rounded-[24px] h-[138px] relative flex flex-col items-center justify-center p-3 cursor-pointer overflow-hidden shadow-sm">
              <Music className="w-16 h-16 text-white/10 absolute stroke-[1.8]" />
              <span className="text-white font-semibold text-[15px] z-10">Favorites</span>
            </div>
            <div className="text-center text-[12px] text-[#8e8e93] font-medium mt-2">
              8 tracks
            </div>
          </div>

          {/* Card 2: Recently Played */}
          <div>
            <div className="bg-[#151517] hover:bg-[#1a1a1d] active:scale-[0.98] transition-all rounded-[24px] h-[138px] relative flex flex-col items-center justify-center p-3 cursor-pointer overflow-hidden shadow-sm">
              <Music className="w-16 h-16 text-white/10 absolute stroke-[1.8]" />
              <span className="text-white font-semibold text-[15px] z-10 text-center leading-tight">
                Recently Played
              </span>
            </div>
            <div className="text-center text-[12px] text-[#8e8e93] font-medium mt-2">
              7 tracks
            </div>
          </div>
        </div>

        {/* List Controls: Name sort & Plus */}
        <div className="flex items-center justify-between mt-7 mb-4">
          <button
            type="button"
            className="flex items-center gap-1.5 text-white active:opacity-80 transition-opacity cursor-pointer"
          >
            {/* Sort icon matching the screenshot */}
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

          <button
            type="button"
            className="text-white active:scale-90 transition-transform cursor-pointer"
            aria-label="Add Playlist"
          >
            <Plus className="w-6 h-6 stroke-[2.8]" />
          </button>
        </div>

        {/* Playlists List */}
        <div className="space-y-4">
          {PLAYLISTS.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between group active:scale-[0.99] transition-transform cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <img
                  src={item.coverImage}
                  alt={item.title}
                  className="w-[58px] h-[58px] rounded-[18px] object-cover shrink-0 shadow-md bg-[#1c1c1e]"
                />
                <div>
                  <h3 className="text-white font-semibold text-[15px] tracking-tight group-hover:text-slate-200 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[#8e8e93] text-[12.5px] font-medium mt-0.5">
                    {item.tracksCount} tracks
                  </p>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-[#636366] stroke-[2.5]" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Floating Mini Player (Crystal Dreams) */}
      <div className="px-5 mb-2 shrink-0">
        <div className="bg-[#171719] border border-white/[0.06] rounded-[22px] p-2 pr-4 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/covers/crystal-dreams.jpg"
              alt="Crystal Dreams"
              className="w-11 h-11 rounded-[14px] object-cover shrink-0 shadow bg-[#1c1c1e]"
            />
            <span className="text-white font-semibold text-[14px] truncate tracking-tight">
              Crystal Dreams
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

      {/* 5. Bottom Navigation Bar */}
      <div className="bg-black border-t border-white/[0.04] px-12 pt-3 pb-2 flex flex-col shrink-0">
        <div className="flex items-center justify-around">
          {/* Tab 1: 4 Rounded Squares Grid */}
          <button
            type="button"
            onClick={() => setActiveTab('grid')}
            className={`p-2 transition-transform active:scale-90 cursor-pointer ${
              activeTab === 'grid' ? 'opacity-100' : 'opacity-40 hover:opacity-70'
            }`}
            aria-label="Grid view"
          >
            <div className="grid grid-cols-2 gap-[3px] w-[21px] h-[21px]">
              <div className="bg-white rounded-[4px]" />
              <div className="bg-white rounded-[4px]" />
              <div className="bg-white rounded-[4px]" />
              <div className="bg-white rounded-[4px]" />
            </div>
          </button>

          {/* Tab 2: Musical Note (Switch to Tracks) */}
          <button
            type="button"
            onClick={onSwitchToTracks}
            className="p-2 transition-transform active:scale-90 cursor-pointer text-[#636366] hover:text-[#8e8e93]"
            aria-label="Switch to Tracks"
          >
            <Music className="w-[23px] h-[23px] stroke-[2.2]" />
          </button>
        </div>

        {/* iPhone Home Indicator */}
        <div className="w-36 h-1 bg-white/90 rounded-full mx-auto mt-3 mb-1" />
      </div>
    </div>
  );
}
