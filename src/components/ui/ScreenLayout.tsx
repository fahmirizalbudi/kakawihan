import type { ReactNode } from 'react';

export interface ScreenLayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * Full-screen fixed container for mobile app screens.
 * Uses 100dvh to fill the mobile viewport cleanly and prevents uncontrolled overflow.
 * Automatically respects left and right safe areas for notched devices.
 */
export function ScreenLayout({ children, className = '' }: ScreenLayoutProps) {
  return (
    <div
      className={`fixed inset-0 w-full h-[100dvh] max-h-[100dvh] bg-[#0c0c0c] text-white flex flex-col select-none overflow-hidden font-['Montserrat',sans-serif] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)] ${className}`}
    >
      {children}
    </div>
  );
}
