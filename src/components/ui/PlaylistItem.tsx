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
      className={`flex items-center justify-between group active:scale-[0.99] transition-transform cursor-pointer py-0.5 ${className}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <img
          src={coverImage}
          alt={title}
          className="w-[54px] h-[54px] rounded-[16px] object-cover shrink-0 shadow-sm bg-[#161618] border border-white/[0.04]"
        />
        <div className="min-w-0">
          <h3 className="text-white font-semibold text-[15px] tracking-tight leading-snug group-hover:text-slate-200 transition-colors truncate">
            {title}
          </h3>
          <p className="text-[#8e8e93] text-[12.5px] font-medium mt-0.5 truncate">
            {subtitle}
          </p>
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-[#636366] stroke-[2.5] shrink-0 ml-2" />
    </div>
  );
}
