import { useState, useEffect, type ReactNode } from 'react';
import { Smartphone, ShieldAlert, Sparkles } from 'lucide-react';

interface MobileOnlyGuardProps {
  children: ReactNode;
}

export function MobileOnlyGuard({ children }: MobileOnlyGuardProps) {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const ua = navigator.userAgent;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua);
    const isSmallScreen = window.innerWidth <= 768;
    return isMobileUA || isSmallScreen;
  });

  const [devSimulate, setDevSimulate] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const ua = navigator.userAgent;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua);
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isMobileUA || isSmallScreen);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Jika perangkat mobile, render aplikasi secara langsung
  if (isMobile) {
    return <>{children}</>;
  }

  // Jika pengembang mengaktifkan mode simulasi layar HP di desktop
  if (devSimulate) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-[400px] mb-3 flex items-center justify-between px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <Smartphone className="w-4 h-4" />
            <span>Mode Simulasi Mobile (390 x 844 px)</span>
          </div>
          <button
            onClick={() => setDevSimulate(false)}
            className="text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded bg-rose-500/10 cursor-pointer"
          >
            Tutup
          </button>
        </div>

        {/* Frame Mockup Smartphone */}
        <div className="w-[390px] h-[844px] bg-black rounded-[48px] p-3 shadow-2xl border-4 border-slate-700 relative overflow-hidden flex flex-col">
          <div className="w-full h-full bg-slate-950 rounded-[38px] overflow-hidden flex flex-col">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Tampilan blokir perangkat desktop
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3 border border-amber-500/20">
          Akses Khusus Mobile
        </span>

        <h1 className="text-2xl font-bold text-white mb-2">
          Halaman Hanya untuk Perangkat Mobile
        </h1>

        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          Aplikasi PWA ini dikonfigurasi khusus untuk dibuka melalui perangkat handphone / smartphone atau browser dengan viewport mobile.
        </p>

        <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl text-left text-xs text-slate-400 space-y-2 mb-6 font-mono">
          <div><strong className="text-slate-300">Resolusi Layar:</strong> {typeof window !== 'undefined' ? `${window.innerWidth} x ${window.innerHeight}` : ''}</div>
          <div><strong className="text-slate-300">Status:</strong> Non-mobile device terdeteksi</div>
          <div><strong className="text-slate-300">Solusi:</strong> Buka melalui browser HP atau gunakan inspect element / DevTools responsive mode (Ctrl+Shift+M).</div>
        </div>

        <button
          onClick={() => setDevSimulate(true)}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/50"
        >
          <Sparkles className="w-4 h-4" />
          <span>Buka Preview Simulasi Mobile</span>
        </button>
      </div>
    </div>
  );
}
