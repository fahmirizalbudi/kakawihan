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
        className="bg-[#1c1c1e] hover:bg-[#242428] active:scale-[0.98] transition-all rounded-[18px] h-[120px] relative flex flex-col items-center justify-center p-3 cursor-pointer overflow-hidden"
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {icon ?? (
          <Music className="w-12 h-12 text-white/[0.08] absolute stroke-[1.8]" />
        )}
        <span className="text-white font-medium text-[14px] z-10 text-center leading-snug">
          {title}
        </span>
      </div>
      <div className="text-center text-[12px] text-[#8e8e93] mt-1.5">
        {subtitle}
      </div>
    </div>
  );
}
