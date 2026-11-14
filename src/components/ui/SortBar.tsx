import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

/** Inline SVG sort icon (lines + descending arrow) */
function SortIcon() {
  return (
    <svg
      className="w-[15px] h-[15px] text-white"
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <path d="M1 3.5h5a.75.75 0 0 1 0 1.5H1a.75.75 0 0 1 0-1.5zm0 4h3.5a.75.75 0 0 1 0 1.5H1a.75.75 0 0 1 0-1.5zm0 4h2a.75.75 0 0 1 0 1.5H1a.75.75 0 0 1 0-1.5z" />
      <path
        fillRule="evenodd"
        d="M11.22 2.22a.75.75 0 0 1 1.06 0l2.5 2.5a.75.75 0 1 1-1.06 1.06L12.5 4.56v9.19a.75.75 0 0 1-1.5 0V4.56L9.78 5.78a.75.75 0 0 1-1.06-1.06l2.5-2.5z"
      />
    </svg>
  );
}

export interface SortBarProps {
  /** Sort label (e.g. "Name") */
  label?: string;
  /** Content to render on the right side (e.g. ActionButtons or Add button) */
  rightContent?: ReactNode;
  /** Extra className for spacing overrides */
  className?: string;
  onSortClick?: () => void;
}

/**
 * Reusable sort/filter bar with sort icon + label on the left and action buttons on the right.
 */
export function SortBar({
  label = 'Name',
  rightContent,
  className = '',
  onSortClick,
}: SortBarProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <button
        type="button"
        onClick={onSortClick}
        className="flex items-center gap-1.5 text-white active:opacity-80 transition-opacity cursor-pointer"
      >
        <SortIcon />
        <span className="font-semibold text-[14.5px] tracking-tight">{label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-[#8e8e93] ml-0.5 stroke-[2.5]" />
      </button>

      {rightContent && (
        <div className="flex items-center">
          {rightContent}
        </div>
      )}
    </div>
  );
}
