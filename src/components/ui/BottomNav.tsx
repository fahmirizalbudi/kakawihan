import { Music } from 'lucide-react';

export type TabType = 'playlists' | 'tracks';

export interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  className?: string;
}

/** 4-square grid icon for Playlists tab */
function GridIcon({ active }: { active: boolean }) {
  return (
    <div
      className={`grid grid-cols-2 gap-[2.5px] w-[20px] h-[20px] transition-opacity ${
        active ? 'opacity-100' : 'opacity-40'
      }`}
    >
      <div className="bg-white rounded-[3px]" />
      <div className="bg-white rounded-[3px]" />
      <div className="bg-white rounded-[3px]" />
      <div className="bg-white rounded-[3px]" />
    </div>
  );
}

/**
 * Modern flat bottom navigation with 2 tabs: Playlists and Tracks.
 * Sleek, borderless, with active pill indicator.
 */
export function BottomNav({
  activeTab,
  onChangeTab,
  className = '',
}: BottomNavProps) {
  return (
    <nav
      className={`bg-[#121214] px-14 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] flex items-center justify-around shrink-0 z-30 ${className}`}
    >
      {/* Tab: Playlists */}
      <button
        type="button"
        onClick={() => onChangeTab('playlists')}
        className={`px-4 py-2 rounded-xl transition-all active:scale-90 cursor-pointer flex items-center justify-center ${
          activeTab === 'playlists'
            ? 'bg-[#242426] text-white'
            : 'text-[#8e8e93] hover:text-white'
        }`}
        aria-label="Playlists tab"
      >
        <GridIcon active={activeTab === 'playlists'} />
      </button>

      {/* Tab: Tracks */}
      <button
        type="button"
        onClick={() => onChangeTab('tracks')}
        className={`px-4 py-2 rounded-xl transition-all active:scale-90 cursor-pointer flex items-center justify-center ${
          activeTab === 'tracks'
            ? 'bg-[#242426] text-white'
            : 'text-[#8e8e93] hover:text-white'
        }`}
        aria-label="Tracks tab"
      >
        <Music className="w-5 h-5 stroke-[2.2]" />
      </button>
    </nav>
  );
}
