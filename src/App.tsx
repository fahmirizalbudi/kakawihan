import { useState } from 'react';
import { PlaylistScreen } from './components/PlaylistScreen';
import { TracksScreen } from './components/TracksScreen';
import { useMobileDetection } from './hooks/useMobileDetection';

export default function App() {
  const { isMobileDevice } = useMobileDetection();
  // Default to 'tracks' as requested by the user
  const [currentScreen, setCurrentScreen] = useState<'playlists' | 'tracks'>('tracks');

  // Mobile viewport: Direct full-screen native mobile experience
  if (isMobileDevice) {
    return (
      <main className="w-full h-screen bg-black overflow-hidden font-['Montserrat',sans-serif]">
        {currentScreen === 'tracks' ? (
          <TracksScreen onSwitchToPlaylists={() => setCurrentScreen('playlists')} />
        ) : (
          <PlaylistScreen onSwitchToTracks={() => setCurrentScreen('tracks')} />
        )}
      </main>
    );
  }

  // Desktop / Wide displays: Replicate the exact presentation from the reference image
  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-start p-6 sm:p-10 font-['Montserrat',sans-serif] selection:bg-purple-500 selection:text-white transition-colors duration-500 ${
        currentScreen === 'tracks'
          ? 'bg-gradient-to-br from-[#963af0] via-[#5b4df2] to-[#207bf5]'
          : 'bg-gradient-to-br from-[#1a76f2] via-[#5054f7] to-[#cd41f3]'
      }`}
    >
      {/* Top Controls / Switcher Pill */}
      <div className="mb-4 flex items-center gap-2 bg-black/25 backdrop-blur-md p-1.5 rounded-full border border-white/15 shadow-lg">
        <button
          type="button"
          onClick={() => setCurrentScreen('playlists')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            currentScreen === 'playlists'
              ? 'bg-white text-black shadow-md'
              : 'text-white/80 hover:text-white'
          }`}
        >
          Screen: Playlists
        </button>
        <button
          type="button"
          onClick={() => setCurrentScreen('tracks')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            currentScreen === 'tracks'
              ? 'bg-white text-black shadow-md'
              : 'text-white/80 hover:text-white'
          }`}
        >
          Screen: Tracks
        </button>
      </div>

      {/* Top Banner Title as in reference image */}
      {currentScreen === 'tracks' ? (
        <div className="text-center mb-8 drop-shadow-md">
          <h1 className="text-3xl sm:text-[46px] font-bold text-white tracking-tight leading-tight">
            All Your Songs.
          </h1>
          <h1 className="text-3xl sm:text-[46px] font-bold text-white tracking-tight leading-tight">
            Anywhere.
          </h1>
        </div>
      ) : (
        <h1 className="text-3xl sm:text-[44px] font-bold text-white tracking-tight mb-8 drop-shadow-md text-center">
          Manage Your Playlists
        </h1>
      )}

      {/* Realistic iPhone Mockup Frame */}
      <div className="w-[390px] h-[844px] bg-[#0c0c0e] rounded-[52px] p-3 shadow-[0_30px_90px_rgba(0,0,0,0.65)] border-[5px] border-[#2c2c30] ring-1 ring-white/20 relative flex flex-col overflow-hidden shrink-0">
        {/* Screen Bezel Inside */}
        <div className="w-full h-full bg-black rounded-[42px] overflow-hidden flex flex-col relative shadow-inner">
          {currentScreen === 'tracks' ? (
            <TracksScreen onSwitchToPlaylists={() => setCurrentScreen('playlists')} />
          ) : (
            <PlaylistScreen onSwitchToTracks={() => setCurrentScreen('tracks')} />
          )}
        </div>
      </div>
    </div>
  );
}
