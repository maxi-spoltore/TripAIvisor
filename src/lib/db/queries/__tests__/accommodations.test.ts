import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
    single: vi.fn()
  };

  const from = vi.fn(() => query);
  const createClient = vi.fn(async () => ({ from }));

  return { query, from, createClient };
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient
}));

import { getAccommodationByDestination, upsertAccommodation } from '../accommodations';

describe('Accommodation queries', () => {
  beforeEach(() => {
    mocks.createClient.mockClear();
    mocks.from.mockClear();

    mocks.query.select.mockReset().mockReturnValue(mocks.query);
    mocks.query.eq.mockReset().mockReturnValue(mocks.query);
    mocks.query.update.mockReset().mockReturnValue(mocks.query);
    mocks.query.insert.mockReset().mockReturnValue(mocks.query);
    mocks.query.single.mockReset();
  });

  it('retrieves accommodation by destination', async () => {
    const accommodation = {
      accommodation_id: 2,
      destination_id: 3,
      name: 'Hotel Atlantico',
      check_in: '14:00:00',
      check_out: '11:00:00',
      booking_link: null,
      booking_code: null,
      address: 'Gran Via 38',
      created_at: '2026-02-03T00:00:00.000Z',
      updated_at: '2026-02-03T00:00:00.000Z'
    };

    mocks.query.single.mockResolvedValueOnce({
      data: accommodation,
      error: null
    });

    const result = await getAccommodationByDestination(3);

    expect(result).toEqual(accommodation);
    expect(mocks.query.eq).toHaveBeenCalledWith('destination_id', 3);
  });

  it('returns null when accommodation does not exist', async () => {
    mocks.query.single.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116' }
    });

    const result = await getAccommodationByDestination(99);

    expect(result).toBeNull();
  });

  it('inserts a new accommodation when no row exists', async () => {
    const created = {
      accommodation_id: 7,
      destination_id: 4,
      name: 'Hotel Central',
      check_in: null,
      check_out: null,
      booking_link: null,
      booking_code: null,
      address: null,
      created_at: '2026-02-03T00:00:00.000Z',
      updated_at: '2026-02-03T00:00:00.000Z'
    };

    mocks.query.single
      .mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      })
      .mockResolvedValueOnce({
        data: created,
        error: null
      });

    const result = await upsertAccommodation({
      destination_id: 4,
      name: 'Hotel Central'
    });

    expect(result).toEqual(created);
    expect(mocks.query.insert).toHaveBeenCalledWith({
      destination_id: 4,
      name: 'Hotel Central'
    });
  });

  it('updates an existing accommodation row', async () => {
    const existing = {
      accommodation_id: 12,
      destination_id: 9,
      name: 'Old Name',
      check_in: null,
      check_out: null,
      booking_link: null,
      booking_code: null,
      address: null,
      created_at: '2026-02-03T00:00:00.000Z',
      updated_at: '2026-02-03T00:00:00.000Z'
    };

    const updated = {
      ...existing,
      name: 'New Name',
      address: 'Plaza Mayor 2'
    };

    mocks.query.single
      .mockResolvedValueOnce({
        data: existing,
        error: null
      })
      .mockResolvedValueOnce({
        data: updated,
        error: null
      });

    const result = await upsertAccommodation({
      destination_id: 9,
      name: 'New Name',
      address: 'Plaza Mayor 2'
    });

    expect(result).toEqual(updated);
    expect(mocks.query.update).toHaveBeenCalledWith({
      name: 'New Name',
      address: 'Plaza Mayor 2'
    });
    expect(mocks.query.eq).toHaveBeenCalledWith('accommodation_id', 12);
  });
});
