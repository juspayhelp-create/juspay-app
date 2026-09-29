/**
 * Utility functions for Indian Standard Time (IST - UTC+5:30) calculations.
 * Ensures consistent 11:00 PM IST reset boundaries regardless of server or client location.
 */

export const IST_OFFSET_MINUTES = 330; // 5 hours 30 minutes
export const IST_OFFSET_MS = IST_OFFSET_MINUTES * 60 * 1000; // 19,800,000 ms

/**
 * Universal 11:00 PM IST Reset Constants
 * 11:00 PM IST strictly equals 17:30:00 UTC globally.
 * 17h * 3600 + 30m * 60 = 63,000 seconds offset from UTC day start.
 */
export const UTC_CYCLE_OFFSET_SECONDS = 63000;
export const SECONDS_IN_DAY = 86400;

/**
 * Universal cycle epoch indexing based on UTC:
 * cycle_id = floor((UTC_timestamp_seconds - 63000) / 86400)
 */
export function getCycleIdFromUtcSeconds(utcSeconds: number): number {
  return Math.floor((utcSeconds - UTC_CYCLE_OFFSET_SECONDS) / SECONDS_IN_DAY);
}

export function getCycleIdFromUtcMs(utcMs: number): number {
  const utcSeconds = Math.floor(utcMs / 1000);
  return getCycleIdFromUtcSeconds(utcSeconds);
}

export function getNextResetUtcSeconds(cycleId: number): number {
  return (cycleId + 1) * SECONDS_IN_DAY + UTC_CYCLE_OFFSET_SECONDS;
}

export function getNextResetUtcMs(cycleId: number): number {
  return getNextResetUtcSeconds(cycleId) * 1000;
}

/**
 * Monotonically computed countdown against a server-provided timestamp anchor.
 * Uses performance.now() elapsed interval so device clock tampering has ZERO effect.
 */
export function computeServerAnchoredCountdown(anchor?: {
  serverTimeUtcMs: number;
  nextResetUtcMs: number;
  receivedAtPerfNow: number;
} | null) {
  if (!anchor || typeof anchor.nextResetUtcMs !== 'number' || isNaN(anchor.nextResetUtcMs) || typeof anchor.serverTimeUtcMs !== 'number' || isNaN(anchor.serverTimeUtcMs)) {
    const fallback = getISTResetTimestamps();
    return {
      msUntilReset: fallback.msUntilReset,
      hoursUntil: fallback.hoursUntil,
      minutesUntil: fallback.minutesUntil,
      secondsUntil: fallback.secondsUntil,
      countdownText: `${fallback.hoursUntil}h ${fallback.minutesUntil}m ${fallback.secondsUntil}s`,
      shortCountdownText: `${fallback.hoursUntil}h ${fallback.minutesUntil}m`,
    };
  }

  // Monotonic time elapsed since server response was received
  const perfNow = typeof performance !== 'undefined' ? performance.now() : 0;
  const elapsedMs = Math.max(0, perfNow - (anchor.receivedAtPerfNow || 0));
  const currentServerTimeMs = anchor.serverTimeUtcMs + elapsedMs;
  const msUntilReset = Math.max(0, anchor.nextResetUtcMs - currentServerTimeMs);

  const hoursUntil = Math.floor(msUntilReset / (1000 * 60 * 60));
  const minutesUntil = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));
  const secondsUntil = Math.floor((msUntilReset % (1000 * 60)) / 1000);

  return {
    msUntilReset,
    hoursUntil,
    minutesUntil,
    secondsUntil,
    countdownText: `${hoursUntil}h ${minutesUntil}m ${secondsUntil}s`,
    shortCountdownText: `${hoursUntil}h ${minutesUntil}m`,
  };
}

/**
 * Explicitly calculates time based on the UTC+5:30 offset.
 * Returns a Date object shifted by UTC+5:30 so its UTC methods (getUTCFullYear,
 * getUTCMonth, getUTCDate, getUTCHours, etc.) represent the exact IST date and time components.
 *
 * @param dateInput - Optional Date, timestamp in ms, or date string. Defaults to Date.now().
 * @returns Date shifted to Indian Standard Time.
 */
export function getISTDate(dateInput: Date | number | string = Date.now()): Date {
  const timestamp = typeof dateInput === 'number'
    ? dateInput
    : dateInput instanceof Date
      ? dateInput.getTime()
      : new Date(dateInput).getTime();

  const validTimestamp = isNaN(timestamp) ? Date.now() : timestamp;
  return new Date(validTimestamp + IST_OFFSET_MS);
}

/**
 * Returns structured IST calendar and time components for display and calculations.
 *
 * @param dateInput - Optional Date, timestamp in ms, or date string. Defaults to Date.now().
 */
