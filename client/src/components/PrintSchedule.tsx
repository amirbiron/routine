import {
  type ScheduleItem,
  type ScheduleSection,
  COLOR_MAP,
  SECTION_LABELS,
  SECTION_COLORS,
  SECTIONS_ORDER,
} from "@shared/types";
import { formatDateHebrewFull } from "@shared/dateUtils";

interface PrintScheduleProps {
  items: ScheduleItem[];
  date: string;
  childName?: string;
}

export function PrintSchedule({ items, date, childName }: PrintScheduleProps) {
  const dateStr = formatDateHebrewFull(date);

  const itemsBySection: Record<ScheduleSection, ScheduleItem[]> = {
    morning: [],
    afternoon: [],
    evening: [],
  };
  for (const item of items) {
    const section = item.section || "morning";
    if (itemsBySection[section]) {
      itemsBySection[section].push(item);
    }
  }
  for (const section of SECTIONS_ORDER) {
    itemsBySection[section].sort((a, b) => a.order - b.order);
  }

  const sectionEmojis: Record<ScheduleSection, string> = {
    morning: "🌅",
    afternoon: "☀️",
    evening: "🌙",
  };

  return (
    <div className="hidden print:block p-6 bg-white text-black" dir="rtl">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-schedule, .print-schedule * { visibility: visible; }
          .print-schedule { position: absolute; top: 0; right: 0; left: 0; }
          @page { margin: 1cm; size: A4; }
        }
      `}</style>

      <div className="print-schedule">
        {/* Header */}
        <div className="text-center mb-4 border-b-2 border-dashed border-gray-400 pb-3">
          <h1 style={{ fontFamily: "Caveat, cursive", fontSize: "2rem", fontWeight: "bold" }}>
            היום שלי
          </h1>
          {childName && (
            <p style={{ fontFamily: "Caveat, cursive", fontSize: "1.3rem" }}>
              {childName}
            </p>
          )}
          <p className="text-gray-500 text-xs mt-1">{dateStr}</p>
        </div>

        {/* Three sections side by side */}
        <div style={{ display: "flex", gap: "12px" }}>
          {SECTIONS_ORDER.map(section => {
            const sectionItems = itemsBySection[section];
            return (
              <div key={section} style={{ flex: 1 }}>
                {/* Section header */}
                <div
                  className="text-center py-1 px-2 rounded-t-lg border-2 border-dashed"
                  style={{
                    borderColor: SECTION_COLORS[section],
                    backgroundColor: SECTION_COLORS[section] + "15",
                  }}
                >
                  <span className="text-lg">{sectionEmojis[section]}</span>
                  <p
                    style={{
                      fontFamily: "Caveat, cursive",
                      fontSize: "0.9rem",
                      fontWeight: "bold",
                      margin: 0,
                    }}
                  >
                    {section === "morning"
                      ? "בוקר"
                      : section === "afternoon"
                      ? "צהריים"
                      : "ערב"}
                  </p>
                </div>

                {/* Section items */}
                <div
                  className="border-2 border-dashed border-t-0 rounded-b-lg p-1"
                  style={{
                    borderColor: SECTION_COLORS[section] + "80",
                    minHeight: "120px",
                  }}
                >
                  {sectionItems.length === 0 ? (
                    <div className="text-center text-gray-300 text-xs py-4">—</div>
                  ) : (
                    sectionItems.map((item, index) => (
                      <div
                        key={item.activityId}
                        className="flex items-center gap-1.5 p-1.5 border-b border-gray-200 last:border-b-0"
                      >
                        {/* Checkbox */}
                        <div className="w-4 h-4 border-2 border-gray-400 rounded shrink-0" />

                        {/* Color dot */}
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: COLOR_MAP[item.color] || "#ccc" }}
                        />

                        {/* Title */}
                        <span style={{ fontSize: "0.75rem", flex: 1 }}>{item.title}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Reflection section */}
        <div className="mt-4 border-2 border-dashed border-gray-300 rounded-lg p-3">
          <h2
            style={{
              fontFamily: "Caveat, cursive",
              fontSize: "1.1rem",
              fontWeight: "bold",
              marginBottom: "0.5rem",
            }}
          >
            שיחת ערב
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {[
              "ממה הכי נהנתי היום?",
              "מה היה לי קשה?",
              "מה עזר לי?",
              "מה אני רוצה שיקרה מחר?",
            ].map((q, i) => (
              <div key={i}>
                <p style={{ fontWeight: "bold", fontSize: "0.7rem", marginBottom: "2px" }}>{q}</p>
                <div className="border-b border-gray-300 h-5" />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-400">
            שגרה בחוסר שגרה — עוגנים של שגרה בתוך האין-שגרה
          </p>
        </div>
      </div>
    </div>
  );
}
