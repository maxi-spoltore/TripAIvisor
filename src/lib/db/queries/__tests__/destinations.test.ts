import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    single: vi.fn()
  };

  const from = vi.fn(() => query);
  const createClient = vi.fn(async () => ({ from }));

  return { query, from, createClient };
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient
}));

import {
  createDestination,
  deleteDestination,
  getDestinationsByTrip,
  reorderDestinations,
  updateDestination
} from '../destinations';

describe('Destination queries', () => {
  beforeEach(() => {
    mocks.createClient.mockClear();
    mocks.from.mockClear();

    mocks.query.select.mockReset().mockReturnValue(mocks.query);
    mocks.query.eq.mockReset().mockReturnValue(mocks.query);
    mocks.query.order.mockReset().mockReturnValue(mocks.query);
    mocks.query.limit.mockReset().mockReturnValue(mocks.query);
    mocks.query.insert.mockReset().mockReturnValue(mocks.query);
    mocks.query.update.mockReset().mockReturnValue(mocks.query);
    mocks.query.delete.mockReset().mockReturnValue(mocks.query);
    mocks.query.single.mockReset();
  });

  it('retrieves destinations ordered by position', async () => {
    const destination = {
      destination_id: 3,
      trip_id: 1,
      city: 'Madrid',
      duration: 4,
      position: 0,
      notes: null,
      budget: null,
      created_at: '2026-02-03T00:00:00.000Z',
      updated_at: '2026-02-03T00:00:00.000Z'
    };

    mocks.query.order.mockResolvedValueOnce({
      data: [destination],
      error: null
    });

    const result = await getDestinationsByTrip(1);

    expect(result).toEqual([destination]);
    expect(mocks.from).toHaveBeenCalledWith('destinations');
    expect(mocks.query.eq).toHaveBeenCalledWith('trip_id', 1);
    expect(mocks.query.order).toHaveBeenCalledWith('position', { ascending: true });
  });

  it('creates a destination with provided position', async () => {
    const created = {
      destination_id: 5,
      trip_id: 1,
      city: 'Barcelona',
      duration: 5,
      position: 2,
      notes: null,
      budget: null,
      created_at: '2026-02-03T00:00:00.000Z',
      updated_at: '2026-02-03T00:00:00.000Z'
    };

    mocks.query.single.mockResolvedValueOnce({
      data: created,
      error: null
    });

    const result = await createDestination(1, 'Barcelona', 5, 2);

    expect(result).toEqual(created);
    expect(mocks.query.insert).toHaveBeenCalledWith({
      trip_id: 1,
      city: 'Barcelona',
      duration: 5,
      position: 2
    });
  });

  it('updates destination fields', async () => {
    const updated = {
      destination_id: 9,
      trip_id: 2,
      city: 'Sevilla',
      duration: 3,
      position: 1,
      notes: 'Museums',
      budget: 150,
      created_at: '2026-02-03T00:00:00.000Z',
      updated_at: '2026-02-03T00:00:00.000Z'
    };

    mocks.query.single.mockResolvedValueOnce({
      data: updated,
      error: null
    });

    const result = await updateDestination(
      9,
      {
        city: 'Sevilla',
        duration: 3,
        notes: 'Museums',
        budget: 150
      },
      2
    );

    expect(result).toEqual(updated);
    expect(mocks.query.update).toHaveBeenCalledWith({
      city: 'Sevilla',
      duration: 3,
      notes: 'Museums',
      budget: 150
    });
  });

  it('deletes a destination by id', async () => {
    mocks.query.eq.mockResolvedValueOnce({
      error: null
    });

    await deleteDestination(12, 3);

    expect(mocks.query.delete).toHaveBeenCalled();
    expect(mocks.query.eq).toHaveBeenCalledWith('destination_id', 12);
    expect(mocks.query.eq).toHaveBeenCalledWith('trip_id', 3);
  });

  it('reorders destinations by updating each position', async () => {
    await reorderDestinations(7, [22, 23, 24]);

    expect(mocks.query.update).toHaveBeenNthCalledWith(1, { position: 0 });
    expect(mocks.query.update).toHaveBeenNthCalledWith(2, { position: 1 });
    expect(mocks.query.update).toHaveBeenNthCalledWith(3, { position: 2 });
  });
});
