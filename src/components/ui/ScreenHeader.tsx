import type { ReactNode } from 'react';
import { Search, X } from 'lucide-react';

export interface ScreenHeaderProps {
  title: string;
  /** Optional extra actions to render instead of the default Search icon */
  actions?: ReactNode;
  className?: string;
  isSearchOpen?: boolean;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  onToggleSearch?: () => void;
  searchPlaceholder?: string;
}

/**
 * Consistent mobile screen header with search toggle and clearance for safe-area.
 * Setting icon removed; search icon is fully functional with interactive search bar.
 */
export function ScreenHeader({
  title,
  actions,
  className = '',
  isSearchOpen = false,
  searchQuery = '',
  onSearchChange,
  onToggleSearch,
  searchPlaceholder = 'Cari...',
}: ScreenHeaderProps) {
  return (
    <header
      className={`px-5 pt-[calc(env(safe-area-inset-top,0px)+18px)] pb-2 flex items-center justify-between shrink-0 bg-[#101012] z-20 min-h-[58px] ${className}`}
    >
      {isSearchOpen ? (
        <div className="flex-1 flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-[#1c1c1f] rounded-full px-3.5 py-1.5 focus-within:ring-1 focus-within:ring-[#0061FE] transition-all">
            <Search className="w-4 h-4 text-[#8e8e93] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder={searchPlaceholder}
              autoFocus
              className="bg-transparent text-white text-[13.5px] outline-none w-full placeholder:text-[#8e8e93]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange?.('')}
                className="text-[#8e8e93] hover:text-white p-0.5 active:scale-95 transition-all cursor-pointer"
                aria-label="Hapus teks pencarian"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onToggleSearch}
            className="text-[#0061FE] hover:text-[#0052d9] text-[13.5px] font-medium active:scale-95 transition-all cursor-pointer shrink-0"
          >
            Batal
          </button>
        </div>
      ) : (
        <>
          <h1 className="text-[26px] font-bold text-white tracking-tight leading-none">
            {title}
          </h1>
          <div className="flex items-center gap-3">
            {actions ?? (
              <button
                type="button"
                onClick={onToggleSearch}
                className="text-[#8e8e93] hover:text-white p-1.5 active:scale-95 transition-all cursor-pointer"
                aria-label="Search"
              >
                <Search className="w-5 h-5 stroke-[2]" />
              </button>
            )}
          </div>
        </>
      )}
    </header>
  );
}
