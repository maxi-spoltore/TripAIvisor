type DestinationDuration = {
  duration: number;
};

type EndDateValidationError = 'endDateBeforeStart' | 'endDateCollision';

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function calculateDate(baseDate: string | null, daysToAdd: number): string | null {
  if (!baseDate) {
    return null;
  }

  const date = parseLocalDate(baseDate);
  date.setDate(date.getDate() + daysToAdd);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function daysBetween(dateA: string, dateB: string): number {
  const a = parseLocalDate(dateA);
  const b = parseLocalDate(dateB);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDate(dateStr: string | null, locale = 'es-ES'): string {
  if (!dateStr) {
    return '';
  }

  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

export function getTotalDays(destinations: DestinationDuration[]): number {
  return destinations.reduce((sum, destination) => sum + (destination.duration || 0), 0);
}

export function getDestinationDates(
  startDate: string | null,
  destinations: DestinationDuration[],
  index: number,
  travelDays: number = 0
): { start: string | null; end: string | null } {
  if (!startDate) {
    return { start: null, end: null };
  }

  let dayOffset = travelDays;
  for (let i = 0; i < index; i += 1) {
    dayOffset += destinations[i].duration || 0;
  }

  const start = calculateDate(startDate, dayOffset);
  const end = calculateDate(startDate, dayOffset + (destinations[index].duration || 0));

  return { start, end };
}

export function validateEndDate(
  startDate: string,
  newEndDate: string,
  currentTotalDays: number
): { valid: boolean; error?: EndDateValidationError; difference?: number } {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(newEndDate);

  if (end < start) {
    return { valid: false, error: 'endDateBeforeStart' };
  }

  const newTotalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const difference = newTotalDays - currentTotalDays;

  if (difference < 0) {
    return { valid: false, error: 'endDateCollision', difference };
  }

  return { valid: true, difference };
}
