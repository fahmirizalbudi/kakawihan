import { getSqliteDb, execQuery, saveDbToIdb } from './sqlite';
import type { Track } from './trackService';

export interface Playlist {
  id: number;
  title: string;
  description: string;
  cover_image: string;
  created_at: string;
  tracks_count: number;
}

/**
 * Fetches all playlists with track counts from SQLite database.
 */
export async function getAllPlaylists(): Promise<Playlist[]> {
  const db = await getSqliteDb();
  return execQuery<Playlist>(
    db,
    `SELECT p.id, p.title, p.description, p.cover_image, p.created_at,
            COUNT(pt.track_id) as tracks_count
     FROM playlists p
     LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
     GROUP BY p.id
     ORDER BY p.id DESC`
  );
}

/**
 * Creates a new playlist in SQLite.
 */
export async function createPlaylist(
  title: string,
  description: string = '',
  coverImage: string = ''
): Promise<Playlist> {
  const db = await getSqliteDb();
  const cleanTitle = title.trim();

  db.run(
    'INSERT INTO playlists (title, description, cover_image) VALUES (?, ?, ?)',
    [cleanTitle, description, coverImage]
  );
  await saveDbToIdb();

  const created = execQuery<Playlist>(
    db,
    `SELECT p.id, p.title, p.description, p.cover_image, p.created_at, 0 as tracks_count
     FROM playlists p
     ORDER BY p.id DESC LIMIT 1`
  );

  return created[0];
}

/**
 * Deletes a playlist and its track relations from SQLite.
 */
export async function deletePlaylist(id: number): Promise<void> {
  const db = await getSqliteDb();
  db.run('DELETE FROM playlist_tracks WHERE playlist_id = ?', [id]);
  db.run('DELETE FROM playlists WHERE id = ?', [id]);
  await saveDbToIdb();
}

/**
 * Fetches tracks belonging to a specific playlist.
 */
export async function getPlaylistTracks(playlistId: number): Promise<Track[]> {
  const db = await getSqliteDb();
  return execQuery<Track>(
    db,
    `SELECT t.id, t.title, t.artist, t.album, t.duration, t.file_name, t.file_size, t.mime_type, t.blob_key, t.created_at,
            COALESCE(t.is_favorite, 0) as is_favorite,
            COALESCE(t.cover_image, '') as cover_image
     FROM tracks t
     INNER JOIN playlist_tracks pt ON t.id = pt.track_id
     WHERE pt.playlist_id = ?
     ORDER BY pt.position ASC, pt.id ASC`,
    [playlistId]
  );
}

/**
 * Updates a playlist's display name/title.
 */
export async function updatePlaylistTitle(playlistId: number, newTitle: string): Promise<boolean> {
  const cleanTitle = newTitle.trim();
  if (!cleanTitle) return false;
  const db = await getSqliteDb();
  db.run('UPDATE playlists SET title = ? WHERE id = ?', [cleanTitle, playlistId]);
  await saveDbToIdb();
  return true;
}

/**
 * Adds a track to a playlist.
 */
export async function addTrackToPlaylist(
  playlistId: number,
  trackId: number
): Promise<boolean> {
  const db = await getSqliteDb();
  try {
    db.run(
      'INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id) VALUES (?, ?)',
      [playlistId, trackId]
    );
    await saveDbToIdb();
    return true;
  } catch (err) {
    console.error('Gagal menambahkan lagu ke playlist:', err);
    return false;
  }
}

/**
 * Removes a track from a playlist.
 */
export async function removeTrackFromPlaylist(
  playlistId: number,
  trackId: number
): Promise<void> {
  const db = await getSqliteDb();
  db.run(
    'DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?',
    [playlistId, trackId]
  );
  await saveDbToIdb();
}
