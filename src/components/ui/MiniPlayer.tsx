import { SkipBack, SkipForward, Play, Pause, Music } from 'lucide-react';

export interface MiniPlayerProps {
  trackTitle: string;
  /** Cover image URL. If not provided, shows a music note icon. */
  coverImage?: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  className?: string;
}

/**
 * Floating mini player bar with cover art, track title, and playback controls.
 * Elevated above the bottom navigation bar with comfortable breathing room.
 */
export function MiniPlayer({
  trackTitle,
  coverImage,
  isPlaying,
  onTogglePlay,
  onPrev,
  onNext,
  className = '',
}: MiniPlayerProps) {
  return (
    <div className={`px-4 mb-3.5 shrink-0 z-30 ${className}`}>
      <div className="bg-[#1c1c1e] border border-white/[0.08] rounded-[22px] p-2 pr-3.5 flex items-center justify-between shadow-[0_8px_24px_rgba(0,0,0,0.55)]">
        {/* Left: Cover + Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          {coverImage ? (
            <img
              src={coverImage}
              alt={trackTitle}
              className="w-[42px] h-[42px] rounded-[12px] object-cover shrink-0 shadow bg-[#181818]"
            />
          ) : (
            <div className="w-[42px] h-[42px] rounded-[12px] bg-[#161618] border border-white/10 flex items-center justify-center shrink-0 text-white shadow">
              <Music className="w-5 h-5 stroke-[1.9]" />
            </div>
          )}
          <span className="text-white font-semibold text-[14px] truncate tracking-tight">
            {trackTitle}
          </span>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-3 shrink-0 ml-2">
          <button
            type="button"
            onClick={onPrev}
            className="text-white active:scale-90 transition-transform cursor-pointer p-1"
            aria-label="Previous track"
          >
            <SkipBack className="w-[15px] h-[15px] fill-white text-white" />
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            className="w-[36px] h-[36px] rounded-full bg-white text-black flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer hover:bg-slate-100"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-[15px] h-[15px] fill-black text-black" />
            ) : (
              <Play className="w-[15px] h-[15px] fill-black text-black ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={onNext}
            className="text-white active:scale-90 transition-transform cursor-pointer p-1"
            aria-label="Next track"
          >
            <SkipForward className="w-[15px] h-[15px] fill-white text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
