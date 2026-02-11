import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
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

import { getTransportByDestination, getTripTransports, upsertTransport } from '../transports';

describe('Transport queries', () => {
  beforeEach(() => {
    mocks.createClient.mockClear();
    mocks.from.mockClear();

    mocks.query.select.mockReset().mockReturnValue(mocks.query);
    mocks.query.eq.mockReset().mockReturnValue(mocks.query);
    mocks.query.in.mockReset().mockReturnValue(mocks.query);
    mocks.query.update.mockReset().mockReturnValue(mocks.query);
    mocks.query.insert.mockReset().mockReturnValue(mocks.query);
    mocks.query.single.mockReset();
  });

  it('retrieves destination transport', async () => {
    const transport = {
      transport_id: 4,
      destination_id: 8,
      trip_id: null,
      transport_role: 'destination',
      transport_type: 'plane',
      leave_accommodation_time: null,
      terminal: 'T1',
      company: 'Iberia',
      booking_number: null,
      booking_code: null,
      departure_time: null,
      created_at: '2026-02-03T00:00:00.000Z',
      updated_at: '2026-02-03T00:00:00.000Z'
    };

    mocks.query.single.mockResolvedValueOnce({
      data: transport,
      error: null
    });

    const result = await getTransportByDestination(8);

    expect(result).toEqual(transport);
    expect(mocks.query.eq).toHaveBeenCalledWith('destination_id', 8);
  });

  it('returns departure and return transport for a trip', async () => {
    const departure = {
      transport_id: 1,
      destination_id: null,
      trip_id: 12,
      transport_role: 'departure',
      transport_type: 'plane'
    };

    const returning = {
      transport_id: 2,
      destination_id: null,
      trip_id: 12,
      transport_role: 'return',
      transport_type: 'train'
    };

    mocks.query.in.mockResolvedValueOnce({
      data: [departure, returning],
      error: null
    });

    const result = await getTripTransports(12);

    expect(result.departure).toEqual(departure);
    expect(result.return).toEqual(returning);
    expect(mocks.query.eq).toHaveBeenCalledWith('trip_id', 12);
    expect(mocks.query.in).toHaveBeenCalledWith('transport_role', ['departure', 'return']);
  });

  it('inserts transport when no existing row matches', async () => {
    const created = {
      transport_id: 10,
      destination_id: 2,
      trip_id: null,
      transport_role: 'destination',
      transport_type: 'plane',
      leave_accommodation_time: null,
      terminal: null,
      company: 'Iberia',
      booking_number: null,
      booking_code: null,
      departure_time: null,
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

    const result = await upsertTransport({
      destination_id: 2,
      transport_role: 'destination',
      transport_type: 'plane',
      company: 'Iberia'
    });

    expect(result).toEqual(created);
    expect(mocks.query.insert).toHaveBeenCalledWith({
      destination_id: 2,
      trip_id: null,
      transport_role: 'destination',
      transport_type: 'plane',
      company: 'Iberia'
    });
  });

  it('updates an existing transport row', async () => {
    const existing = {
      transport_id: 15,
      destination_id: 6,
      trip_id: null,
      transport_role: 'destination',
      transport_type: 'plane',
      leave_accommodation_time: null,
      terminal: null,
      company: 'Old Company',
      booking_number: null,
      booking_code: null,
      departure_time: null,
      created_at: '2026-02-03T00:00:00.000Z',
      updated_at: '2026-02-03T00:00:00.000Z'
    };

    const updated = {
      ...existing,
      company: 'Ryanair'
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

    const result = await upsertTransport({
      destination_id: 6,
      transport_role: 'destination',
      company: 'Ryanair'
    });

    expect(result.company).toBe('Ryanair');
    expect(mocks.query.update).toHaveBeenCalledWith({ company: 'Ryanair' });
    expect(mocks.query.eq).toHaveBeenCalledWith('transport_id', 15);
  });
});
