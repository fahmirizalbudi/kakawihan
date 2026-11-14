import type { ReactNode } from 'react';

export interface ActionButtonProps {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
}

/**
 * Reusable rounded icon button used for secondary actions (e.g. Shuffle, Play all, Download, Add).
 */
export function ActionButton({
  icon,
  label,
  onClick,
  className = '',
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-[36px] h-[36px] rounded-full bg-[#1c1c1f] hover:bg-[#25252a] active:scale-90 text-white flex items-center justify-center transition-all cursor-pointer border border-white/[0.04] shadow-sm ${className}`}
      aria-label={label}
    >
      {icon}
    </button>
  );
}
