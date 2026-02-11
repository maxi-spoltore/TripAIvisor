import { describe, expect, it } from 'vitest';
import type { TripWithRelations } from '@/types/database';
import { exportTrip, validateImportData } from '../import-export';

describe('Import/export utilities', () => {
  it('exports trips in the prototype-compatible shape', () => {
    const trip: TripWithRelations = {
      trip_id: 11,
      user_id: 1,
      title: 'Test Trip',
      start_date: '2026-02-10',
      departure_city: 'Buenos Aires',
      return_city: 'Buenos Aires',
      created_at: '2026-02-03T00:00:00.000Z',
      updated_at: '2026-02-03T00:00:00.000Z',
      departure_transport: {
        transport_id: 7,
        destination_id: null,
        trip_id: 11,
        transport_role: 'departure',
        transport_type: 'plane',
        leave_accommodation_time: '08:00',
        terminal: 'A',
        company: 'Aerolineas',
        booking_number: 'AB123',
        booking_code: 'XYZ',
        departure_time: '10:00',
        created_at: '2026-02-03T00:00:00.000Z',
        updated_at: '2026-02-03T00:00:00.000Z'
      },
      return_transport: null,
      destinations: [
        {
          destination_id: 99,
          trip_id: 11,
          city: 'Madrid',
          duration: 5,
          position: 0,
          notes: 'Museum day',
          budget: 800,
          created_at: '2026-02-03T00:00:00.000Z',
          updated_at: '2026-02-03T00:00:00.000Z',
          transport: null,
          accommodation: null
        }
      ]
    };

    const exported = exportTrip(trip);

    expect(exported.title).toBe('Test Trip');
    expect(exported.startDate).toBe('2026-02-10');
    expect(exported.departure?.city).toBe('Buenos Aires');
    expect(exported.destinations).toHaveLength(1);
    expect(exported.destinations[0].id).toBe('99');
    expect(exported.destinations[0].city).toBe('Madrid');
    expect(exported.destinations[0].notes).toBe('Museum day');
  });

  it('accepts prototype localStorage import data', () => {
    const data = {
      title: 'Mi Viaje',
      startDate: '2026-03-01',
      departure: {
        type: 'departure',
        city: 'Buenos Aires',
        date: '2026-03-01',
        transport: {}
      },
      destinations: [
        {
          id: 'dest-1',
          city: 'Lima',
          duration: 3,
          transport: {},
          accommodation: {},
          notes: '',
          budget: null
        }
      ],
      return: {
        type: 'return',
        city: 'Buenos Aires',
        transport: {}
      }
    };

    expect(validateImportData(data)).toBe(true);
  });

  it('rejects invalid import payloads', () => {
    expect(validateImportData(null)).toBe(false);
    expect(validateImportData({ title: 123, destinations: [] })).toBe(false);
    expect(
      validateImportData({
        title: 'Trip',
        destinations: [{ id: 'a', city: '', duration: 2, transport: {}, accommodation: {}, notes: '', budget: null }]
      })
    ).toBe(false);
  });
});
