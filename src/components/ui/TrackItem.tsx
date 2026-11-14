import { Music, MoreVertical } from 'lucide-react';

export interface TrackItemProps {
  title: string;
  isActive?: boolean;
  onClick?: () => void;
  onOptions?: () => void;
  className?: string;
}

/**
 * Single track list item with music note icon, title, and more-options button.
 * Active state highlights the icon container with a subtle glow border.
 */
export function TrackItem({
  title,
  isActive = false,
  onClick,
  onOptions,
  className = '',
}: TrackItemProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between group active:scale-[0.99] transition-transform cursor-pointer py-0.5 ${className}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Rounded icon container */}
        <div
          className={`w-[54px] h-[54px] rounded-[16px] flex items-center justify-center shrink-0 border transition-all ${
            isActive
              ? 'bg-[#1e1e24] border-white/20 text-white shadow-sm'
              : 'bg-[#161618] border-white/[0.04] text-[#8e8e93] group-hover:text-white group-hover:bg-[#1a1a1e]'
          }`}
        >
          <Music className="w-6 h-6 stroke-[1.8]" />
        </div>

        <span
          className={`font-semibold text-[15px] truncate tracking-tight transition-colors ${
            isActive ? 'text-white' : 'text-white group-hover:text-slate-200'
          }`}
        >
          {title}
        </span>
      </div>

      <button
        type="button"
        className="p-2 -mr-1 text-[#8e8e93] active:text-white hover:text-white transition-colors cursor-pointer shrink-0"
        aria-label={`Options for ${title}`}
        onClick={(e) => {
          e.stopPropagation();
          onOptions?.();
        }}
      >
        <MoreVertical className="w-4 h-4 stroke-[2.2]" />
      </button>
    </div>
  );
}
