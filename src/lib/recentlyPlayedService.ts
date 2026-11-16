import { getSqliteDb, execQuery, saveDbToIdb } from './sqlite';
import type { Track } from './trackService';

const MAX_RECENTLY_PLAYED = 50;

/**
 * Records a track as recently played (upsert — updates played_at if already exists).
 */
export async function recordRecentlyPlayed(trackId: number): Promise<void> {
  const db = await getSqliteDb();
  db.run(
    `INSERT INTO recently_played (track_id, played_at)
     VALUES (?, CURRENT_TIMESTAMP)
     ON CONFLICT(track_id) DO UPDATE SET played_at = CURRENT_TIMESTAMP`,
    [trackId]
  );
  // Trim to max entries — keep only the most recent N
  db.run(
    `DELETE FROM recently_played WHERE track_id NOT IN (
       SELECT track_id FROM recently_played ORDER BY played_at DESC LIMIT ?
     )`,
    [MAX_RECENTLY_PLAYED]
  );
  await saveDbToIdb();
}

/**
 * Fetches recently played tracks ordered by most recently played first.
 */
export async function getRecentlyPlayedTracks(): Promise<Track[]> {
  const db = await getSqliteDb();
  return execQuery<Track>(
    db,
    `SELECT t.id, t.title, t.artist, t.duration, t.file_name, t.file_size,
            t.mime_type, t.blob_key, t.created_at, COALESCE(t.is_favorite, 0) as is_favorite
     FROM tracks t
     INNER JOIN recently_played rp ON t.id = rp.track_id
     ORDER BY rp.played_at DESC`
  );
}

/**
 * Returns the count of recently played tracks.
 */
export async function getRecentlyPlayedCount(): Promise<number> {
  const db = await getSqliteDb();
  const rows = execQuery<{ cnt: number }>(db, 'SELECT COUNT(*) as cnt FROM recently_played');
  return rows[0]?.cnt ?? 0;
}
