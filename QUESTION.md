# Kakawihan — Daftar Pertanyaan & Kunci Jawaban Presentasi Proyek

Dokumen ini memuat daftar pertanyaan teknis, arsitektural, dan implementasi yang kemungkinan besar akan ditanyakan oleh dosen, penguji, atau rekan kelompok saat presentasi proyek aplikasi pemutar musik **Kakawihan**, lengkap dengan jawaban komprehensifnya.

---

## Daftar Isi
1. [Arsitektur & Konsep Umum (High-Level Architecture)](#1-arsitektur--konsep-umum)
2. [Penyimpanan & Basis Data (SQLite & IndexedDB)](#2-penyimpanan--basis-data-sqlite--indexeddb)
3. [Struktur Data: Doubly Linked List dengan Node](#3-struktur-data-doubly-linked-list-dengan-node)
4. [Fitur Musik Online & Streaming (Audius API)](#4-fitur-musik-online--streaming-audius-api)
5. [State Management & Audio Playback Lifecycle](#5-state-management--audio-playback-lifecycle)
6. [UI/UX & Desain Sistem](#6-uiux--desain-sistem)
7. [Pengujian & Kualitas Kode (Testing & QA)](#7-pengujian--kualitas-kode)

---

## 1. Arsitektur & Konsep Umum

### Q1: Apa itu aplikasi Kakawihan dan mengapa dibangun sebagai Progressive Web App (PWA)?
**Jawaban:**
Kakawihan adalah aplikasi pemutar musik modern mobile-first berbasis web yang menggabungkan kemampuan pemutaran file musik lokal (offline) dan pencarian/streaming musik online. 
Aplikasi ini dibangun sebagai **PWA (Progressive Web App)** agar:
1. Dapat diinstal langsung ke homescreen perangkat mobile (Android/iOS) layaknya aplikasi native tanpa perlu melalui Play Store atau App Store.
2. Mendukung offline caching melalui Service Worker (Workbox).
3. Mengurangi ukuran aplikasi dan dependensi runtime native (tetap ringan dan cepat).

### Q2: Mengapa aplikasi dibatasi hanya untuk tampilan perangkat mobile (Mobile-Only Guard)?
**Jawaban:**
Kakawihan dirancang khusus dengan filosofi UX pemutar musik genggam (thumb-driven navigation, bottom navigation, bottom sheets, swipe/scroll area yang ramah satu tangan). Ketika dibuka di layar desktop, komponen `MobileOnlyGuard` akan mendeteksi lebar viewport (`window.innerWidth >= 768px`) dan menampilkan instruksi untuk membuka aplikasi di ponsel atau mengubah browser ke mode Device Emulation (F12 Mobile Mode).

### Q3: Apa saja teknologi utama (Tech Stack) yang digunakan di aplikasi ini?
**Jawaban:**
- **Framework & Bundler:** React 19 + TypeScript + Vite.
- **Styling:** Tailwind CSS v4 dengan palet dark mode custom (`#101012`, `#1c1c1f`, `#242428`, `#0061FE`).
- **Database Lokal:** SQLite murni yang dikompilasi ke WebAssembly (`sql.js`) dipadukan dengan IndexedDB untuk persistensi binary data.
- **Iconography:** `lucide-react`.
- **PWA Tooling:** `vite-plugin-pwa` dengan Workbox.
- **Testing:** `vitest` untuk pengujian unit dan integrasi.

---

## 2. Penyimpanan & Basis Data (SQLite & IndexedDB)

### Q4: Bagaimana cara kerja SQLite di browser tanpa adanya backend server?
**Jawaban:**
Aplikasi menggunakan **`sql.js`**, yaitu library SQLite C asli yang dikompilasi ke WebAssembly (WASM).
- Saat aplikasi dimuat, file `sql-wasm.wasm` dijalankan di browser engine.
- SQLite beroperasi di dalam memori RAM virtual browser secara native, mengeksekusi sintaks SQL standar (`CREATE TABLE`, `INSERT`, `SELECT`, `UPDATE`, `DELETE`, `JOIN`, `CASCADE`).
- Query helper `execQuery<T>()` mengeksekusi query dan memetakan array kolom SQLite menjadi array typed JavaScript object.

### Q5: Mengapa data SQLite tidak hilang saat browser di-refresh atau ditutup?
**Jawaban:**
Karena SQLite `sql.js` secara default berjalan di memory RAM, Kakawihan menghubungkannya dengan **IndexedDB** browser:
1. **Saat Simpan:** Setiap kali ada mutasi data (tambah lagu, buat playlist, toggle favorit), dipanggil `dbInstance.export()` yang menghasilkan `Uint8Array` (binary dump SQLite). Binary ini disimpan ke ObjectStore `sqlite_store` di IndexedDB via fungsi `saveDbToIdb()`.
2. **Saat Inisialisasi:** Fungsi `loadDbFromIdb()` mengambil `Uint8Array` dari IndexedDB lalu mengoperkannya ke constructor `new SQL.Database(savedBinary)`. Jika belum ada, database baru dibuat.

### Q6: Mengapa file audio disimpan terpisah di IndexedDB (`audio_blobs`) dan bukan di dalam tabel SQLite?
**Jawaban:**
Ini adalah keputusan arsitektur penting:
- Menyimpan binary file audio berukuran megabytes (MB) di dalam kolom SQLite (`BLOB`) akan membuat ukuran database membengkak dengan cepat. Setiap kali `db.export()` dijalankan, serialisasi puluhan/ratusan megabytes akan membebani memori dan menyebabkan lag pada UI.
- Oleh karena itu, tabel `tracks` hanya menyimpan metadata (judul, artis, album, durasi, ukuran, dan string unik `blob_key`). File audio mentahnya (`Blob`) disimpan terpisah di IndexedDB ObjectStore `audio_blobs`.
- Saat lagu akan diputar, hanya blob spesifik lagu tersebut yang diambil via `getAudioBlob(blob_key)` lalu diubah menjadi Object URL (`URL.createObjectURL(blob)`).

### Q7: Bagaimana skema relasi database di Kakawihan?
**Jawaban:**
Terdapat 4 tabel berelasi:
1. **`tracks`**:
   - `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
   - `title`, `artist`, `album`, `duration`, `file_name`, `file_size`, `mime_type`
   - `blob_key` (TEXT UNIQUE)
   - `is_favorite` (INTEGER DEFAULT 0)
   - `created_at` (DATETIME)
2. **`playlists`**:
   - `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
   - `title`, `description`, `cover_image`, `created_at`
3. **`playlist_tracks`** (Relasi Many-to-Many antara Playlist dan Track):
   - `id`, `playlist_id`, `track_id`, `position`, `added_at`
   - `FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE`
   - `FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE`
   - `UNIQUE(playlist_id, track_id)` (mencegah lagu ganda dalam satu playlist)
4. **`recently_played`**:
   - `track_id` (INTEGER PRIMARY KEY)
   - `played_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)
   - Menggunakan mekanisme upsert `ON CONFLICT(track_id) DO UPDATE SET played_at = CURRENT_TIMESTAMP`, dibatasi maksimal 50 lagu teratas.

### Q8: Bagaimana aplikasi mencegah pengguna menambahkan file lagu duplikat?
**Jawaban:**
Pada saat pengguna memilih file di tab Tracks:
1. Di layer database terdapat indeks komposit: `CREATE INDEX IF NOT EXISTS idx_tracks_file ON tracks(file_name, file_size);`
2. Fungsi `scanAudioFiles()` memeriksa kecocokan `file_name` dan `file_size` sebelum melakukan insert.
3. Jika ditemukan file dengan nama dan ukuran yang sama persis, file tersebut dilewati dan dihitung sebagai duplikat.
4. Notifikasi Toast memberi tahu pengguna: `"Berhasil menambahkan X lagu (Y duplikat dilewati)"`.

---

## 3. Struktur Data: Doubly Linked List dengan Node

### Q9: Mengapa Kakawihan menerapkan struktur data Doubly Linked List (DLL) dan bukan sekadar array indeks?
**Jawaban:**
1. **Konsep Playlist / Audio Queue:** Pemutar lagu secara alami membutuhkan operasi navigasi maju (`next`) dan mundur (`prev`) secara berurutan.
2. **Kompleksitas Waktu:** Traversal ke lagu berikutnya (`currentNode.next`) atau lagu sebelumnya (`currentNode.prev`) memiliki kompleksitas waktu **$O(1)$** konstan, tanpa perlu melakukan kalkulasi pencarian indeks array `indexOf()` atau manipulasi shift/splice berulang kali.
3. **Penyisipan & Penghapusan Dinamis:** Doubly Linked List memungkinkan penambahan lagu ke tengah antrean atau penghapusan lagu tanpa perlu menggeser elemen memori array ($O(n)$).

### Q10: Bagaimana implementasi kelas Node dan Doubly Linked List di kode aplikasi?
**Jawaban:**
Tersedia pada file `src/lib/doublyLinkedList.ts`:
- **`DoublyLinkedListNode<T>`**: Menyimpan:
  - `value: T` (objek data Track)
  - `prev: DoublyLinkedListNode<T> | null` (pointer ke node lagu sebelumnya)
  - `next: DoublyLinkedListNode<T> | null` (pointer ke node lagu berikutnya)
- **`DoublyLinkedList<T>`**: Menyimpan referensi `head`, `tail`, dan `size`, serta method pendukung seperti `append()`, `prepend()`, `find()`, `toArray()`, dan `fromArray()`.
- Di `AudioPlayerContext`, terdapat pointer `currentNodeRef = useRef<DoublyLinkedListNode<Track> | null>(null)` yang menunjuk secara tepat lagu yang sedang diputar.

### Q11: Bagaimana perilaku pemutar ketika lagu mencapai akhir antrean (Boundary Condition)?
**Jawaban:**
Ketika lagu terakhir di playlist selesai diputar:
- Event `audio.onEnded` memanggil `nextTrack()`.
- Fungsi memeriksa `currentNode.next`. Karena node terakhir adalah tail, `currentNode.next` bernilai `null`.
- Aplikasi **tidak melakukan infinite looping**, melainkan mengeksekusi penghentian:
  ```ts
  audio.pause();
  audio.currentTime = 0;
  setIsPlaying(false);
  setCurrentTime(0);
  currentNodeRef.current = queueListRef.current.head;
  setCurrentTrack(queueListRef.current.head.value);
  ```
- Efeknya: Lagu berhenti di akhir, tombol MiniPlayer berubah kembali menjadi ikon **Play**, dan pointer antrean di-reset ke lagu awal sehingga pengguna dapat menekan tombol play untuk memutar ulang dari awal.

---

## 4. Fitur Musik Online & Streaming (Audius API)

### Q12: Mengapa sebelumnya integrasi iTunes API gagal dan mengapa beralih ke Audius API?
**Jawaban:**
- **Kendala iTunes API:** Di browser modern (termasuk Brave dan Chrome), endpoint iTunes melakukan HTTP redirect 302 ke custom protocol scheme `musics://mzstoreservices...`. Baik request `fetch()` maupun tag `<script>` (JSONP) diblokir browser dengan pesan error `net::ERR_UNKNOWN_URL_SCHEME` dan CORS restriction.
- **Solusi Audius API:** Audius adalah protokol musik terdesentralisasi terbuka. Endpoint `https://api.audius.co/v1/tracks/search` dan `trending` 100% gratis, tidak memerlukan API key rahasia, serta mendukung Open CORS (`*`) secara native di browser.

### Q13: Bagaimana penanganan error gambar album (artwork) dari node CDN Audius?
**Jawaban:**
Karena Audius adalah jaringan peer-to-peer terdistribusi, beberapa node CDN pihak ketiga (seperti `audius.zeogrid.com`, `cn1-cn4.mainnet.audiusindex.org`, `audius-nodes.com`) terkadang mengalami timeout, connection reset, atau 502/503.
Kakawihan mengatasinya dengan 2 lapis proteksi:
1. **Blocklist Filter di Service:** Host CDN yang sering bermasalah langsung di-skip pada fungsi `getArtworkUrl()`, sehingga browser tidak membuang resource melakukan request yang gagal.
2. **Fallback UI Image Error:** Pada komponen `TrackItem` dan `MiniPlayer`, tag `<img>` dipasangi listener `onError={() => setImgError(true)}`. Jika gambar gagal dimuat, UI otomatis menampilkan ikon nada musik (`Music`) tanpa merusak layout.

### Q14: Bagaimana indikator loading / buffering state diterapkan saat memutar lagu online?
**Jawaban:**
Saat memutar audio dari URL online, ada latensi buffering jaringan sebelum audio siap berbunyi.
1. Saat `playTrack()` menerima URL `http/https`, state `isBuffering` diaktifkan (`true`).
2. Event listener audio `waiting` mendeteksi jeda buffering.
3. Event `canplay`, `playing`, dan `play` mematikan buffering (`isBuffering: false`).
4. Di UI:
   - Pada `TrackItem`: thumbnail lagu yang aktif menampilkan **spinner overlay** putih berputar (`border-t-white animate-spin`).
   - Pada `MiniPlayer`: tombol play putih menampilkan spinner hitam dan teks status berubah menjadi `"Memuat..."`.

---

## 5. State Management & Audio Playback Lifecycle

### Q15: Bagaimana pemutar audio dikelola secara global di aplikasi?
**Jawaban:**
Menggunakan React Context API di `AudioPlayerContext.tsx`:
- Satu instance `new Audio()` dibuat di dalam `useRef<HTMLAudioElement>` saat mount dan digunakan bersama di seluruh aplikasi.
- Seluruh event native (`play`, `pause`, `timeupdate`, `loadedmetadata`, `durationchange`, `waiting`, `canplay`, `ended`) dipantau dan disinkronkan ke React state (`isPlaying`, `currentTime`, `duration`, `isBuffering`).
- Komponen di layar mana pun (`TracksScreen`, `PlaylistScreen`, `OnlineSearchScreen`, `MiniPlayer`) dapat memanggil fungsi `playTrack()`, `togglePlay()`, `nextTrack()`, `prevTrack()`, dan `seek()`.

### Q16: Apa itu `AbortError` pada HTML5 Audio dan bagaimana aplikasi menanganinya?
**Jawaban:**
`AbortError: The play() request was interrupted by a new load request` terjadi ketika pengguna mengklik lagu baru secara beruntun sebelum pemanggilan `audio.play()` dari lagu sebelumnya selesai melakukan proses buffering.
Aplikasi menangani ini secara elegan di blok `catch`:
```ts
if (err instanceof DOMException && err.name === 'AbortError') {
  return; // Dibiarkan secara silent karena ini adalah perilaku normal pergantian lagu cepat
}
```
Sehingga konsol browser tetap bersih dari warning yang tidak perlu.

### Q17: Apa yang terjadi jika lagu yang sedang diputar dihapus oleh pengguna?
**Jawaban:**
Di fungsi `deleteTrack(id)` dan `deleteMultipleTracks(ids)`:
- Aplikasi memeriksa apakah `currentTrack.id` termasuk dalam lagu yang akan dihapus.
- Jika iya, fungsi `stopPlayback()` langsung dipanggil: audio di-pause, `src` dilepas, Object URL di-revoke via `URL.revokeObjectURL()`, dan state di-reset ke `null`.
- Lagu berhenti seketika dan tidak meninggalkan memory leak atau suara ghaib yang terus berjalan.

---

## 6. UI/UX & Desain Sistem

### Q18: Mengapa tombol aksi PLAY dan SHUFFLE diubah dari huruf kapital (uppercase) ke Sentence Case?
**Jawaban:**
Penggunaan teks kapital seluruhnya (`uppercase tracking-wider`) membuat teks tampak kaku dan kurang menyatu dengan hierarki tipografi aplikasi yang bernuansa modern minimalis. Mengubahnya menjadi **`Play`** dan **`Shuffle`** membuat tombol lebih bersih, ramah dibaca, dan konsisten dengan tombol aksi lain di aplikasi (seperti "Putar Semua", "Tambah Lagu", dan "Batal").

### Q19: Apa saja aturan konsistensi desain sistem yang dijaga di seluruh aplikasi?
**Jawaban:**
- **Background Utama:** `#101012` (Ultra Dark).
- **Cards & Modals:** `#1c1c1f` (Dark Grey Elevated) dengan radius kelengkungan `rounded-[20px]` atau `rounded-[24px]`.
- **Inputs & Hover State:** `#242428` / `#252528`.
- **Primary Accent:** `#0061FE` (Electric Blue).
- **Secondary / Action Accent:** Putih murni untuk tombol utama Play.
- **Tinggi Tombol Aksi:** Standar `h-9` (`36px`) dengan transisi `active:scale-95`.
- **Interaksi Modal:** Semua bottom sheet mendukung penutupan melalui tap di luar backdrop (`onClick`) dan tombol keyboard `Escape`.

---

## 7. Pengujian & Kualitas Kode

### Q20: Apa saja pengujian otomatis (Testing) yang sudah disediakan dan bagaimana cara menjalankannya?
**Jawaban:**
Pengujian otomatis dikonfigurasi menggunakan **Vitest** dengan script `npm test`:
1. **`doublyLinkedList.test.ts` (6 tests):**
   - Inisialisasi linked list kosong.
   - Pengecekan pointer `prev` dan `next` pada operasi `append()`.
   - Operasi `prepend()`.
   - Pencarian node dengan predikat (`find`).
   - Pembersihan antrean (`clear`).
   - Simulasi deteksi batas akhir playlist (`next === null`).
2. **`sqlite.test.ts` (1 test):**
   - Inisialisasi runtime WebAssembly SQLite `sql.js`.
   - Pembuatan skema tabel (`tracks`, `playlists`, `playlist_tracks`, `recently_played`).
   - Eksekusi query relasional dan operasi join antar tabel.
   - Operasi upsert conflict pada riwayat putar.
3. **`onlineMusicService.test.ts` (4 tests):**
   - Validasi query kosong.
   - Filtering track tidak dapat distreaming (`is_streamable: false`), lagu terhapus (`is_delete: true`), atau berbayar (`is_stream_gated: true`).
   - Pembersihan artwork dari host CDN bermasalah.
   - Pengambilan lagu trending untuk halaman awal.
   - Penanganan fallback ketika jaringan offline/gagal.

Untuk menjalankan seluruh rangkaian pengujian:
```bash
npm test
```
Untuk memverifikasi linter dan build produksi:
```bash
npm run lint && npm run build
```
Semua perintah berhasil lulus 100% tanpa error maupun warning.
