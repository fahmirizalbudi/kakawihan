import { SkipBack, SkipForward, Play, Pause, Music } from 'lucide-react';

export interface MiniPlayerProps {
  trackTitle: string;
  subtitle?: string;
  /** Cover image URL. If not provided, shows a music note icon. */
  coverImage?: string;
  isPlaying: boolean;
  currentTime?: number;
  duration?: number;
  onTogglePlay: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onSeek?: (time: number) => void;
  className?: string;
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/**
 * Modern flat audio player with seeker slider, timestamps, and playback controls.
 * Clean, borderless design with smooth progress scrubbing.
 */
export function MiniPlayer({
  trackTitle,
  subtitle,
  coverImage,
  isPlaying,
  currentTime = 0,
  duration = 0,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  className = '',
}: MiniPlayerProps) {
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <div className={`px-4 mb-2.5 shrink-0 z-30 ${className}`}>
      <div className="bg-[#1c1c1f] rounded-[20px] pt-2.5 pb-2.5 px-4 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
        {/* Top: Cover, Title & Controls */}
        <div className="flex items-center justify-between">
          {/* Left: Cover + Title */}
          <div className="flex items-center gap-3 min-w-0 mr-2">
            {coverImage ? (
              <img
                src={coverImage}
                alt={trackTitle}
                className="w-10 h-10 rounded-[10px] object-cover shrink-0 bg-[#242428]"
              />
            ) : (
              <div className="w-10 h-10 rounded-[10px] bg-[#242428] flex items-center justify-center shrink-0 text-white">
                <Music className="w-5 h-5 stroke-[2]" />
              </div>
            )}
            <div className="min-w-0">
              <h4 className="text-white font-medium text-[14px] truncate tracking-tight leading-snug">
                {trackTitle}
              </h4>
              <p className="text-[#8e8e93] text-[11.5px] truncate">
                {subtitle || (isPlaying ? 'Memutar audio' : 'Dijeda')}
              </p>
            </div>
          </div>

          {/* Right: Flat Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onPrev}
              className="text-[#d1d1d6] hover:text-white active:scale-90 transition-transform cursor-pointer p-1"
              aria-label="Previous track"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            <button
              type="button"
              onClick={onTogglePlay}
              className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center active:scale-95 transition-transform cursor-pointer hover:bg-slate-100 shadow"
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
              onClick={onNext}
              className="text-[#d1d1d6] hover:text-white active:scale-90 transition-transform cursor-pointer p-1"
              aria-label="Next track"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>

        {/* Bottom: Music Seeker Slider with Timestamps */}
        <div className="mt-2.5 flex items-center gap-2">
          <span className="text-[11px] text-[#8e8e93] font-mono tabular-nums min-w-[28px] text-right">
            {formatTime(currentTime)}
          </span>

          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min={0}
              max={duration > 0 ? duration : 100}
              step={0.1}
              value={currentTime}
              disabled={duration <= 0}
              onChange={(e) => onSeek?.(Number(e.target.value))}
              style={{
                background:
                  duration > 0
                    ? `linear-gradient(to right, #0061FE ${progressPercent}%, #323236 ${progressPercent}%)`
                    : '#323236',
              }}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              aria-label="Audio progress seek slider"
            />
          </div>

          <span className="text-[11px] text-[#8e8e93] font-mono tabular-nums min-w-[28px]">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
