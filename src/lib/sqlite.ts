import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';

const DB_STORE_KEY = 'sqlite_db_data';
const IDB_NAME = 'kakawihan_app_db';
const IDB_STORE = 'sqlite_store';

let dbInstance: Database | null = null;
let initPromise: Promise<Database> | null = null;

// IndexedDB Helper untuk persistensi binary SQLite
function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
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

// Inisialisasi sql.js
export async function getSqliteDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const SQL = await initSqlJs({
      locateFile: (file) => {
        // Layani file WASM lokal dari folder public (/sql-wasm-browser.wasm atau /sql-wasm.wasm)
        // untuk mendukung fungsionalitas PWA offline sepenuhnya
        return `/${file}`;
      },
    });

    const savedBinary = await loadDbFromIdb();
    if (savedBinary && savedBinary.byteLength > 0) {
      dbInstance = new SQL.Database(savedBinary);
    } else {
      dbInstance = new SQL.Database();
    }

    return dbInstance;
  })();

  return initPromise;
}

// Helper query dari sqlite-docs.md
export function execQuery<T = Record<string, unknown>>(db: Database, sql: string, params?: (string | number | null | Uint8Array)[]): T[] {
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
