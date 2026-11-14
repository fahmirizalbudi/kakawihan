import { useState } from 'react';
import { Shuffle, Play, Download } from 'lucide-react';
import {
  ScreenLayout,
  ScreenHeader,
  SortBar,
  ActionButton,
  MiniPlayer,
  BottomNav,
  TrackItem,
} from './ui';

interface TrackData {
  id: string;
  title: string;
}

const TRACKS: TrackData[] = [
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
    <ScreenLayout>
      {/* Header */}
      <ScreenHeader title="Tracks" />

      {/* Sort & Action Bar (Fixed under header with comfortable spacing) */}
      <SortBar
        className="px-5 pt-2 pb-4 shrink-0 bg-[#0c0c0c] z-20"
        rightContent={
          <div className="flex items-center gap-2">
            <ActionButton
              icon={<Shuffle className="w-4 h-4 stroke-[2.2]" />}
              label="Shuffle"
            />
            <ActionButton
              icon={<Play className="w-4 h-4 fill-white text-white ml-0.5" />}
              label="Play all"
            />
            <ActionButton
              icon={<Download className="w-4 h-4 stroke-[2.2]" />}
              label="Download"
            />
          </div>
        }
      />

      {/* Scrollable Track List */}
      <main className="flex-1 min-h-0 overflow-y-auto px-5 space-y-4 pb-4 overscroll-contain scrollbar-none">
        {TRACKS.map((track) => (
          <TrackItem
            key={track.id}
            title={track.title}
            isActive={activeTrack === track.title}
            onClick={() => setActiveTrack(track.title)}
          />
        ))}
      </main>

      {/* Mini Player */}
      <MiniPlayer
        trackTitle={activeTrack}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
      />

      {/* Bottom Navigation */}
      <BottomNav
        activeTab="tracks"
        onChangeTab={(tab) => {
          if (tab === 'playlists') onSwitchToPlaylists?.();
        }}
      />
    </ScreenLayout>
  );
}
