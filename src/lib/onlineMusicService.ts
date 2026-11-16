import { getSqliteDb, execQuery, saveDbToIdb, saveAudioBlob } from './sqlite';
import { addTrackToPlaylist } from './playlistService';
import type { Track } from './trackService';

export interface OnlineTrack {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  previewUrl: string;
  artworkUrl: string;
  genre: string;
}

// Audius API types
interface AudiusUser {
  name?: string;
}

interface AudiusTrack {
  id: string;
  title: string;
  duration?: number;
  genre?: string;
  mood?: string;
  user?: AudiusUser;
  artwork?: Record<string, string> | null;
  is_streamable?: boolean;
  is_delete?: boolean;
  is_stream_gated?: boolean;
}

interface AudiusSearchResponse {
  data?: AudiusTrack[];
}

interface AudiusTrendingResponse {
  data?: AudiusTrack[];
}

const AUDIUS_API_BASE = 'https://api.audius.co';
const APP_NAME = 'kakawihan';

/**
 * Generate a stable numeric ID from a string hash.
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Resolve the best Audius API host. The /v1 endpoint on api.audius.co
 * acts as a gateway that auto-selects a healthy discovery provider.
 * We use it directly — no host resolution needed.
 */
function getStreamUrl(trackId: string): string {
  return `${AUDIUS_API_BASE}/v1/tracks/${trackId}/stream?app_name=${APP_NAME}`;
}

/**
 * Known unreliable Audius CDN hosts that frequently return 502/503/connection reset.
 */
const BROKEN_CDN_HOSTS = [
  'audius.zeogrid.com',
  'cn1.mainnet.audiusindex.org',
  'cn2.mainnet.audiusindex.org',
  'cn3.mainnet.audiusindex.org',
  'cn4.mainnet.audiusindex.org',
  'audius-nodes.com',
];

function getArtworkUrl(track: AudiusTrack): string {
  if (!track.artwork) return '';
  const url = track.artwork['150x150'] || track.artwork['480x480'] || track.artwork['1000x1000'] || '';
  if (!url) return '';

  // Skip known broken CDN nodes to avoid console error spam
  try {
    const host = new URL(url).hostname;
    if (BROKEN_CDN_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
      return '';
    }
  } catch {
    return '';
  }

  return url;
}

function isPlayable(track: AudiusTrack): boolean {
  if (track.is_delete === true) return false;
  if (track.is_streamable === false) return false;
  if (track.is_stream_gated === true) return false;
  return true;
}

function mapAudiusTrack(track: AudiusTrack): OnlineTrack {
  return {
    id: hashCode(track.id),
    title: track.title || 'Lagu Online',
    artist: track.user?.name || 'Artis Tidak Diketahui',
    album: 'Audius',
    duration: track.duration || 0,
    previewUrl: getStreamUrl(track.id),
    artworkUrl: getArtworkUrl(track),
    genre: track.genre || 'Music',
  };
}

/**
 * Search online tracks using Audius open API (free, no API key, CORS-enabled).
 */
export async function searchOnlineTracks(
  query: string,
  limit: number = 30
): Promise<OnlineTrack[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  try {
    // Use search endpoint for user queries
    const url = `${AUDIUS_API_BASE}/v1/tracks/search?query=${encodeURIComponent(
      cleanQuery
    )}&app_name=${APP_NAME}&limit=${limit}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Audius API responded with ${res.status}`);
    }

    const json: AudiusSearchResponse = await res.json();
    const tracks = (json.data || [])
      .filter(isPlayable)
      .map(mapAudiusTrack);

    return tracks;
  } catch (err) {
    console.error('Gagal mencari musik online dari Audius:', err);
    return [];
  }
}

/**
 * Get trending tracks from Audius (used for initial load / discovery).
 */
export async function getTrendingTracks(
  limit: number = 30
): Promise<OnlineTrack[]> {
  try {
    const url = `${AUDIUS_API_BASE}/v1/tracks/trending?app_name=${APP_NAME}&limit=${limit}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Audius trending API responded with ${res.status}`);
    }

    const json: AudiusTrendingResponse = await res.json();
    const tracks = (json.data || [])
      .filter(isPlayable)
      .map(mapAudiusTrack);

    return tracks;
  } catch (err) {
    console.error('Gagal mengambil trending tracks dari Audius:', err);
    return [];
  }
}

/**
 * Imports an online track into the local SQLite database and IndexedDB cache.
 * Returns the local Track object.
 */
export async function importOnlineTrack(onlineTrack: OnlineTrack): Promise<Track> {
  const db = await getSqliteDb();

  // 1. Check if track already exists in local tracks
  const existing = execQuery<Track>(
    db,
    'SELECT id, title, artist, album, duration, file_name, file_size, mime_type, blob_key, created_at, COALESCE(is_favorite,0) as is_favorite FROM tracks WHERE title = ? AND artist = ? LIMIT 1',
    [onlineTrack.title, onlineTrack.artist]
  );
  if (existing.length > 0) {
    return existing[0];
  }

  // 2. Try to download audio for persistent offline caching
  let blobKey = onlineTrack.previewUrl;
  let fileSize = 1024 * 1024;
  const safeName = onlineTrack.title.replace(/[^\w\s-]/g, '').trim() || 'online-track';
  const fileName = `${safeName}.m4a`;

  try {
    const res = await fetch(onlineTrack.previewUrl);
    if (res.ok) {
      const blob = await res.blob();
      fileSize = blob.size;
      blobKey = `track_online_${onlineTrack.id}_${Date.now()}`;
      await saveAudioBlob(blobKey, blob);
    }
  } catch (e) {
    console.warn('Gagal mengunduh audio ke IndexedDB, menggunakan URL streaming:', e);
  }

  // 3. Insert into SQLite tracks
  db.run(
    `INSERT INTO tracks (title, artist, album, duration, file_name, file_size, mime_type, blob_key)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      onlineTrack.title,
      onlineTrack.artist,
      onlineTrack.album,
      onlineTrack.duration,
      fileName,
      fileSize,
      'audio/mp4',
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

/**
 * Imports an online track and adds it directly to a playlist in SQLite.
 */
export async function addOnlineTrackToPlaylist(
  playlistId: number,
  onlineTrack: OnlineTrack
): Promise<{ success: boolean; track: Track }> {
  const localTrack = await importOnlineTrack(onlineTrack);
  const success = await addTrackToPlaylist(playlistId, localTrack.id);
  return { success, track: localTrack };
}
