import { describe, it, expect } from 'vitest';
import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs';
import { execQuery } from '../sqlite';

describe('SQLite Database Schema & Operations', () => {
  it('should initialize sql.js in-memory database and create kakawihan tables', async () => {
    const wasmPath = path.resolve('node_modules/sql.js/dist/sql-wasm.wasm');
    const wasmBuffer = fs.readFileSync(wasmPath);
    const wasmBinary = wasmBuffer.buffer.slice(
      wasmBuffer.byteOffset,
      wasmBuffer.byteOffset + wasmBuffer.byteLength
    );

    const SQL = await initSqlJs({
      wasmBinary,
    });

    const db = new SQL.Database();

    // Run Kakawihan Schema
    db.run(`
      CREATE TABLE IF NOT EXISTS tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        artist TEXT DEFAULT 'Unknown Artist',
        duration REAL DEFAULT 0,
        file_name TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        blob_key TEXT NOT NULL UNIQUE,
        cover_image TEXT DEFAULT '',
        is_favorite INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

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

      CREATE TABLE IF NOT EXISTS recently_played (
        track_id INTEGER PRIMARY KEY,
        played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (track_id) REFERENCES tracks (id) ON DELETE CASCADE
      );
    `);

    // Verify tables exist
    const tables = execQuery<{ name: string }>(
      db,
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );

    const tableNames = tables.map((t) => t.name);
    expect(tableNames).toContain('tracks');
    expect(tableNames).toContain('playlists');
    expect(tableNames).toContain('playlist_tracks');
    expect(tableNames).toContain('recently_played');

    // Insert track
    db.run(
      `INSERT INTO tracks (title, artist, duration, file_name, file_size, mime_type, blob_key, is_favorite)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Mojang Priangan', 'Nano S.', 180, 'mojang.mp3', 3500000, 'audio/mp3', 'blob_mojang_1', 1]
    );

    const tracks = execQuery<{ id: number; title: string; is_favorite: number }>(
      db,
      'SELECT id, title, is_favorite FROM tracks WHERE title = ?',
      ['Mojang Priangan']
    );
    expect(tracks.length).toBe(1);
    expect(tracks[0].title).toBe('Mojang Priangan');
    expect(tracks[0].is_favorite).toBe(1);

    // Insert Playlist & Link track
    db.run(`INSERT INTO playlists (title, description) VALUES (?, ?)`, ['Lagu Favorit', 'Koleksi Lagu Pilihan']);
    const pl = execQuery<{ id: number }>(db, 'SELECT id FROM playlists WHERE title = ?', ['Lagu Favorit']);
    const playlistId = pl[0].id;
    const trackId = tracks[0].id;

    db.run(
      `INSERT INTO playlist_tracks (playlist_id, track_id) VALUES (?, ?)`,
      [playlistId, trackId]
    );

    const plTracks = execQuery<{ title: string }>(
      db,
      `SELECT t.title FROM tracks t
       JOIN playlist_tracks pt ON t.id = pt.track_id
       WHERE pt.playlist_id = ?`,
      [playlistId]
    );
    expect(plTracks.length).toBe(1);
    expect(plTracks[0].title).toBe('Mojang Priangan');

    // Test Recently Played Upsert
    db.run(
      `INSERT INTO recently_played (track_id, played_at) VALUES (?, CURRENT_TIMESTAMP)
       ON CONFLICT(track_id) DO UPDATE SET played_at = CURRENT_TIMESTAMP`,
      [trackId]
    );

    const recents = execQuery<{ track_id: number }>(db, 'SELECT track_id FROM recently_played');
    expect(recents.length).toBe(1);
    expect(recents[0].track_id).toBe(trackId);
    // Test rename track title
    db.run('UPDATE tracks SET title = ? WHERE id = ?', ['Mojang Priangan (Remastered)', trackId]);
    const renamedTrack = execQuery<{ title: string }>(db, 'SELECT title FROM tracks WHERE id = ?', [trackId]);
    expect(renamedTrack[0].title).toBe('Mojang Priangan (Remastered)');

    // Test rename playlist title
    db.run('UPDATE playlists SET title = ? WHERE id = ?', ['Koleksi Sunda Favorit', playlistId]);
    const renamedPl = execQuery<{ title: string }>(db, 'SELECT title FROM playlists WHERE id = ?', [playlistId]);
    expect(renamedPl[0].title).toBe('Koleksi Sunda Favorit');
  });
});
