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
      className={`grid grid-cols-2 gap-[3px] w-[21px] h-[21px] transition-opacity ${
        active ? 'opacity-100' : 'opacity-40'
      }`}
    >
      <div className="bg-white rounded-[4px]" />
      <div className="bg-white rounded-[4px]" />
      <div className="bg-white rounded-[4px]" />
      <div className="bg-white rounded-[4px]" />
    </div>
  );
}

/**
 * Fixed bottom navigation with Playlists (grid) and Tracks (music note) tabs.
 * Dynamically adjusts for bottom safe area (home indicator bar on modern iOS / Android).
 */
export function BottomNav({ activeTab, onChangeTab, className = '' }: BottomNavProps) {
  return (
    <nav
      className={`bg-[#18181a] border-t border-white/[0.06] px-14 pt-2.5 pb-[calc(env(safe-area-inset-bottom,0px)+10px)] flex items-center justify-around shrink-0 z-30 ${className}`}
    >
      {/* Tab: Playlists */}
      <button
        type="button"
        onClick={() => onChangeTab('playlists')}
        className="p-2.5 transition-transform active:scale-90 cursor-pointer"
        aria-label={activeTab === 'playlists' ? 'Playlists tab active' : 'Switch to Playlists'}
      >
        <GridIcon active={activeTab === 'playlists'} />
      </button>

      {/* Tab: Tracks */}
      <button
        type="button"
        onClick={() => onChangeTab('tracks')}
        className={`p-2.5 transition-transform active:scale-90 cursor-pointer ${
          activeTab === 'tracks' ? 'text-white opacity-100' : 'text-[#8e8e93] opacity-60'
        }`}
        aria-label={activeTab === 'tracks' ? 'Tracks tab active' : 'Switch to Tracks'}
      >
        <Music className="w-[23px] h-[23px] stroke-[2.2]" />
      </button>
    </nav>
  );
}