export function getISTComponents(dateInput: Date | number | string = Date.now()) {
  const istDate = getISTDate(dateInput);
  const year = istDate.getUTCFullYear();
  const month = istDate.getUTCMonth() + 1; // 1-12
  const date = istDate.getUTCDate();
  const hours = istDate.getUTCHours(); // 0-23
  const minutes = istDate.getUTCMinutes();
  const seconds = istDate.getUTCSeconds();
  const isAfter11PM = hours >= 23;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formattedDate = `${pad(date)}/${pad(month)}/${year}`;
  const formattedTime = `${pad(hours)}:${pad(minutes)}:${pad(seconds)} IST`;

  return {
    year,
    month,
    date,
    hours,
    minutes,
    seconds,
    isAfter11PM,
    formattedDate,
    formattedTime,
  };
}

/**
 * Calculates the cycle start and next reset timestamps for the 11:00 PM IST daily reset.
 * All returned timestamps are absolute epoch milliseconds (UTC).
 * 11:00 PM IST corresponds to 17:30 UTC on the same calendar day in IST.
 *
 * @param dateInput - Reference timestamp or Date (defaults to now)
 */
export function getISTResetTimestamps(dateInput: Date | number | string = Date.now()) {
  const timestamp = typeof dateInput === 'number'
    ? dateInput
    : dateInput instanceof Date
      ? dateInput.getTime()
      : new Date(dateInput).getTime();
  const validTimestamp = isNaN(timestamp) ? Date.now() : timestamp;

  const cycleId = getCycleIdFromUtcMs(validTimestamp);
  const cycleStartUtcMs = (cycleId * SECONDS_IN_DAY + UTC_CYCLE_OFFSET_SECONDS) * 1000;
  const nextResetUtcMs = getNextResetUtcMs(cycleId);

  const msUntilReset = Math.max(0, nextResetUtcMs - validTimestamp);
  const hoursUntil = Math.floor(msUntilReset / (1000 * 60 * 60));
  const minutesUntil = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));
  const secondsUntil = Math.floor((msUntilReset % (1000 * 60)) / 1000);

  return {
    timestamp: validTimestamp,
    cycleId,
    cycleStartUtcMs,
    nextResetUtcMs,
    msUntilReset,
    hoursUntil,
    minutesUntil,
    secondsUntil,
    countdownText: `${hoursUntil}h ${minutesUntil}m ${secondsUntil}s`,
    shortCountdownText: `${hoursUntil}h ${minutesUntil}m`,
  };
}

/**
 * Checks whether a given timestamp or cycle epoch matches the current 11:00 PM IST (17:30 UTC) cycle.
 *
 * @param lastClaim - Timestamp, Date, or cycle epoch of the last action
 * @param currentTimestamp - Reference timestamp or Date (defaults to now)
 */
export function isClaimedInCurrentISTCycle(
  lastClaim: number | string | Date | null | undefined,
  currentTimestamp: number | string | Date = Date.now()
): boolean {
  if (lastClaim === null || lastClaim === undefined) return false;

  const currentMs = typeof currentTimestamp === 'number'
    ? currentTimestamp
    : currentTimestamp instanceof Date
      ? currentTimestamp.getTime()
      : new Date(currentTimestamp).getTime();
  const currentCycleId = getCycleIdFromUtcMs(currentMs);

  // If lastClaim is already a direct cycle epoch (e.g. 20714)
  if (typeof lastClaim === 'number' && lastClaim > 0 && lastClaim < 1000000) {
    return lastClaim === currentCycleId;
  }
  if (typeof lastClaim === 'string' && /^\d{1,7}$/.test(lastClaim.trim())) {
    const num = parseInt(lastClaim.trim(), 10);
    if (num > 0 && num < 1000000) return num === currentCycleId;
  }

  const lastMs = typeof lastClaim === 'number'
    ? lastClaim
    : lastClaim instanceof Date
      ? lastClaim.getTime()
      : new Date(lastClaim).getTime();

  if (isNaN(lastMs) || lastMs <= 0) return false;
  const lastCycleId = getCycleIdFromUtcMs(lastMs);
  return lastCycleId === currentCycleId;
}

/**
 * Formats a date/timestamp strictly in Indian Standard Time (IST) using en-IN locale and Asia/Kolkata timezone.
 */
export function formatISTTimestamp(dateInput: Date | number | string | undefined | null): string {
  if (!dateInput) return '';
  let date: Date;
  if (dateInput instanceof Date) {
    date = dateInput;
  } else if (typeof dateInput === 'number') {
    date = new Date(dateInput);
  } else {
    let str = String(dateInput).trim();
    if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}(:\d{2})?/.test(str)) {
      str = str.replace(' ', 'T');
      if (!str.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(str)) {
        str += 'Z';
      }
    } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(str)) {
      str += 'Z';
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      str += 'T00:00:00Z';
    }
    date = new Date(str);
  }
  const validDate = isNaN(date.getTime()) ? new Date() : date;
  return validDate.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: true,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Returns current timestamp string in IST.
 */
export function getISTNowString(): string {
  return formatISTTimestamp(Date.now());
}


