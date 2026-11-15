import { ChevronRight, ListMusic, MoreHorizontal } from 'lucide-react';

export interface PlaylistItemProps {
  title: string;
  subtitle: string;
  coverImage?: string;
  onClick?: () => void;
  onOptions?: () => void;
  className?: string;
}

/**
 * Single playlist list item with cover image or music list icon, title, subtitle, and right chevron.
 * Modern flat styling with consistent sizing.
 */
export function PlaylistItem({
  title,
  subtitle,
  coverImage,
  onClick,
  onOptions,
  className = '',
}: PlaylistItemProps) {
  return (
    <div
      className={`flex items-center justify-between group active:scale-[0.99] transition-all py-2 px-1.5 rounded-xl hover:bg-[#18181b] active:bg-[#1c1c1e] ${className}`}
    >
      {/* Left: cover + text — clickable */}
      <div
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
      >
        {coverImage ? (
          <img
            src={coverImage}
            alt={title}
            className="w-11 h-11 rounded-[12px] object-cover shrink-0 bg-[#1c1c1e]"
          />
        ) : (
          <div className="w-11 h-11 rounded-[12px] bg-[#1c1c1e] text-[#8e8e93] group-hover:text-white group-hover:bg-[#252528] flex items-center justify-center shrink-0 transition-colors">
            <ListMusic className="w-5 h-5 stroke-[2]" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-white font-medium text-[14.5px] tracking-tight leading-snug group-hover:text-slate-200 transition-colors truncate">
            {title}
          </h3>
          <p className="text-[#8e8e93] text-[12px] mt-0.5 truncate">{subtitle}</p>
        </div>
      </div>

      {/* Right: options (⋯) or chevron */}
      {onOptions ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOptions(); }}
          className="p-2 -mr-1 text-[#636366] hover:text-white active:scale-90 transition-all cursor-pointer shrink-0 ml-1"
          aria-label="Opsi playlist"
        >
          <MoreHorizontal className="w-[18px] h-[18px] stroke-[2]" />
        </button>
      ) : (
        <ChevronRight className="w-4 h-4 text-[#636366] stroke-[2] shrink-0 ml-2" />
      )}
    </div>
  );
}
