import { describe, expect, it } from 'vitest';
import { parsePublicBookingDate } from '../server/publicBooking';

describe('parsePublicBookingDate', () => {
  it('keeps YYYY-MM-DD values unchanged', () => {
    expect(parsePublicBookingDate('2026-03-31')).toBe('2026-03-31');
  });

  it('parses Month Dth, YYYY values', () => {
    expect(parsePublicBookingDate('March 31st, 2026')).toBe('2026-03-31');
  });

  it('rejects invalid values that would crash parseISO consumers', () => {
    expect(parsePublicBookingDate('2026-03-31 03:30 PM')).toBeNull();
    expect(parsePublicBookingDate('Not a date')).toBeNull();
  });
});
