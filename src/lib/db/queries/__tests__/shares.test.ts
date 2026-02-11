import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const serverQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    in: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    single: vi.fn()
  };

  const adminQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    in: vi.fn(),
    single: vi.fn()
  };

  const serverFrom = vi.fn(() => serverQuery);
  const adminFrom = vi.fn(() => adminQuery);

  const createClient = vi.fn(async () => ({ from: serverFrom }));
  const createAdminClient = vi.fn(() => ({ from: adminFrom }));
  const nanoid = vi.fn();

  return {
    serverQuery,
    adminQuery,
    serverFrom,
    adminFrom,
    createClient,
    createAdminClient,
    nanoid
  };
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mocks.createAdminClient
}));

vi.mock('nanoid', () => ({
  nanoid: mocks.nanoid
}));

import { createShareLink, deactivateShareLink, getSharedTrip } from '../shares';

describe('Share queries', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://tripaivisor.example';

    mocks.createClient.mockClear();
    mocks.createAdminClient.mockClear();
    mocks.serverFrom.mockClear();
    mocks.adminFrom.mockClear();
    mocks.nanoid.mockReset().mockReturnValue('abc123def456');

    mocks.serverQuery.select.mockReset().mockReturnValue(mocks.serverQuery);
    mocks.serverQuery.eq.mockReset().mockReturnValue(mocks.serverQuery);
    mocks.serverQuery.order.mockReset().mockReturnValue(mocks.serverQuery);
    mocks.serverQuery.in.mockReset().mockReturnValue(mocks.serverQuery);
    mocks.serverQuery.insert.mockReset().mockReturnValue(mocks.serverQuery);
    mocks.serverQuery.update.mockReset().mockReturnValue(mocks.serverQuery);
    mocks.serverQuery.single.mockReset();

    mocks.adminQuery.select.mockReset().mockReturnValue(mocks.adminQuery);
    mocks.adminQuery.eq.mockReset().mockReturnValue(mocks.adminQuery);
    mocks.adminQuery.order.mockReset().mockReturnValue(mocks.adminQuery);
    mocks.adminQuery.in.mockReset().mockReturnValue(mocks.adminQuery);
    mocks.adminQuery.single.mockReset();
  });

  it('creates a share link with token and URL', async () => {
    mocks.serverQuery.insert.mockResolvedValueOnce({ error: null });

    const result = await createShareLink(5, 'en');

    expect(result.shareToken).toBe('abc123def456');
    expect(result.shareUrl).toBe('https://tripaivisor.example/en/share/abc123def456');
    expect(mocks.serverFrom).toHaveBeenCalledWith('trip_shares');
    expect(mocks.serverQuery.insert).toHaveBeenCalledWith({
      trip_id: 5,
      share_token: 'abc123def456'
    });
  });

  it('returns null when share token does not exist', async () => {
    mocks.adminQuery.single.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116' }
    });

    const result = await getSharedTrip('missing-token');

    expect(result).toBeNull();
  });

  it('returns trip data for an active, non-expired token', async () => {
    mocks.adminQuery.single
      .mockResolvedValueOnce({
        data: {
          trip_id: 9,
          is_active: true,
          expires_at: null
        },
        error: null
      })
      .mockResolvedValueOnce({
        data: {
          trip_id: 9,
          user_id: 1,
          title: 'Spring in Madrid',
          start_date: '2026-04-02',
          departure_city: 'Buenos Aires',
          return_city: 'Buenos Aires',
          created_at: '2026-02-03T00:00:00.000Z',
          updated_at: '2026-02-03T00:00:00.000Z'
        },
        error: null
      });

    mocks.adminQuery.order.mockResolvedValueOnce({
      data: [],
      error: null
    });

    mocks.adminQuery.in.mockResolvedValueOnce({
      data: [],
      error: null
    });

    const result = await getSharedTrip('abc123def456');

    expect(result).not.toBeNull();
    expect(result?.trip_id).toBe(9);
    expect(result?.destinations).toEqual([]);
    expect(result?.departure_transport).toBeNull();
    expect(result?.return_transport).toBeNull();
  });

  it('deactivates a share link', async () => {
    mocks.serverQuery.eq.mockResolvedValueOnce({
      error: null
    });

    await deactivateShareLink(44);

    expect(mocks.serverFrom).toHaveBeenCalledWith('trip_shares');
    expect(mocks.serverQuery.update).toHaveBeenCalledWith({ is_active: false });
    expect(mocks.serverQuery.eq).toHaveBeenCalledWith('share_id', 44);
  });
});
