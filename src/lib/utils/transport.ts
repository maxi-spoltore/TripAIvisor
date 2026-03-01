import type { TransportLeg } from '@/types/database';

// Convert "HH:MM" to total minutes from midnight.
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

// Compute minutes between leg N's arrival and leg N+1's departure.
// day_offset is relative to the transport's departure date (0 = same day).
export function computeLayoverMinutes(
  arrivalTime: string,
  arrivalDayOffset: number,
  nextDepartureTime: string,
  nextDepartureDayOffset: number
): number {
  const arrivalTotal = arrivalDayOffset * 24 * 60 + timeToMinutes(arrivalTime);
  const departureTotal = nextDepartureDayOffset * 24 * 60 + timeToMinutes(nextDepartureTime);
  return departureTotal - arrivalTotal;
}

// Format a minute count as "Xh Ym", "Xh", or "Ym".
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (h === 0) {
    return `${m}m`;
  }

  if (m === 0) {
    return `${h}h`;
  }

  return `${h}h ${m}m`;
}

// Compute total journey minutes from first departure to last arrival.
// Returns null if any required time field is missing.
export function computeTotalJourneyMinutes(legs: TransportLeg[]): number | null {
  if (legs.length === 0) {
    return null;
  }

  const first = legs[0];
  const last = legs[legs.length - 1];

  if (!first.departure_time || !last.arrival_time) {
    return null;
  }

  return computeLayoverMinutes(first.departure_time, 0, last.arrival_time, last.day_offset);
}
