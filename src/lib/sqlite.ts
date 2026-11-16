import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';

const DB_STORE_KEY = 'sqlite_db_data';
const IDB_NAME = 'kakawihan_app_db';
const IDB_VERSION = 2;
const IDB_STORE = 'sqlite_store';
const IDB_AUDIO_STORE = 'audio_blobs';

let dbInstance: Database | null = null;
let initPromise: Promise<Database> | null = null;

// IndexedDB Helper untuk persistensi binary SQLite dan audio blobs
function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
      if (!db.objectStoreNames.contains(IDB_AUDIO_STORE)) {
        db.createObjectStore(IDB_AUDIO_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadDbFromIdb(): Promise<Uint8Array | null> {
  try {
    const idb = await openIdb();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(DB_STORE_KEY);
      req.onsuccess = () => resolve((req.result as Uint8Array) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Gagal membaca SQLite dari IndexedDB:', err);
    return null;
  }
}

export async function saveDbToIdb(): Promise<void> {
  if (!dbInstance) return;
  try {
    const idb = await openIdb();
    const binary = dbInstance.export();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.put(binary, DB_STORE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Gagal menyimpan SQLite ke IndexedDB:', err);
  }
}

// Audio Blob Persistence
export async function saveAudioBlob(key: string, blob: Blob): Promise<void> {
  const idb = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_AUDIO_STORE, 'readwrite');
    const store = tx.objectStore(IDB_AUDIO_STORE);
    const req = store.put(blob, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAudioBlob(key: string): Promise<Blob | null> {
  try {
    const idb = await openIdb();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(IDB_AUDIO_STORE, 'readonly');
      const store = tx.objectStore(IDB_AUDIO_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as Blob) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Gagal membaca audio blob dari IndexedDB:', err);
    return null;
  }
}

export async function deleteAudioBlob(key: string): Promise<void> {
  try {
    const idb = await openIdb();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(IDB_AUDIO_STORE, 'readwrite');
      const store = tx.objectStore(IDB_AUDIO_STORE);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Gagal menghapus audio blob dari IndexedDB:', err);
  }
}

// Inisialisasi sql.js dan skema tabel SQLite
export async function getSqliteDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const SQL = await initSqlJs({
      locateFile: (file) => {
        // Layani file WASM lokal dari folder public (/sql-wasm-browser.wasm atau /sql-wasm.wasm)
        return `/${file}`;
      },
    });

    const savedBinary = await loadDbFromIdb();
    if (savedBinary && savedBinary.byteLength > 0) {
      dbInstance = new SQL.Database(savedBinary);
    } else {
      dbInstance = new SQL.Database();
    }

    // Inisialisasi skema tabel jika belum ada
    dbInstance.run(`
      CREATE TABLE IF NOT EXISTS tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        artist TEXT DEFAULT 'Unknown Artist',
        album TEXT DEFAULT 'Unknown Album',
        duration REAL DEFAULT 0,
        file_name TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        blob_key TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_tracks_file ON tracks(file_name, file_size);

      CREATE TABLE IF NOT EXISTS playlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        cover_image TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS playlist_tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        playlist_id INTEGER NOT NULL,
        track_id INTEGER NOT NULL,
        position INTEGER DEFAULT 0,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE CASCADE,
        FOREIGN KEY (track_id) REFERENCES tracks (id) ON DELETE CASCADE,
        UNIQUE (playlist_id, track_id)
      );
    `);

    // Migration: add is_favorite column if it doesn't exist yet (non-destructive)
    try {
      dbInstance.run(`ALTER TABLE tracks ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0`);
    } catch {
      // Column already exists — safe to ignore
    }

    // Migration: create recently_played table if it doesn't exist yet (non-destructive)
    dbInstance.run(`
      CREATE TABLE IF NOT EXISTS recently_played (
        track_id INTEGER PRIMARY KEY,
        played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (track_id) REFERENCES tracks (id) ON DELETE CASCADE
      );
    `);

    await saveDbToIdb();
    return dbInstance;
  })();

  return initPromise;
}

// Helper query
export function execQuery<T = Record<string, unknown>>(
  db: Database,
  sql: string,
  params?: (string | number | null | Uint8Array)[]
): T[] {
  const results = params ? db.exec(sql, params) : db.exec(sql);
  if (!results.length) return [];
  const { columns, values } = results[0];
  return values.map((row) =>
    Object.fromEntries(columns.map((col, i) => [col, row[i]]))
  ) as T[];
}

// Export database binary (.sqlite)
export async function exportSqliteBinary(): Promise<Uint8Array> {
  const db = await getSqliteDb();
  return db.export();
}
