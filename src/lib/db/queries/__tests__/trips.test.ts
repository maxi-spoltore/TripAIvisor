import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    in: vi.fn(),
    single: vi.fn()
  };

  const from = vi.fn(() => query);
  const createClient = vi.fn(async () => ({ from }));

  return { query, from, createClient };
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient
}));

import { createTrip, deleteTrip, getUserTrips, updateTrip } from '../trips';

describe('Trip queries', () => {
  beforeEach(() => {
    mocks.createClient.mockClear();
    mocks.from.mockClear();

    mocks.query.select.mockReset().mockReturnValue(mocks.query);
    mocks.query.eq.mockReset().mockReturnValue(mocks.query);
    mocks.query.order.mockReset().mockReturnValue(mocks.query);
    mocks.query.insert.mockReset().mockReturnValue(mocks.query);
    mocks.query.update.mockReset().mockReturnValue(mocks.query);
    mocks.query.delete.mockReset().mockReturnValue(mocks.query);
    mocks.query.in.mockReset().mockReturnValue(mocks.query);
    mocks.query.single.mockReset();
  });

  it('retrieves trips ordered by creation date', async () => {
    const trip = {
      trip_id: 7,
      user_id: 42,
      title: 'Madrid Sprint',
      start_date: null,
      departure_city: 'Buenos Aires',
      return_city: null,
      created_at: '2026-02-03T00:00:00.000Z',
      updated_at: '2026-02-03T00:00:00.000Z'
    };

    mocks.query.order.mockResolvedValueOnce({
      data: [trip],
      error: null
    });

    const trips = await getUserTrips(42);

    expect(trips).toEqual([trip]);
    expect(mocks.from).toHaveBeenCalledWith('trips');
    expect(mocks.query.eq).toHaveBeenCalledWith('user_id', 42);
  });

  it('creates a trip for a user', async () => {
    const createdTrip = {
      trip_id: 9,
      user_id: 42,
      title: 'My new trip',
      start_date: null,
      departure_city: 'Buenos Aires',
      return_city: null,
      created_at: '2026-02-03T00:00:00.000Z',
      updated_at: '2026-02-03T00:00:00.000Z'
    };

    mocks.query.single.mockResolvedValueOnce({
      data: createdTrip,
      error: null
    });

    const trip = await createTrip(42, 'My new trip');

    expect(trip).toEqual(createdTrip);
    expect(mocks.query.insert).toHaveBeenCalledWith({
      user_id: 42,
      title: 'My new trip'
    });
  });

  it('updates a trip title', async () => {
    const updatedTrip = {
      trip_id: 10,
      user_id: 42,
      title: 'Updated title',
      start_date: null,
      departure_city: 'Buenos Aires',
      return_city: null,
      created_at: '2026-02-03T00:00:00.000Z',
      updated_at: '2026-02-03T00:00:00.000Z'
    };

    mocks.query.single.mockResolvedValueOnce({
      data: updatedTrip,
      error: null
    });

    const trip = await updateTrip(10, { title: 'Updated title' });

    expect(trip.title).toBe('Updated title');
    expect(mocks.query.update).toHaveBeenCalledWith({ title: 'Updated title' });
    expect(mocks.query.eq).toHaveBeenCalledWith('trip_id', 10);
  });

  it('deletes a trip by id', async () => {
    mocks.query.eq.mockResolvedValueOnce({
      error: null
    });

    await deleteTrip(11);

    expect(mocks.query.delete).toHaveBeenCalled();
    expect(mocks.query.eq).toHaveBeenCalledWith('trip_id', 11);
  });
});
