import { useState, useEffect } from 'react';
import { MobileOnlyGuard } from './components/MobileOnlyGuard';
import { getSqliteDb } from './lib/sqlite';
import { Smartphone, Database, CheckCircle2, Terminal, Layers } from 'lucide-react';

function SetupDashboard() {
  const [sqliteStatus, setSqliteStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [sqliteVersion, setSqliteVersion] = useState<string>('');
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    getSqliteDb()
      .then((db) => {
        setSqliteStatus('ready');
        const res = db.exec('SELECT sqlite_version() AS version;');
        if (res.length > 0 && res[0].values.length > 0) {
          setSqliteVersion(String(res[0].values[0][0]));
        }
      })
      .catch((err) => {
        console.error(err);
        setSqliteStatus('error');
      });
  }, []);

  const handleTestSqlite = async () => {
    try {
      const db = await getSqliteDb();
      db.exec('CREATE TABLE IF NOT EXISTS test_config (id INTEGER PRIMARY KEY, item TEXT, created_at TEXT);');
      db.run('INSERT INTO test_config (item, created_at) VALUES (?, ?);', [
        `Uji Coba SQLite #${Date.now().toString().slice(-4)}`,
        new Date().toLocaleTimeString(),
      ]);
      const res = db.exec('SELECT * FROM test_config ORDER BY id DESC LIMIT 3;');
      setTestResult(JSON.stringify(res[0]?.values ?? [], null, 2));
    } catch (err) {
      setTestResult(`Error: ${String(err)}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 pb-12 max-w-md mx-auto selection:bg-emerald-500 selection:text-white font-sans">
      {/* Mobile Header Setup */}
      <header className="py-4 border-b border-slate-800/80 mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Kakawihan PWA
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-semibold">
              READY
            </span>
          </div>
          <p className="text-xs text-slate-400">Konfigurasi Mobile PWA & SQLite Selesai</p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400">
          <Smartphone className="w-5 h-5" />
        </div>
      </header>

      {/* Status Checklist Cards */}
      <div className="space-y-3 mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
          Status Konfigurasi
        </h2>

        {/* 1. Mobile-Only Access */}
        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h3 className="font-semibold text-white">Mobile-Only Access Guard</h3>
            <p className="text-slate-400 mt-0.5 leading-relaxed">
              Perangkat desktop diblokir dan diarahkan khusus ke perangkat seluler / mode mobile.
            </p>
          </div>
        </div>

        {/* 2. PWA */}
        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h3 className="font-semibold text-white">PWA & Service Worker</h3>
            <p className="text-slate-400 mt-0.5 leading-relaxed">
              Vite PWA plugin, manifest (icons, tema, standalone), dan workbox cache aktif.
            </p>
          </div>
        </div>

        {/* 3. Tailwind CSS */}
        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h3 className="font-semibold text-white">Tailwind CSS</h3>
            <p className="text-slate-400 mt-0.5 leading-relaxed">
              Tailwind CSS terpasang dan styling responsif mobile telah berfungsi.
            </p>
          </div>
        </div>

        {/* 4. SQLite sql.js */}
        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">SQLite (sql.js WASM)</h3>
              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {sqliteStatus === 'ready' ? `v${sqliteVersion || 'WASM'}` : sqliteStatus}
              </span>
            </div>
            <p className="text-slate-400 mt-0.5 leading-relaxed">
              Engine sql.js WASM siap di browser dengan persistensi IndexedDB otomatis.
            </p>
          </div>
        </div>
      </div>

      {/* Uji Coba SQLite Interaktif */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-white">Uji Eksekusi SQLite</span>
          </div>
          <button
            onClick={handleTestSqlite}
            disabled={sqliteStatus !== 'ready'}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Test Query SQL</span>
          </button>
        </div>

        {testResult ? (
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto">
            <p className="text-slate-400 text-[10px] mb-1">// Hasil data tabel test_config:</p>
            <pre>{testResult}</pre>
          </div>
        ) : (
          <p className="text-xs text-slate-400">
            Klik tombol di atas untuk memastikan sql.js dapat membuat tabel, insert record, dan melakukan select secara langsung.
          </p>
        )}
      </div>

      {/* Footer panduan */}
      <div className="mt-auto pt-4 border-t border-slate-900 text-center text-xs text-slate-500 flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span>Setup dasar selesai. Anda sekarang siap menulis kode aplikasi Anda!</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <MobileOnlyGuard>
      <SetupDashboard />
    </MobileOnlyGuard>
  );
}
