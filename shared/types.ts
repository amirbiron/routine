/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

// ─── App-specific types ──────────────────────────────────────

export type ActivityCategory = "solo" | "social" | "movement" | "screens";
export type Mood = "great" | "good" | "okay" | "hard" | "tough";
export type ScheduleSection = "morning" | "afternoon" | "evening";

export interface ScheduleItem {
  activityId: number;
  title: string;
  icon: string;
  color: string;
  section: ScheduleSection;
  completed: boolean;
  order: number;
}

export const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  solo: "פעילויות שאני עושה עם עצמי",
  social: "פעילויות שאני עושה עם המשפחה/חברים",
  movement: "פעילות בתנועה",
  screens: "פעילות עם מסכים",
};

export const CATEGORY_ICONS: Record<ActivityCategory, string> = {
  solo: "user",
  social: "users",
  movement: "zap",
  screens: "monitor",
};

export const SECTION_LABELS: Record<ScheduleSection, string> = {
  morning: "ארוחת בוקר",
  afternoon: "ארוחת צהריים",
  evening: "ארוחת ערב",
};

export const SECTION_ICONS: Record<ScheduleSection, string> = {
  morning: "sunrise",
  afternoon: "sun",
  evening: "moon",
};

export const SECTION_COLORS: Record<ScheduleSection, string> = {
  morning: "#e8c96b",
  afternoon: "#e8846b",
  evening: "#a86be8",
};

export const COLOR_MAP: Record<string, string> = {
  coral: "#e8846b",
  sky: "#6ba8e8",
  mint: "#6bc9a8",
  sun: "#e8c96b",
  lavender: "#a86be8",
  peach: "#e8a86b",
};

export const MOOD_OPTIONS: { value: Mood; label: string; emoji: string }[] = [
  { value: "great", label: "מעולה!", emoji: "🌟" },
  { value: "good", label: "טוב", emoji: "😊" },
  { value: "okay", label: "בסדר", emoji: "🙂" },
  { value: "hard", label: "קשה", emoji: "😔" },
  { value: "tough", label: "קשה מאוד", emoji: "😢" },
];

export const ICON_OPTIONS = [
  "star", "heart", "sun", "moon", "cloud", "music", "book", "palette",
  "puzzle", "blocks", "headphones", "home", "cookie", "gamepad",
  "scissors", "wind", "footprints", "stretch", "sunrise", "utensils", "zap", "user", "users",
  "monitor", "tv", "smartphone", "tablet",
];

export const SECTIONS_ORDER: ScheduleSection[] = ["morning", "afternoon", "evening"];
