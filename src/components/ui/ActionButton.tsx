import type { ReactNode } from 'react';

export interface ActionButtonProps {
  icon: ReactNode;
  label: string;
  showLabel?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Unified compact flat button used across screens.
 * Consistent rounded-full pill styling, not oversized.
 */
export function ActionButton({
  icon,
  label,
  showLabel = false,
  onClick,
  className = '',
}: ActionButtonProps) {
  if (showLabel) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`h-8 px-3 rounded-full bg-[#1c1c1e] hover:bg-[#252528] active:scale-95 text-white font-medium text-[12.5px] inline-flex items-center gap-1.5 transition-all cursor-pointer ${className}`}
        aria-label={label}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-8 h-8 rounded-full bg-[#1c1c1e] hover:bg-[#252528] active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer ${className}`}
      aria-label={label}
    >
      {icon}
    </button>
  );
}
