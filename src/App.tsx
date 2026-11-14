import { useState } from 'react';
import { PlaylistScreen } from './components/PlaylistScreen';
import { TracksScreen } from './components/TracksScreen';
import { useMobileDetection } from './hooks/useMobileDetection';
import { Smartphone, ShieldAlert, QrCode } from 'lucide-react';

export default function App() {
  const { isMobileDevice } = useMobileDetection();
  // Default to 'tracks' screen
  const [currentScreen, setCurrentScreen] = useState<'playlists' | 'tracks'>('tracks');

  // Strict Mobile Check: JIKA BUKAN PERANGKAT MOBILE, BLOKIR AKSES
  if (!isMobileDevice) {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(currentUrl)}`;

    return (
      <div className="min-h-screen w-full bg-black text-white flex items-center justify-center p-6 font-['Montserrat',sans-serif] selection:bg-purple-500 selection:text-white">
        <div className="max-w-md w-full bg-[#121214] border border-white/10 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          {/* Subtle glow accent */}
          <div className="absolute -top-20 -left-20 w-44 h-44 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Akses Khusus Mobile</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
            Perangkat Tidak Didukung
          </h1>

          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Website ini hanya dapat diakses melalui <span className="text-white font-medium">perangkat mobile</span> (smartphone atau tablet).
          </p>

          {/* QR Code Container */}
          <div className="bg-[#18181b] border border-white/5 rounded-2xl p-5 mb-6 flex flex-col items-center">
            <div className="w-40 h-40 bg-white p-2.5 rounded-xl shadow-md mb-3 flex items-center justify-center">
              <img
                src={qrApiUrl}
                alt="Scan QR code untuk buka di HP"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <QrCode className="w-24 h-24 text-slate-800 hidden [img:not([style*='display: none'])~&]:hidden block" />
            </div>

            <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-purple-400" />
              Scan QR code dengan kamera HP Anda
            </p>

            <span className="text-[11px] text-slate-500 font-mono mt-1 break-all max-w-[280px]">
              {currentUrl}
            </span>
          </div>

          {/* Tip pengembang */}
          <div className="text-[11px] text-slate-400 bg-black/40 border border-white/5 p-3 rounded-xl leading-relaxed">
            <span className="font-semibold text-slate-300">Tips Pengembang:</span> Buka DevTools (<kbd className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded text-[10px]">F12</kbd> atau <kbd className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded text-[10px]">Ctrl+Shift+M</kbd>) untuk mengaktifkan mode responsive mobile pada browser komputer.
          </div>
        </div>
      </div>
    );
  }

  // JIKA PERANGKAT MOBILE: TAMPILKAN APLIKASI SECARA PENUH TANPA STATUS BAR
  return (
    <main className="fixed inset-0 w-full h-[100dvh] max-h-[100dvh] bg-black text-white overflow-hidden font-['Montserrat',sans-serif]">
      {currentScreen === 'tracks' ? (
        <TracksScreen onSwitchToPlaylists={() => setCurrentScreen('playlists')} />
      ) : (
        <PlaylistScreen onSwitchToTracks={() => setCurrentScreen('tracks')} />
      )}
    </main>
  );
}
