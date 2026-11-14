import { ChevronRight } from 'lucide-react';

export interface PlaylistItemProps {
  title: string;
  subtitle: string;
  coverImage: string;
  onClick?: () => void;
  className?: string;
}

/**
 * Single playlist list item with cover image, title, subtitle, and right chevron.
 */
export function PlaylistItem({
  title,
  subtitle,
  coverImage,
  onClick,
  className = '',
}: PlaylistItemProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between group active:scale-[0.99] transition-all cursor-pointer py-2 px-1.5 rounded-xl hover:bg-[#18181b] active:bg-[#1c1c1e] ${className}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <img
          src={coverImage}
          alt={title}
          className="w-11 h-11 rounded-[12px] object-cover shrink-0 bg-[#1c1c1e]"
        />
        <div className="min-w-0">
          <h3 className="text-white font-medium text-[14.5px] tracking-tight leading-snug group-hover:text-slate-200 transition-colors truncate">
            {title}
          </h3>
          <p className="text-[#8e8e93] text-[12px] mt-0.5 truncate">
            {subtitle}
          </p>
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-[#636366] stroke-[2] shrink-0 ml-2" />
    </div>
  );
}
