import { addSeconds } from 'date-fns';

export function parseAndAddTime(baseDate: Date, timeStr: string): Date {
  const match = timeStr.match(/^(\d+)([dhms])$/);
  if (!match) {
    throw new Error(`Invalid time format: ${timeStr}`);
  }
  const timsStrToSeconds = timeStringToSeconds(timeStr);
  return addSeconds(baseDate, timsStrToSeconds);
}

export function timeStringToSeconds(timeStr: string): number {
  const match = timeStr.match(/^(\d+)([dhms])$/);
  if (!match) {
    throw new Error(`Invalid time format: ${timeStr}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'd':
      return value * 24 * 60 * 60;
    case 'h':
      return value * 60 * 60;
    case 'm':
      return value * 60;
    case 's':
      return value;
    default:
      throw new Error(`Unsupported time unit: ${unit}`);
  }
}
