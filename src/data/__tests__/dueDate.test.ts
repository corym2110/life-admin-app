import { addInterval, computeNextDueDate } from '../dueDate';

describe('addInterval', () => {
  it('adds days', () => {
    expect(addInterval('2026-01-01', { every: 3, unit: 'day' })).toBe('2026-01-04');
  });

  it('adds weeks', () => {
    expect(addInterval('2026-01-01', { every: 2, unit: 'week' })).toBe('2026-01-15');
  });

  it('adds months on a normal day', () => {
    expect(addInterval('2026-01-15', { every: 1, unit: 'month' })).toBe('2026-02-15');
  });

  it('adds multiple months, rolling the year over', () => {
    expect(addInterval('2026-11-15', { every: 3, unit: 'month' })).toBe('2027-02-15');
  });

  it('clamps month-end overflow instead of rolling into the next month', () => {
    // 2026 is not a leap year, so Feb has 28 days.
    expect(addInterval('2026-01-31', { every: 1, unit: 'month' })).toBe('2026-02-28');
  });

  it('clamps to Feb 29 in a leap year', () => {
    expect(addInterval('2024-01-31', { every: 1, unit: 'month' })).toBe('2024-02-29');
  });

  it('adds years, clamping a leap-day anniversary in a non-leap year', () => {
    expect(addInterval('2024-02-29', { every: 1, unit: 'year' })).toBe('2025-02-28');
  });

  it('adds multiple years', () => {
    expect(addInterval('2026-06-01', { every: 2, unit: 'year' })).toBe('2028-06-01');
  });
});

describe('computeNextDueDate', () => {
  it('advances by one interval when marked done on the due date', () => {
    const next = computeNextDueDate('2026-06-01', { every: 6, unit: 'month' }, '2026-06-01');
    expect(next).toBe('2026-12-01');
  });

  it('keeps the original schedule when marked done early', () => {
    const next = computeNextDueDate('2026-06-10', { every: 1, unit: 'month' }, '2026-06-05');
    expect(next).toBe('2026-07-10');
  });

  it('skips forward past already-elapsed occurrences when marked done very late', () => {
    // Due monthly starting Jan 1; not actually done until Apr 15.
    const next = computeNextDueDate('2026-01-01', { every: 1, unit: 'month' }, '2026-04-15');
    expect(next).toBe('2026-05-01');
  });

  it('defaults the reference date to the due date itself', () => {
    expect(computeNextDueDate('2026-03-01', { every: 1, unit: 'week' })).toBe('2026-03-08');
  });

  it('throws for a non-positive every value', () => {
    expect(() => computeNextDueDate('2026-01-01', { every: 0, unit: 'day' })).toThrow();
    expect(() => computeNextDueDate('2026-01-01', { every: -1, unit: 'day' })).toThrow();
  });

  it('throws for a non-integer every value', () => {
    expect(() => computeNextDueDate('2026-01-01', { every: 1.5, unit: 'day' })).toThrow();
  });
});
