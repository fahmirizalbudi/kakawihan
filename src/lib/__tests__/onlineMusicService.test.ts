import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchOnlineTracks, getTrendingTracks } from '../onlineMusicService';

describe('onlineMusicService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return empty list when searching with empty or whitespace string', async () => {
    const results = await searchOnlineTracks('   ');
    expect(results).toEqual([]);
  });

  it('should fetch and filter playable tracks from Audius API correctly', async () => {
    const mockApiResponse = {
      data: [
        {
          id: 'XVX6JOJ',
          title: 'Valid Track',
          duration: 210,
          genre: 'Electronic',
          user: { name: 'Producer One' },
          artwork: { '150x150': 'https://audius-content.figment.io/content/123/150x150.jpg' },
          is_streamable: true,
          is_delete: false,
          is_stream_gated: false,
        },
        {
          id: 'DELETED1',
          title: 'Deleted Track',
          is_streamable: true,
          is_delete: true, // Should be filtered out
          is_stream_gated: false,
        },
        {
          id: 'GATED1',
          title: 'Gated Track',
          is_streamable: true,
          is_delete: false,
          is_stream_gated: true, // Should be filtered out
        },
        {
          id: 'BROKEN_CDN',
          title: 'Broken Artwork Track',
          is_streamable: true,
          is_delete: false,
          is_stream_gated: false,
          artwork: { '150x150': 'https://audius.zeogrid.com/content/abc/150x150.jpg' }, // in blocklist
        },
      ],
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    const tracks = await searchOnlineTracks('ambient', 10);
    expect(tracks.length).toBe(2);

    // Track 1
    expect(tracks[0].title).toBe('Valid Track');
    expect(tracks[0].artist).toBe('Producer One');
    expect(tracks[0].previewUrl).toContain('api.audius.co/v1/tracks/XVX6JOJ/stream');
    expect(tracks[0].artworkUrl).toBe('https://audius-content.figment.io/content/123/150x150.jpg');

    // Track 2 (broken CDN filtered out)
    expect(tracks[1].title).toBe('Broken Artwork Track');
    expect(tracks[1].artworkUrl).toBe(''); // Blocklisted CDN cleared to prevent 502/503 errors
  });

  it('should fetch trending tracks for discovery on initial load', async () => {
    const mockTrending = {
      data: [
        {
          id: 'TREND1',
          title: 'Trending Hit',
          user: { name: 'Top Artist' },
          duration: 180,
          is_streamable: true,
          is_delete: false,
          is_stream_gated: false,
        },
      ],
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrending,
    } as Response);

    const trending = await getTrendingTracks(10);
    expect(trending.length).toBe(1);
    expect(trending[0].title).toBe('Trending Hit');
  });

  it('should gracefully handle API network failures and return empty array', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));
    const results = await searchOnlineTracks('fail test');
    expect(results).toEqual([]);
  });
});
