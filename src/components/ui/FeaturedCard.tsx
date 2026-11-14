import type { ReactNode } from 'react';
import { Music } from 'lucide-react';

export interface FeaturedCardProps {
  title: string;
  subtitle: string;
  /** Optional custom icon. Defaults to a large translucent Music note. */
  icon?: ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * Large featured card used for "Favorites" / "Recently Played" sections.
 * Shows a subtle background music icon with a centered label and subtitle below.
 */
export function FeaturedCard({
  title,
  subtitle,
  icon,
  onClick,
  className = '',
}: FeaturedCardProps) {
  return (
    <div className={className}>
      <div
        onClick={onClick}
        className="bg-[#161618] hover:bg-[#1c1c20] active:scale-[0.98] transition-all rounded-[22px] h-[136px] relative flex flex-col items-center justify-center p-3 cursor-pointer overflow-hidden border border-white/[0.04] shadow-sm"
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {icon ?? (
          <Music className="w-14 h-14 text-white/[0.10] absolute stroke-[1.8]" />
        )}
        <span className="text-white font-semibold text-[14.5px] z-10 text-center leading-snug">
          {title}
        </span>
      </div>
      <div className="text-center text-[12px] text-[#8e8e93] font-medium mt-2">
        {subtitle}
      </div>
    </div>
  );
}
