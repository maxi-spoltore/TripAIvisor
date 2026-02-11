type DestinationDuration = {
  duration: number;
};

type EndDateValidationError = 'endDateBeforeStart' | 'endDateCollision';

export function calculateDate(baseDate: string | null, daysToAdd: number): string | null {
  if (!baseDate) {
    return null;
  }

  const date = new Date(baseDate);
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split('T')[0];
}

export function formatDate(dateStr: string | null, locale = 'es-ES'): string {
  if (!dateStr) {
    return '';
  }

  const date = new Date(dateStr);
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

export function getTotalDays(destinations: DestinationDuration[]): number {
  return destinations.reduce((sum, destination) => sum + (destination.duration || 0), 0);
}

export function getDestinationDates(
  startDate: string | null,
  destinations: DestinationDuration[],
  index: number
): { start: string | null; end: string | null } {
  if (!startDate) {
    return { start: null, end: null };
  }

  let dayOffset = 0;
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
  const start = new Date(startDate);
  const end = new Date(newEndDate);

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
