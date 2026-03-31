export function parsePublicBookingDate(raw: string): string | null {
  try {
    const trimmed = raw.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

    const cleaned = trimmed.replace(/(\d+)(st|nd|rd|th)/, '$1');
    const match = cleaned.match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/);
    if (!match) return null;

    const monthMap: Record<string, number> = {
      january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
      july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
    };
    const monthIndex = monthMap[match[1].toLowerCase()];
    const day = Number(match[2]);
    const year = Number(match[3]);
    if (monthIndex === undefined || !Number.isInteger(day) || day < 1 || day > 31 || !Number.isInteger(year)) return null;

    const check = new Date(Date.UTC(year, monthIndex, day));
    if (check.getUTCFullYear() !== year || check.getUTCMonth() !== monthIndex || check.getUTCDate() !== day) return null;

    const month = String(monthIndex + 1).padStart(2, '0');
    const dayPadded = String(day).padStart(2, '0');
    return `${year}-${month}-${dayPadded}`;
  } catch {
    return null;
  }
}
