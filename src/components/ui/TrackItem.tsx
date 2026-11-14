import { Music, MoreVertical } from 'lucide-react';

export interface TrackItemProps {
  title: string;
  subtitle?: string;
  isActive?: boolean;
  onClick?: () => void;
  onOptions?: () => void;
  className?: string;
}

/**
 * Single track list item with flat music note icon, title, subtitle, and more-options button.
 * Borderless flat design with consistent sizing.
 */
export function TrackItem({
  title,
  subtitle,
  isActive = false,
  onClick,
  onOptions,
  className = '',
}: TrackItemProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between group active:scale-[0.99] transition-all cursor-pointer py-2 px-1.5 rounded-xl hover:bg-[#18181b] active:bg-[#1c1c1e] ${className}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Flat rounded icon container */}
        <div
          className={`w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0 transition-colors ${
            isActive
              ? 'bg-[#0061FE] text-white'
              : 'bg-[#1c1c1e] text-[#8e8e93] group-hover:text-white group-hover:bg-[#252528]'
          }`}
        >
          <Music className="w-5 h-5 stroke-[2]" />
        </div>

        <div className="min-w-0 flex flex-col justify-center">
          <span
            className={`font-medium text-[14.5px] truncate tracking-tight transition-colors ${
              isActive ? 'text-white font-semibold' : 'text-white'
            }`}
          >
            {title}
          </span>
          {subtitle && (
            <span className="text-[12px] text-[#8e8e93] truncate mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
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
        <MoreVertical className="w-4 h-4 stroke-[2]" />
      </button>
    </div>
  );
}
