import type { TransportLeg } from '@/types/database';
import { describe, expect, it } from 'vitest';
import { computeLayoverMinutes, computeTotalJourneyMinutes, formatDuration, timeToMinutes } from '../transport';

describe('timeToMinutes', () => {
  it('converts midnight', () => expect(timeToMinutes('00:00')).toBe(0));
  it('converts noon', () => expect(timeToMinutes('12:00')).toBe(720));
  it('converts 13:45', () => expect(timeToMinutes('13:45')).toBe(825));
});

describe('computeLayoverMinutes', () => {
  it('same-day connection', () => {
    expect(computeLayoverMinutes('17:00', 0, '19:30', 0)).toBe(150);
  });

  it('overnight arrival into next-day departure', () => {
    // Arrives 23:00, departs 01:30 next day
    expect(computeLayoverMinutes('23:00', 0, '01:30', 1)).toBe(150);
  });

  it('returns negative for inverted times (invalid data)', () => {
    expect(computeLayoverMinutes('19:30', 0, '17:00', 0)).toBe(-150);
  });
});

describe('formatDuration', () => {
  it('formats hours only', () => expect(formatDuration(120)).toBe('2h'));
  it('formats minutes only', () => expect(formatDuration(45)).toBe('45m'));
  it('formats hours and minutes', () => expect(formatDuration(155)).toBe('2h 35m'));
});

describe('computeTotalJourneyMinutes', () => {
  const makeLeg = (overrides: Partial<TransportLeg>): TransportLeg => ({
    leg_id: 1,
    transport_id: 1,
    position: 0,
    origin_city: null,
    destination_city: null,
    company: null,
    booking_number: null,
    booking_code: null,
    departure_time: null,
    arrival_time: null,
    day_offset: 0,
    terminal: null,
    created_at: '',
    updated_at: '',
    ...overrides
  });

  it('returns null for empty legs', () => {
    expect(computeTotalJourneyMinutes([])).toBeNull();
  });

  it('returns null when times are missing', () => {
    expect(computeTotalJourneyMinutes([makeLeg({ position: 0 })])).toBeNull();
  });

  it('computes single-leg journey', () => {
    const legs = [makeLeg({ departure_time: '13:00', arrival_time: '17:00', day_offset: 0 })];
    expect(computeTotalJourneyMinutes(legs)).toBe(240);
  });

  it('computes multi-leg journey spanning overnight', () => {
    const legs = [
      makeLeg({ position: 0, departure_time: '13:00', arrival_time: '17:00', day_offset: 0 }),
      makeLeg({ position: 1, departure_time: '23:00', arrival_time: '03:00', day_offset: 1 })
    ];

    // 13:00 to 03:00 next day = 14h = 840 min
    expect(computeTotalJourneyMinutes(legs)).toBe(840);
  });
});
