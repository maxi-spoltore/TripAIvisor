import { describe, expect, it } from 'vitest';
import {
  calculateDate,
  formatDate,
  getDestinationDates,
  getTotalDays,
  validateEndDate
} from '../dates';

describe('Date utilities', () => {
  describe('calculateDate', () => {
    it('adds days to a base date', () => {
      expect(calculateDate('2024-01-15', 5)).toBe('2024-01-20');
    });

    it('handles month overflow', () => {
      expect(calculateDate('2024-01-30', 5)).toBe('2024-02-04');
    });

    it('handles year overflow', () => {
      expect(calculateDate('2024-12-30', 5)).toBe('2025-01-04');
    });

    it('returns null when base date is missing', () => {
      expect(calculateDate(null, 3)).toBeNull();
    });
  });

  describe('formatDate', () => {
    it('formats a date in Spanish by default', () => {
      const result = formatDate('2024-01-15');
      expect(result).toMatch(/15.*ene/i);
    });

    it('formats a date in English when locale is provided', () => {
      const result = formatDate('2024-01-15', 'en-US');
      expect(result).toMatch(/15.*jan/i);
    });

    it('returns an empty string for null input', () => {
      expect(formatDate(null)).toBe('');
    });
  });

  describe('getTotalDays', () => {
    it('sums destination durations', () => {
      const destinations = [{ duration: 3 }, { duration: 5 }, { duration: 2 }];
      expect(getTotalDays(destinations)).toBe(10);
    });

    it('returns 0 for an empty list', () => {
      expect(getTotalDays([])).toBe(0);
    });
  });

  describe('getDestinationDates', () => {
    const destinations = [{ duration: 3 }, { duration: 5 }, { duration: 2 }];

    it('calculates dates for the first destination', () => {
      const result = getDestinationDates('2024-01-15', destinations, 0);
      expect(result.start).toBe('2024-01-15');
      expect(result.end).toBe('2024-01-18');
    });

    it('calculates dates for a middle destination', () => {
      const result = getDestinationDates('2024-01-15', destinations, 1);
      expect(result.start).toBe('2024-01-18');
      expect(result.end).toBe('2024-01-23');
    });

    it('returns null bounds when trip start date is missing', () => {
      const result = getDestinationDates(null, destinations, 0);
      expect(result).toEqual({ start: null, end: null });
    });
  });

  describe('validateEndDate', () => {
    it('rejects end dates before start date', () => {
      const result = validateEndDate('2024-01-15', '2024-01-10', 5);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('endDateBeforeStart');
    });

    it('rejects end dates that collide with current destinations', () => {
      const result = validateEndDate('2024-01-15', '2024-01-18', 5);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('endDateCollision');
      expect(result.difference).toBe(-2);
    });

    it('accepts valid end dates and returns available difference', () => {
      const result = validateEndDate('2024-01-15', '2024-01-25', 5);
      expect(result.valid).toBe(true);
      expect(result.difference).toBe(5);
    });
  });
});
