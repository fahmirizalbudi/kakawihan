import {
  getSqliteDb,
  execQuery,
  saveDbToIdb,
  saveAudioBlob,
  deleteAudioBlob,
} from './sqlite';
import { generateDemoAudioBlob } from './demoAudio';

export interface Track {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: number;
  file_name: string;
  file_size: number;
  mime_type: string;
  blob_key: string;
  created_at: string;
  is_favorite: number; // 0 or 1
}

/**
 * Extracts duration in seconds from an audio Blob/File using a temporary HTML Audio element.
 */
export function getAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio();
    audio.preload = 'metadata';

    const cleanUp = () => {
      URL.revokeObjectURL(url);
      audio.removeAttribute('src');
      audio.load();
    };

    audio.onloadedmetadata = () => {
      const dur = isFinite(audio.duration) ? audio.duration : 0;
      cleanUp();
      resolve(dur);
    };

    audio.onerror = () => {
      cleanUp();
      resolve(0);
    };

    audio.src = url;
  });
}

/**
 * Fetches all tracks from SQLite database sorted by title.
 */
export async function getAllTracks(): Promise<Track[]> {
  const db = await getSqliteDb();
  return execQuery<Track>(
    db,
    'SELECT id, title, artist, album, duration, file_name, file_size, mime_type, blob_key, created_at, COALESCE(is_favorite,0) as is_favorite FROM tracks ORDER BY title ASC'
  );
}

/**
 * Fetches only tracks marked as favorite.
 */
export async function getFavoriteTracks(): Promise<Track[]> {
  const db = await getSqliteDb();
  return execQuery<Track>(
    db,
    'SELECT id, title, artist, album, duration, file_name, file_size, mime_type, blob_key, created_at, COALESCE(is_favorite,0) as is_favorite FROM tracks WHERE is_favorite = 1 ORDER BY title ASC'
  );
}

/**
 * Toggles the is_favorite flag for a track. Returns the new value (0 or 1).
 */
export async function toggleFavorite(trackId: number): Promise<number> {
  const db = await getSqliteDb();
  const rows = execQuery<{ is_favorite: number }>(
    db,
    'SELECT COALESCE(is_favorite,0) as is_favorite FROM tracks WHERE id = ? LIMIT 1',
    [trackId]
  );
  if (!rows.length) return 0;
  const newVal = rows[0].is_favorite === 1 ? 0 : 1;
  db.run('UPDATE tracks SET is_favorite = ? WHERE id = ?', [newVal, trackId]);
  await saveDbToIdb();
  return newVal;
}

/**
 * Clean a file name into a human-readable song title (removes extension, cleans dashes/underscores).
 */
export function cleanTrackTitle(fileName: string): string {
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  return nameWithoutExt.trim();
}

/**
 * Add a single audio file into SQLite and IndexedDB.
 */
export async function addTrackFile(file: File): Promise<Track> {
  const db = await getSqliteDb();
  const blobKey = `track_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // 1. Save blob to IndexedDB
  await saveAudioBlob(blobKey, file);

  // 2. Extract metadata
  const duration = await getAudioDuration(file);
  const title = cleanTrackTitle(file.name);
  const artist = 'Local Device';
  const album = 'Music Storage';

  // 3. Insert into SQLite
  db.run(
    `INSERT INTO tracks (title, artist, album, duration, file_name, file_size, mime_type, blob_key)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      artist,
      album,
      duration,
      file.name,
      file.size,
      file.type || 'audio/mpeg',
      blobKey,
    ]
  );

  await saveDbToIdb();

  // Retrieve the inserted track
  const tracks = execQuery<Track>(
    db,
    'SELECT id, title, artist, album, duration, file_name, file_size, mime_type, blob_key, created_at, COALESCE(is_favorite,0) as is_favorite FROM tracks WHERE blob_key = ? LIMIT 1',
    [blobKey]
  );

  return tracks[0];
}

/**
 * Batch scan multiple files from mobile storage / file picker.
 */
export async function scanAudioFiles(files: FileList | File[]): Promise<number> {
  const db = await getSqliteDb();
  let addedCount = 0;

  const fileArray = Array.from(files).filter((file) => {
    // Only accept audio formats
    return (
      file.type.startsWith('audio/') ||
      /\.(mp3|wav|ogg|m4a|aac|flac|weba)$/i.test(file.name)
    );
  });

  for (const file of fileArray) {
    const blobKey = `track_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    await saveAudioBlob(blobKey, file);

    const duration = await getAudioDuration(file);
    const title = cleanTrackTitle(file.name);

    db.run(
      `INSERT INTO tracks (title, artist, album, duration, file_name, file_size, mime_type, blob_key)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        'Local Device',
        'Music Storage',
        duration,
        file.name,
        file.size,
        file.type || 'audio/mpeg',
        blobKey,
      ]
    );

    addedCount++;
  }

  if (addedCount > 0) {
    await saveDbToIdb();
  }

  return addedCount;
}

/**
 * Deletes a track from SQLite and its corresponding audio blob from IndexedDB.
 */
export async function deleteTrack(id: number): Promise<void> {
  await deleteMultipleTracks([id]);
}

/**
 * Deletes multiple tracks from SQLite and their audio blobs from IndexedDB.
 */
export async function deleteMultipleTracks(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getSqliteDb();
  const placeholders = ids.map(() => '?').join(',');

  const tracks = execQuery<Track>(
    db,
    `SELECT blob_key FROM tracks WHERE id IN (${placeholders})`,
    ids
  );

  for (const t of tracks) {
    await deleteAudioBlob(t.blob_key);
  }

  db.run(`DELETE FROM tracks WHERE id IN (${placeholders})`, ids);

  try {
    db.run(`DELETE FROM playlist_tracks WHERE track_id IN (${placeholders})`, ids);
    db.run(`DELETE FROM recently_played WHERE track_id IN (${placeholders})`, ids);
  } catch {
    // Non-fatal
  }

  await saveDbToIdb();
}

/**
 * Seeds a built-in Sundanese pentatonic chime audio file for instant testing.
 */
export async function seedDemoTrack(): Promise<Track> {
  const blob = generateDemoAudioBlob();
  const db = await getSqliteDb();
  const blobKey = `track_demo_${Date.now()}`;

  await saveAudioBlob(blobKey, blob);
  const duration = await getAudioDuration(blob);

  const title = 'Karatagan Sunda (Demo Chime)';
  const fileName = 'karatagan-sunda-demo.wav';

  db.run(
    `INSERT INTO tracks (title, artist, album, duration, file_name, file_size, mime_type, blob_key)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      'Kakawihan',
      'Demo Storage',
      duration,
      fileName,
      blob.size,
      'audio/wav',
      blobKey,
    ]
  );

  await saveDbToIdb();

  const tracks = execQuery<Track>(
    db,
    'SELECT id, title, artist, album, duration, file_name, file_size, mime_type, blob_key, created_at, COALESCE(is_favorite,0) as is_favorite FROM tracks WHERE blob_key = ? LIMIT 1',
    [blobKey]
  );

  return tracks[0];
}
