import { Plus } from 'lucide-react';
import {
  ScreenLayout,
  ScreenHeader,
  SortBar,
  ActionButton,
  MiniPlayer,
  BottomNav,
  FeaturedCard,
  PlaylistItem,
} from './ui';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

interface PlaylistData {
  id: string;
  title: string;
  tracksCount: number;
  coverImage: string;
}

const PLAYLISTS: PlaylistData[] = [
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
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    seek,
    togglePlay,
    nextTrack,
    prevTrack,
  } = useAudioPlayer();

  return (
    <ScreenLayout>
      {/* Header */}
      <ScreenHeader title="Playlists" />

      {/* Scrollable Content */}
      <main className="flex-1 min-h-0 overflow-y-auto px-5 pt-2 pb-4 scrollbar-none overscroll-contain">
        {/* Featured Cards */}
        <div className="grid grid-cols-2 gap-3.5">
          <FeaturedCard title="Favorites" subtitle="8 tracks" />
          <FeaturedCard title="Recently Played" subtitle="7 tracks" />
        </div>

        {/* Sort Bar */}
        <SortBar
          className="mt-5 mb-3"
          rightContent={
            <ActionButton
              icon={<Plus className="w-3.5 h-3.5 stroke-[2.5]" />}
              label="Playlist"
              showLabel
            />
          }
        />

        {/* Playlist List */}
        <div className="space-y-1">
          {PLAYLISTS.map((item) => (
            <PlaylistItem
              key={item.id}
              title={item.title}
              subtitle={`${item.tracksCount} tracks`}
              coverImage={item.coverImage}
            />
          ))}
        </div>
      </main>

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

      {/* Bottom Navigation */}
      <BottomNav
        activeTab="playlists"
        onChangeTab={(tab) => {
          if (tab === 'tracks') onSwitchToTracks?.();
        }}
      />
    </ScreenLayout>
  );
}
