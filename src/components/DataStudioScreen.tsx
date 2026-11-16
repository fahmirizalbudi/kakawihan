import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  Database,
  Table,
  Terminal,
  Network,
  RotateCw,
  Play,
  Search,
  Key,
  Link2,
  AlertCircle,
  CheckCircle2,
  ListMusic,
  X,
} from 'lucide-react';
import { getSqliteDb, saveDbToIdb } from '../lib/sqlite';

type StudioTab = 'explorer' | 'query' | 'er';

interface ColumnMeta {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: unknown;
  pk: number;
}

interface ForeignKeyMeta {
  id: number;
  seq: number;
  table: string;
  from: string;
  to: string;
}

interface TableSummary {
  name: string;
  count: number;
  columns: ColumnMeta[];
  foreignKeys: ForeignKeyMeta[];
}

export function DataStudioScreen({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<StudioTab>('explorer');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tables, setTables] = useState<TableSummary[]>([]);
  const [selectedTableName, setSelectedTableName] = useState<string>('tracks');
  const [tableData, setTableData] = useState<{ columns: string[]; rows: (string | number | null)[][] }>({
    columns: [],
    rows: [],
  });
  const [filterText, setFilterText] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // SQL Console state
  const [sqlQuery, setSqlQuery] = useState<string>(
    'SELECT id, title, artist, duration, is_favorite, created_at FROM tracks ORDER BY id DESC LIMIT 20;'
  );
  const [queryResult, setQueryResult] = useState<{
    columns: string[];
    rows: (string | number | null)[][];
    executionTimeMs: number;
    rowsAffected?: number;
  } | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Load all table schemas and counts
  const loadDatabaseStructure = useCallback(async () => {
    setIsLoading(true);
    try {
      const db = await getSqliteDb();

      // Query all user tables
      const tablesResult = db.exec(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC;"
      );

      const tableNames: string[] = tablesResult.length > 0 ? tablesResult[0].values.map((v) => String(v[0])) : [];

      const summaries: TableSummary[] = [];
      for (const name of tableNames) {
        let count = 0;
        try {
          const countRes = db.exec(`SELECT count(*) AS total FROM "${name}";`);
          if (countRes.length > 0 && countRes[0].values.length > 0) {
            count = Number(countRes[0].values[0][0]) || 0;
          }
        } catch {
          count = 0;
        }

        let columns: ColumnMeta[] = [];
        try {
          const colRes = db.exec(`PRAGMA table_info("${name}");`);
          if (colRes.length > 0) {
            const cols = colRes[0].columns;
            columns = colRes[0].values.map((row) => {
              const obj: Record<string, unknown> = {};
              cols.forEach((c, idx) => {
                obj[c] = row[idx];
              });
              return obj as unknown as ColumnMeta;
            });
          }
        } catch {
          columns = [];
        }

        let foreignKeys: ForeignKeyMeta[] = [];
        try {
          const fkRes = db.exec(`PRAGMA foreign_key_list("${name}");`);
          if (fkRes.length > 0) {
            const cols = fkRes[0].columns;
            foreignKeys = fkRes[0].values.map((row) => {
              const obj: Record<string, unknown> = {};
              cols.forEach((c, idx) => {
                obj[c] = row[idx];
              });
              return obj as unknown as ForeignKeyMeta;
            });
          }
        } catch {
          foreignKeys = [];
        }

        summaries.push({
          name,
          count,
          columns,
          foreignKeys,
        });
      }

      setTables(summaries);
      return summaries;
    } catch (err) {
      console.error('Gagal membaca struktur database:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load rows for a specific table
  const loadTableRows = useCallback(async (tableName: string) => {
    try {
      const db = await getSqliteDb();
      const res = db.exec(`SELECT * FROM "${tableName}" LIMIT 500;`);
      if (res.length > 0) {
        setTableData({
          columns: res[0].columns,
          rows: res[0].values as (string | number | null)[][],
        });
      } else {
        const pragmaRes = db.exec(`PRAGMA table_info("${tableName}");`);
        const cols = pragmaRes.length > 0 ? pragmaRes[0].values.map((row) => String(row[1])) : [];
        setTableData({
          columns: cols,
          rows: [],
        });
      }
      setCurrentPage(1);
    } catch (err) {
      console.error(`Gagal membaca data dari tabel ${tableName}:`, err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    async function init() {
      const summaries = await loadDatabaseStructure();
      if (!isMounted) return;
      if (summaries.length > 0) {
        const initialTable = summaries.find((s) => s.name === 'tracks') ? 'tracks' : summaries[0].name;
        setSelectedTableName(initialTable);
        await loadTableRows(initialTable);
      }
    }
    void init();
    return () => {
      isMounted = false;
    };
  }, [loadDatabaseStructure, loadTableRows]);

  // Handle table chip selection
  const handleSelectTable = async (name: string) => {
    setSelectedTableName(name);
    setFilterText('');
    await loadTableRows(name);
  };

  // Execute custom SQL query
  const handleExecuteQuery = async () => {
    if (!sqlQuery.trim()) return;
    setIsExecuting(true);
    setQueryError(null);
    setSuccessNotice(null);

    const startTime = performance.now();
    try {
      const db = await getSqliteDb();
      const trimmed = sqlQuery.trim();
      const isMutation = /^(insert|update|delete|create|drop|alter|replace)\b/i.test(trimmed);

      const execResults = db.exec(trimmed);
      const executionTimeMs = Math.round((performance.now() - startTime) * 10) / 10;

      if (isMutation) {
        await saveDbToIdb();
        await loadDatabaseStructure();
        if (selectedTableName) {
          await loadTableRows(selectedTableName);
        }
        setSuccessNotice('Query Mutasi Berhasil Dieksekusi Dan Disimpan Ke IndexedDB.');
      }

      if (execResults.length > 0) {
        setQueryResult({
          columns: execResults[0].columns,
          rows: execResults[0].values as (string | number | null)[][],
          executionTimeMs,
        });
      } else {
        setQueryResult({
          columns: ['Status'],
          rows: [['Query Berhasil Dieksekusi']],
          executionTimeMs,
        });
      }
    } catch (err) {
      setQueryError(err instanceof Error ? err.message : String(err));
      setQueryResult(null);
    } finally {
      setIsExecuting(false);
    }
  };

  // Filter rows in Explorer
  const filteredRows = useMemo(() => {
    if (!filterText.trim()) return tableData.rows;
    const lower = filterText.toLowerCase();
    return tableData.rows.filter((row) =>
      row.some((val) => val !== null && String(val).toLowerCase().includes(lower))
    );
  }, [tableData.rows, filterText]);

  // Paginated rows
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const totalRowsCount = useMemo(() => tables.reduce((acc, t) => acc + t.count, 0), [tables]);

  // Preset SQL queries (Capitalized labels)
  const presets = [
    {
      label: 'Semua Lagu',
      sql: 'SELECT id, title, artist, duration, is_favorite, created_at FROM tracks ORDER BY id DESC LIMIT 20;',
    },
    {
      label: 'Semua Playlist',
      sql: 'SELECT id, title, description, created_at FROM playlists ORDER BY id DESC;',
    },
    {
      label: 'Relasi Playlist & Lagu',
      sql: 'SELECT pt.id, p.title AS playlist_name, t.title AS track_title, pt.position FROM playlist_tracks pt JOIN playlists p ON pt.playlist_id = p.id JOIN tracks t ON pt.track_id = t.id ORDER BY pt.id ASC;',
    },
    {
      label: 'Riwayat Diputar',
      sql: 'SELECT rp.track_id, t.title, t.artist, rp.played_at FROM recently_played rp JOIN tracks t ON rp.track_id = t.id ORDER BY rp.played_at DESC;',
    },
    {
      label: 'Hitung Total Koleksi',
      sql: 'SELECT count(*) AS total_lagu, round(sum(duration), 1) AS total_detik, round(sum(file_size) / 1048576.0, 2) AS total_mb FROM tracks;',
    },
  ];

  return (
    <div className="fixed inset-0 w-full h-[100dvh] max-h-[100dvh] bg-[#101012] text-white flex flex-col overflow-hidden font-sans select-text pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)]">
      {/* Top Header — Identik dengan PlaylistScreen Detail Header */}
      <header className="px-5 pt-[calc(env(safe-area-inset-top,0px)+18px)] pb-3 flex items-center justify-between shrink-0 bg-[#101012] z-20 border-b border-white/5">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 -ml-1.5 text-white hover:text-white/80 active:scale-90 transition-all cursor-pointer flex items-center gap-1"
          aria-label="Kembali"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
        </button>

        <h1 className="text-white font-semibold text-[17px] tracking-tight">Data Studio</h1>

        <button
          type="button"
          onClick={async () => {
            const sums = await loadDatabaseStructure();
            if (sums.length > 0 && selectedTableName) {
              await loadTableRows(selectedTableName);
            }
          }}
          disabled={isLoading}
          className="p-1.5 -mr-1.5 text-white hover:text-white/80 active:scale-90 transition-all cursor-pointer disabled:opacity-40"
          aria-label="Refresh Data"
          title="Refresh Data"
        >
          <RotateCw className={`w-5 h-5 stroke-[2] ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* Main Scrollable Content */}
      <main className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 pb-6 overscroll-contain scrollbar-none flex flex-col w-full">
        {/* Center Hero: Artwork, Title, Count, Metadata, Action Tabs (Sesuai PlaylistScreen) */}
        <div className="flex flex-col items-center pt-2 pb-5 shrink-0">
          {/* Artwork Card */}
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-[22px] overflow-hidden shadow-2xl bg-[#1c1c1f] flex items-center justify-center relative border border-white/5">
            <Database className="w-12 h-12 stroke-[1.5] text-[#0061FE]" />
          </div>

          {/* Title */}
          <h2 className="text-white font-bold text-[20px] tracking-tight text-center mt-3 mb-0.5 px-4 truncate max-w-full">
            Data Studio
          </h2>

          {/* Subtitle Counts */}
          <p className="text-[#8e8e93] text-[13px] text-center font-normal">
            {totalRowsCount} Baris Tersimpan • {tables.length} Tabel SQLite
          </p>

          {/* Description */}
          <p className="text-[#8e8e93]/75 text-[12px] text-center mt-0.5">
            Database Relasional SQLite WebAssembly • Persistensi IndexedDB
          </p>

          {/* Mode Tabs Buttons — Sesuai Button Play / Shuffle PlaylistScreen */}
          <div className="flex items-center justify-center gap-2.5 mt-4 w-full max-w-[380px]">
            <button
              type="button"
              onClick={() => setActiveTab('explorer')}
              className={`flex-1 h-10 rounded-full font-medium text-[13px] inline-flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer ${
                activeTab === 'explorer'
                  ? 'bg-white hover:bg-neutral-200 text-black font-semibold shadow-sm'
                  : 'bg-[#1c1c1f] hover:bg-[#252528] text-white border border-white/10'
              }`}
            >
              <Table className="w-4 h-4" />
              <span>Tabel Data</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('query')}
              className={`flex-1 h-10 rounded-full font-medium text-[13px] inline-flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer ${
                activeTab === 'query'
                  ? 'bg-white hover:bg-neutral-200 text-black font-semibold shadow-sm'
                  : 'bg-[#1c1c1f] hover:bg-[#252528] text-white border border-white/10'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>SQL Konsol</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('er')}
              className={`flex-1 h-10 rounded-full font-medium text-[13px] inline-flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer ${
                activeTab === 'er'
                  ? 'bg-white hover:bg-neutral-200 text-black font-semibold shadow-sm'
                  : 'bg-[#1c1c1f] hover:bg-[#252528] text-white border border-white/10'
              }`}
            >
              <Network className="w-4 h-4" />
              <span>Skema & ERD</span>
            </button>
          </div>
        </div>

        {/* Dynamic Tab Body */}
        {isLoading && tables.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[#8e8e93] text-sm py-16">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mb-3" />
            <span>Memuat Database...</span>
          </div>
        ) : (
          <div className="flex-1 w-full flex flex-col">
            {/* ══════════ TAB 1: TABEL DATA (DATA EXPLORER) ══════════ */}
            {activeTab === 'explorer' && (
              <div className="w-full flex-1 flex flex-col gap-3">
                {/* Section Header: Title & Table Chips */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div>
                    <h3 className="text-[17px] font-bold text-white tracking-tight">
                      Daftar Tabel
                    </h3>
                    <p className="text-[#8e8e93] text-[12px]">
                      Pilih Tabel Untuk Menjelajahi Baris Data
                    </p>
                  </div>

                  {/* Search Bar Full/Responsive */}
                  <div className="w-full sm:w-72 flex items-center gap-2 bg-[#1c1c1f] rounded-full px-3.5 py-1.5 focus-within:ring-1 focus-within:ring-[#0061FE] transition-all border border-white/5">
                    <Search className="w-4 h-4 text-[#8e8e93] shrink-0" />
                    <input
                      type="text"
                      value={filterText}
                      onChange={(e) => {
                        setFilterText(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder={`Cari Di Tabel ${selectedTableName}...`}
                      className="bg-transparent text-white text-[12.5px] outline-none w-full placeholder:text-[#8e8e93]"
                    />
                    {filterText && (
                      <button
                        type="button"
                        onClick={() => setFilterText('')}
                        className="text-[#8e8e93] hover:text-white p-0.5 active:scale-95 transition-all cursor-pointer"
                        aria-label="Hapus Pencarian"
                      >
                        <X className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Table selector chips */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                  {tables.map((t) => {
                    const isSelected = selectedTableName === t.name;
                    return (
                      <button
                        key={t.name}
                        type="button"
                        onClick={() => handleSelectTable(t.name)}
                        className={`h-8 px-3.5 rounded-full text-[12.5px] font-medium inline-flex items-center gap-2 transition-all cursor-pointer shrink-0 active:scale-95 ${
                          isSelected
                            ? 'bg-[#0061FE] text-white shadow-xs'
                            : 'bg-[#1c1c1e] text-[#8e8e93] hover:text-white hover:bg-[#252528]'
                        }`}
                      >
                        <span className="capitalize">{t.name}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                            isSelected
                              ? 'bg-white/20 text-white font-semibold'
                              : 'bg-white/5 text-[#8e8e93]'
                          }`}
                        >
                          {t.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Full-Width Data Table Container */}
                <div className="w-full flex-1 min-h-[360px] flex flex-col bg-[#17171a] rounded-[20px] border border-white/5 overflow-hidden shadow-xl mt-1">
                  <div className="overflow-x-auto overflow-y-auto flex-1 scrollbar-thin">
                    <table className="w-full min-w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#1c1c1f] border-b border-white/5 text-[#8e8e93] sticky top-0 z-10">
                          {tableData.columns.map((col) => (
                            <th
                              key={col}
                              className="px-4 py-3 font-semibold tracking-tight text-[12px] whitespace-nowrap capitalize"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {paginatedRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={Math.max(1, tableData.columns.length)}
                              className="px-4 py-16 text-center text-[#8e8e93] text-[13px]"
                            >
                              <ListMusic className="w-8 h-8 text-[#3a3a3e] mx-auto mb-2 stroke-[1.5]" />
                              <span>Tidak Ada Data Ditemukan Di Tabel &quot;{selectedTableName}&quot;</span>
                            </td>
                          </tr>
                        ) : (
                          paginatedRows.map((row, rIdx) => (
                            <tr
                              key={rIdx}
                              className="hover:bg-white/[0.03] transition-colors"
                            >
                              {row.map((cell, cIdx) => {
                                const valStr = cell === null ? 'NULL' : String(cell);
                                const isNull = cell === null;
                                const isBlob = valStr.length > 50 && valStr.startsWith('blob_');

                                return (
                                  <td
                                    key={cIdx}
                                    className="px-4 py-3 text-[12.5px] text-white whitespace-nowrap font-mono max-w-[280px] truncate"
                                    title={valStr}
                                  >
                                    {isNull ? (
                                      <span className="text-[#8e8e93]/50 italic">Null</span>
                                    ) : isBlob ? (
                                      <span className="px-2 py-0.5 rounded bg-white/5 text-[#8e8e93] text-[10.5px]">
                                        {valStr.slice(0, 18)}...
                                      </span>
                                    ) : (
                                      valStr
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer with Pagination */}
                  <div className="px-5 py-3 bg-[#141416] border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#8e8e93]">
                    <span>
                      Menampilkan {paginatedRows.length} Dari {filteredRows.length} Baris Data
                    </span>

                    {totalPages > 1 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="h-8 px-3 rounded-full bg-[#1c1c1e] hover:bg-[#252528] active:scale-95 text-white text-[12px] font-medium disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-all"
                        >
                          Sebelumnya
                        </button>
                        <span className="px-2.5 text-[12px] font-medium text-white">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="h-8 px-3 rounded-full bg-[#1c1c1e] hover:bg-[#252528] active:scale-95 text-white text-[12px] font-medium disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-all"
                        >
                          Berikutnya
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ══════════ TAB 2: SQL KONSOL (QUERY RUNNER) ══════════ */}
            {activeTab === 'query' && (
              <div className="w-full flex-1 flex flex-col gap-3">
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <h3 className="text-[17px] font-bold text-white tracking-tight">
                      SQL Konsol Interaktif
                    </h3>
                    <p className="text-[#8e8e93] text-[12px]">
                      Jalankan Query Kustom Pada Database SQLite
                    </p>
                  </div>
                </div>

                {/* Preset Chips */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                  <span className="text-[#8e8e93] text-[12px] shrink-0 font-medium mr-1">
                    Contoh Query:
                  </span>
                  {presets.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSqlQuery(p.sql)}
                      className="h-8 px-3.5 rounded-full bg-[#1c1c1e] hover:bg-[#252528] active:scale-95 text-[#8e8e93] hover:text-white text-[12px] font-medium transition-all cursor-pointer shrink-0"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* SQL Editor Area */}
                <div className="w-full flex flex-col bg-[#17171a] rounded-[20px] border border-white/5 overflow-hidden shadow-xl p-4 gap-3">
                  <textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    placeholder="Tulis Perintah SQL Di Sini... (Contoh: SELECT * FROM tracks;)"
                    rows={4}
                    className="w-full bg-[#121214] border border-white/10 rounded-xl p-3.5 font-mono text-[13px] text-white placeholder:text-[#8e8e93] outline-none focus:border-[#0061FE] transition-colors resize-y leading-relaxed"
                  />

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <span className="text-[#8e8e93] text-[11.5px]">
                      Perubahan INSERT, UPDATE, DELETE Otomatis Disimpan Ke IndexedDB
                    </span>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setSqlQuery('');
                          setQueryResult(null);
                          setQueryError(null);
                          setSuccessNotice(null);
                        }}
                        className="h-8 px-3.5 rounded-full bg-[#1c1c1e] hover:bg-[#252528] active:scale-95 text-[#8e8e93] hover:text-white text-[12.5px] font-medium transition-all cursor-pointer"
                      >
                        Bersihkan
                      </button>

                      <button
                        type="button"
                        onClick={handleExecuteQuery}
                        disabled={isExecuting || !sqlQuery.trim()}
                        className="h-8 px-4 rounded-full bg-[#0061FE] hover:bg-[#0052d9] active:scale-95 text-white text-[12.5px] font-medium inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Jalankan SQL</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Alerts */}
                {queryError && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-0.5">Kesalahan Sintaks SQL:</p>
                      <p className="font-mono text-[12px]">{queryError}</p>
                    </div>
                  </div>
                )}

                {successNotice && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{successNotice}</span>
                  </div>
                )}

                {/* Full-Width Result Table */}
                {queryResult && (
                  <div className="w-full flex-1 flex flex-col bg-[#17171a] rounded-[20px] border border-white/5 overflow-hidden shadow-xl">
                    <div className="px-5 py-3 bg-[#141416] border-b border-white/5 flex items-center justify-between text-xs text-[#8e8e93]">
                      <span className="font-semibold text-white text-[13px]">Hasil Query</span>
                      <span>
                        {queryResult.rows.length} Baris Dieksekusi Dalam {queryResult.executionTimeMs} ms
                      </span>
                    </div>

                    <div className="overflow-x-auto flex-1 max-h-[380px] scrollbar-thin">
                      <table className="w-full min-w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#1c1c1f] border-b border-white/5 text-[#8e8e93] sticky top-0 z-10">
                            {queryResult.columns.map((col) => (
                              <th
                                key={col}
                                className="px-4 py-2.5 font-semibold tracking-tight text-[12px] whitespace-nowrap capitalize"
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {queryResult.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-white/[0.03] transition-colors">
                              {row.map((cell, cIdx) => (
                                <td
                                  key={cIdx}
                                  className="px-4 py-2.5 text-[12.5px] text-white whitespace-nowrap font-mono max-w-[300px] truncate"
                                  title={String(cell)}
                                >
                                  {cell === null ? (
                                    <span className="text-[#8e8e93]/50 italic">Null</span>
                                  ) : (
                                    String(cell)
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══════════ TAB 3: SKEMA & ERD ══════════ */}
            {activeTab === 'er' && (
              <div className="w-full flex-1 flex flex-col gap-4">
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <h3 className="text-[17px] font-bold text-white tracking-tight">
                      Arsitektur Database & Relasi Entitas (ERD)
                    </h3>
                    <p className="text-[#8e8e93] text-[12px]">
                      Struktur Tabel & Relasi Foreign Key Pada SQLite WebAssembly
                    </p>
                  </div>
                </div>

                {/* Relational Flow Diagram Card */}
                <div className="w-full p-4 sm:p-5 rounded-[20px] bg-[#17171a] border border-white/5 flex flex-col gap-3 shadow-xl">
                  <span className="text-[#8e8e93] text-[12.5px] font-medium tracking-tight">
                    Diagram Relasi Antar Tabel (Entity Relationship)
                  </span>

                  <div className="flex flex-wrap items-center justify-center gap-3 py-4 px-3 bg-[#121214] rounded-2xl border border-white/5 text-xs font-mono">
                    <div className="px-4 py-2.5 rounded-xl bg-[#1c1c1e] border border-white/10 text-center">
                      <div className="text-white font-semibold text-[13px]">Playlists</div>
                      <div className="text-[10px] text-[#8e8e93]">1 Entitas</div>
                    </div>

                    <div className="text-[#8e8e93] flex items-center gap-1">
                      <span>1</span>
                      <span className="text-[#0061FE]">───────</span>
                      <span>N</span>
                    </div>

                    <div className="px-4 py-2.5 rounded-xl bg-[#0061FE]/15 border border-[#0061FE]/40 text-center">
                      <div className="text-[#0061FE] font-semibold text-[13px]">Playlist_Tracks</div>
                      <div className="text-[10px] text-[#8e8e93]">Tabel Junction (M:N)</div>
                    </div>

                    <div className="text-[#8e8e93] flex items-center gap-1">
                      <span>N</span>
                      <span className="text-[#0061FE]">───────</span>
                      <span>1</span>
                    </div>

                    <div className="px-4 py-2.5 rounded-xl bg-[#1c1c1e] border border-white/10 text-center">
                      <div className="text-white font-semibold text-[13px]">Tracks</div>
                      <div className="text-[10px] text-[#8e8e93]">1 Entitas</div>
                    </div>

                    <div className="text-[#8e8e93] flex items-center gap-1">
                      <span>1</span>
                      <span className="text-[#0061FE]">───</span>
                      <span>1</span>
                    </div>

                    <div className="px-4 py-2.5 rounded-xl bg-[#1c1c1e] border border-white/10 text-center">
                      <div className="text-white font-semibold text-[13px]">Recently_Played</div>
                      <div className="text-[10px] text-[#8e8e93]">Riwayat Putar</div>
                    </div>
                  </div>
                </div>

                {/* Table Schema Cards Grid */}
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tables.map((table) => (
                    <div
                      key={table.name}
                      className="rounded-[20px] bg-[#17171a] border border-white/5 p-4 sm:p-5 flex flex-col gap-3 shadow-xl"
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-[#0061FE]" />
                          <h4 className="font-semibold text-white text-[14px] capitalize">
                            {table.name}
                          </h4>
                        </div>
                        <span className="text-[#8e8e93] text-xs font-mono">
                          {table.count} Baris
                        </span>
                      </div>

                      <div className="flex flex-col divide-y divide-white/5">
                        {table.columns.map((col) => {
                          const isPk = col.pk === 1;
                          const fk = table.foreignKeys.find((f) => f.from === col.name);

                          return (
                            <div
                              key={col.cid}
                              className="py-2 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-1.5">
                                {isPk && (
                                  <span title="Primary Key">
                                    <Key className="w-3.5 h-3.5 text-[#0061FE] shrink-0" />
                                  </span>
                                )}
                                {fk && (
                                  <span title="Foreign Key">
                                    <Link2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  </span>
                                )}
                                <span className={isPk ? 'font-semibold text-white' : 'text-[#e4e4e7]'}>
                                  {col.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10.5px] text-[#8e8e93]">
                                  {col.type || 'ANY'}
                                </span>
                                {isPk && (
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-[#0061FE]/20 text-[#0061FE] font-medium">
                                    Primary Key
                                  </span>
                                )}
                                {fk && (
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-medium">
                                    FK → {fk.table}
                                  </span>
                                )}
                                {col.notnull === 1 && !isPk && (
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-[#8e8e93]">
                                    Not Null
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
