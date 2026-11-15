import { SkipBack, SkipForward, Play, Pause, Music } from 'lucide-react';

export interface MiniPlayerProps {
  trackTitle: string;
  subtitle?: string;
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
  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <div className={`px-4 mb-2.5 shrink-0 z-30 ${className}`}>
      <div className="bg-[#1c1c1f] rounded-[20px] px-4 pt-3 pb-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">

        {/* Header: same layout as bottom sheet track item header */}
        <div className="flex items-center justify-between mb-2.5">
          {/* Left: icon + title/subtitle */}
          <div className="flex items-center gap-3.5 min-w-0 mr-3">
            {coverImage ? (
              <img
                src={coverImage}
                alt={trackTitle}
                className="w-11 h-11 rounded-[12px] object-cover shrink-0 bg-[#242428]"
              />
            ) : (
              <div className="w-11 h-11 rounded-[12px] bg-[#242428] flex items-center justify-center shrink-0 text-white">
                <Music className="w-5 h-5 stroke-[2]" />
              </div>
            )}
            <div className="min-w-0">
              <h4 className="text-white font-medium text-[14.5px] truncate tracking-tight">
                {trackTitle}
              </h4>
              <p className="text-[#8e8e93] text-xs mt-0.5 truncate">
                {subtitle || (isPlaying ? 'Memutar audio' : 'Dijeda')}
              </p>
            </div>
          </div>

          {/* Right: playback controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onPrev}
              className="p-1.5 text-[#8e8e93] hover:text-white active:scale-90 transition-all cursor-pointer"
              aria-label="Previous track"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            <button
              type="button"
              onClick={onTogglePlay}
              className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center active:scale-95 transition-transform cursor-pointer hover:bg-slate-100 shadow-sm"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-black text-black" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-black text-black ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={onNext}
              className="p-1.5 text-[#8e8e93] hover:text-white active:scale-90 transition-all cursor-pointer"
              aria-label="Next track"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>

        {/* Seeker row: timestamps + slider */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#8e8e93] tabular-nums min-w-[28px] text-right">
            {formatTime(currentTime)}
          </span>

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
            className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
            aria-label="Audio seeker"
          />

          <span className="text-[11px] text-[#8e8e93] tabular-nums min-w-[28px]">
            {formatTime(duration)}
          </span>
        </div>

      </div>
    </div>
  );
}
