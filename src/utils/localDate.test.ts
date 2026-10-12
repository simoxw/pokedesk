import { describe, expect, it } from 'vitest';
import { getLocalDateKey, getPreviousLocalDateKey, matchesLocalDate, matchesPreviousLocalDate } from './localDate';

describe('local calendar date helpers', () => {
  it('formats the local calendar day as a stable date key', () => {
    expect(getLocalDateKey(new Date(2026, 9, 12, 23, 59))).toBe('2026-10-12');
  });

  it('gets the previous calendar day without subtracting a fixed duration', () => {
    expect(getPreviousLocalDateKey(new Date(2026, 2, 9, 0, 30))).toBe('2026-03-08');
    expect(getPreviousLocalDateKey(new Date(2026, 0, 1, 0, 30))).toBe('2025-12-31');
  });

  it('recognizes both stable keys and dates stored by the previous implementation', () => {
    const date = new Date(2026, 9, 12, 12);
    expect(matchesLocalDate('2026-10-12', date)).toBe(true);
    expect(matchesLocalDate(date.toLocaleDateString('en-CA'), date)).toBe(true);
    expect(matchesLocalDate('2026-10-11', date)).toBe(false);
    expect(matchesPreviousLocalDate('2026-10-11', date)).toBe(true);
    expect(matchesPreviousLocalDate(new Date(2026, 9, 11).toLocaleDateString('en-CA'), date)).toBe(true);
  });
});