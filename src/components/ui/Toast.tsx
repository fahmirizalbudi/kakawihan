import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'error';
  onClose?: () => void;
  className?: string;
}

/**
 * Modern floating pill toast notification.
 * Sleek, flat, backdrop-blurred, and non-intrusive.
 */
export function Toast({
  message,
  type = 'success',
  onClose,
  className = '',
}: ToastProps) {
  return (
    <div
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] pointer-events-none animate-in slide-in-from-top-3 fade-in duration-200 ${className}`}
    >
      <div className="pointer-events-auto flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#1c1c1f]/95 backdrop-blur-md text-white shadow-[0_8px_24px_rgba(0,0,0,0.6)] text-[13px] font-medium select-none">
        {type === 'success' && (
          <CheckCircle2 className="w-4 h-4 text-[#0061FE] shrink-0 stroke-[2.2]" />
        )}
        {type === 'error' && (
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 stroke-[2.2]" />
        )}
        {type === 'info' && (
          <Info className="w-4 h-4 text-[#8e8e93] shrink-0 stroke-[2.2]" />
        )}

        <span className="truncate">{message}</span>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 -mr-1 text-[#8e8e93] hover:text-white active:scale-90 transition-transform cursor-pointer"
            aria-label="Close notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
