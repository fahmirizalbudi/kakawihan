import { PlaylistScreen } from './components/PlaylistScreen';
import { useMobileDetection } from './hooks/useMobileDetection';

export default function App() {
  const { isMobileDevice } = useMobileDetection();

  // On true mobile devices or mobile viewport (<= 768px), fill screen directly
  if (isMobileDevice) {
    return (
      <main className="w-full h-screen bg-black overflow-hidden font-['Montserrat',sans-serif]">
        <PlaylistScreen />
      </main>
    );
  }

  // On desktop / wide displays, replicate the exact presentation from the reference image
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#1a76f2] via-[#5054f7] to-[#cd41f3] flex flex-col items-center justify-start p-6 sm:p-10 font-['Montserrat',sans-serif] selection:bg-purple-500 selection:text-white">
      {/* Top Banner Title as in reference image */}
      <h1 className="text-3xl sm:text-[44px] font-bold text-white tracking-tight mb-8 drop-shadow-md text-center">
        Manage Your Playlists
      </h1>

      {/* Realistic iPhone Mockup Frame */}
      <div className="w-[390px] h-[844px] bg-[#0c0c0e] rounded-[52px] p-3 shadow-[0_30px_90px_rgba(0,0,0,0.65)] border-[5px] border-[#2c2c30] ring-1 ring-white/20 relative flex flex-col overflow-hidden shrink-0">
        {/* Screen Bezel Inside */}
        <div className="w-full h-full bg-black rounded-[42px] overflow-hidden flex flex-col relative shadow-inner">
          <PlaylistScreen />
        </div>
      </div>
    </div>
  );
}
