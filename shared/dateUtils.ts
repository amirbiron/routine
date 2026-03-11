/**
 * Date utilities for Israel timezone (Asia/Jerusalem).
 * All date calculations in this app should use these helpers
 * to ensure the correct local date is used regardless of the user's
 * browser timezone or the server's UTC-based clock.
 */

const ISRAEL_TZ = "Asia/Jerusalem";

/**
 * Get today's date string (YYYY-MM-DD) in Israel timezone.
 * This ensures that after midnight in Israel, the date flips correctly
 * even if the browser or server is in a different timezone.
 */
export function getTodayIsrael(): string {
  const now = new Date();
  // Use Intl.DateTimeFormat to get the date parts in Israel timezone
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: ISRAEL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA locale formats as YYYY-MM-DD
  return formatter.format(now);
}

/**
 * Format a date string (YYYY-MM-DD) for display in Hebrew.
 * Returns a localized string like "יום שלישי, 11 במרץ".
 */
export function formatDateHebrew(dateStr: string): string {
  // Parse the YYYY-MM-DD string as a local date
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * Format a date string (YYYY-MM-DD) for print display in Hebrew.
 * Returns a localized string including the year.
 */
export function formatDateHebrewFull(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
