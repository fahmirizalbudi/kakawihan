# Dokumentasi Aplikasi Kakawihan 🎵

**Kakawihan** adalah aplikasi pemutar musik *local-first* berbasis web (PWA) yang menggunakan **SQLite WebAssembly (sql.js)** dan **IndexedDB** untuk menyimpan seluruh koleksi lagu, metadata, playlist, riwayat putar, dan audio binary secara langsung di perangkat pengguna tanpa server backend.

---

## 🗄️ 1. Skema Basis Data

Aplikasi menggunakan kombinasi **SQLite WASM** untuk relasi data & query berkecepatan tinggi, serta **IndexedDB** untuk persistensi biner jangka panjang di browser.

### A. Tabel SQLite

#### 1. `tracks`
Menyimpan seluruh metadata file audio yang diunggah ke aplikasi.
```sql
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_favorite INTEGER NOT NULL DEFAULT 0
);
```

#### 2. `playlists`
Menyimpan daftar playlist yang dibuat oleh pengguna.
```sql
CREATE TABLE IF NOT EXISTS playlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_image TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. `playlist_tracks`
Tabel relasi *many-to-many* antara playlist dan track lagu.
```sql
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
```

#### 4. `recently_played`
Menyimpan riwayat lagu yang terakhir diputar secara berurutan.
```sql
CREATE TABLE IF NOT EXISTS recently_played (
  track_id INTEGER PRIMARY KEY,
  played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (track_id) REFERENCES tracks (id) ON DELETE CASCADE
);
```

---

### B. Penyimpanan IndexedDB (`kakawihan_app_db`)

| Object Store | Tipe Data | Kegunaan |
| :--- | :--- | :--- |
| `sqlite_store` | `Uint8Array` (Binary SQLite) | Menyimpan binary database SQLite utuh (`sqlite_db_data`) agar state aplikasi tidak hilang saat browser ditutup / di-refresh. |
| `audio_blobs` | `Blob` (File Audio) | Menyimpan file fisik audio biner menggunakan key unik `blob_key` (misal: `audio_1731671234_abc123`). |

---

## 🚀 2. Panduan Cara Pakai

### A. Menambahkan File Musik
1. Di tab **Tracks**, tekan tombol **"Pilih Lagu"** (ikon `+`).
2. Pilih satu atau beberapa file audio sekaligus dari perangkat Anda (`.mp3`, `.wav`, `.m4a`, `.aac`, `.flac`, `.ogg`, `.weba`).
3. Lagu akan otomatis diproses, durasi dihitung, dan data biner disimpan ke dalam database lokal.

### B. Menghapus Banyak Lagu Sekaligus (*Batch Delete*)
1. Pada daftar lagu di tab **Tracks**, **tekan lama (*long-press*)** pada lagu mana saja yang ingin dihapus.
2. Aplikasi akan masuk ke **Mode Seleksi**, ditandai dengan munculnya kotak centang di setiap lagu dan tombol aksi di atas.
3. Ketuk lagu lain untuk menambah/mengurangi pilihan, atau tekan **"Pilih Semua"** untuk memilih seluruh lagu.
4. Tekan tombol **"Hapus (N)"** berwarna merah.
5. Konfirmasi pada bottom sheet dialog untuk menghapus permanen lagu terpilih.

### C. Mencari Lagu & Playlist
1. Ketuk ikon **Search** (kaca pembesar) di sudut kanan atas header.
2. Ketik judul lagu, artis, atau nama playlist yang dicari.
3. Hasil pencarian akan langsung terfilter secara *realtime*. Tekan **"Batal"** untuk menutup pencarian.

### D. Mengurutkan Data (*Filter Dropdown*)
1. Pada tab **Tracks** atau **Playlists**, ketuk tombol urut **`Name (A-Z)`** / **`Name (Z-A)`**.
2. Daftar akan otomatis diurutkan secara abjad naik (*ascending*) atau turun (*descending*).

### E. Mengelola Playlist
1. Di tab **Playlists**, tekan tombol **"+"** di sebelah kanan filter nama untuk membuat playlist baru.
2. Masukkan nama playlist dan pilih foto sampul (opsional), lalu simpan.
3. Untuk menambahkan lagu ke playlist, buka opsi titik tiga pada lagu di tab **Tracks** lalu pilih **"Tambah ke Playlist"**, atau masuk ke detail playlist dan tekan **"Tambah Lagu"**.
4. Untuk menghapus playlist, ketuk tombol titik tiga (**⋯**) pada baris playlist di halaman Playlists, lalu pilih **"Hapus Playlist"**.

### F. Favorit & Recently Played
- **Favorit**: Buka opsi lagu (titik tiga) lalu pilih **"Tambah ke Favorit"**. Buka kartu **Favorites** di tab Playlists untuk melihat dan memutar semua lagu favorit.
- **Recently Played**: Setiap kali Anda memutar lagu, lagu tersebut otomatis dicatat. Buka kartu **Recently Played** untuk memutar riwayat lagu yang baru saja didengarkan.

---

## 🛠️ 3. Perintah Uji Coba & Pengembangan

```bash
# Menjalankan linter kode (ESLint)
npm run lint

# Menjalankan build type-checking & bundle Vite
npm run build

# Menjalankan dev server lokal
npm run dev

# Menjalankan preview production build
npm run preview
```
