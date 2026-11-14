import type { ReactNode } from 'react';
import { Search, Settings } from 'lucide-react';

export interface ScreenHeaderProps {
  title: string;
  /** Optional extra actions to render instead of the default Search + Settings */
  actions?: ReactNode;
  className?: string;
}

/**
 * Consistent mobile screen header with balanced title and action icons.
 * Automatically respects top safe-area (notch / dynamic island / status bar) with generous clearance.
 */
export function ScreenHeader({ title, actions, className = '' }: ScreenHeaderProps) {
  return (
    <header
      className={`px-5 pt-[calc(env(safe-area-inset-top,0px)+18px)] pb-2 flex items-center justify-between shrink-0 bg-[#101012] z-20 ${className}`}
    >
      <h1 className="text-[26px] font-bold text-white tracking-tight leading-none">
        {title}
      </h1>
      <div className="flex items-center gap-3">
        {actions ?? (
          <>
            <button
              type="button"
              className="text-[#8e8e93] hover:text-white p-1.5 active:scale-95 transition-all cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-5 h-5 stroke-[2]" />
            </button>
            <button
              type="button"
              className="text-[#8e8e93] hover:text-white p-1.5 active:scale-95 transition-all cursor-pointer"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 stroke-[2]" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
