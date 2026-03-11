import { motion } from "framer-motion";
import { Heart, Sun, Utensils, BookOpen, Star, Users, Coffee, Monitor, type LucideIcon } from "lucide-react";

interface Section {
  icon: LucideIcon;
  cssColor: string;
  title: string;
  content: string;
}

const sections: Section[] = [
  {
    icon: Sun,
    cssColor: "var(--color-sketch-sun)",
    title: "שגרה בחוסר שגרה - ולמה זה חשוב עכשיו",
    content: `בתקופות של חוסר ודאות, הילדים חווים עומס רגשי גם אם הם לא תמיד מדברים עליו.
שגרה קבועה וברורה יוצרת תחושת ביטחון. היא לא מבטלת את המציאות אבל היא מחזירה לילד תחושה של שליטה.

כשיש מבנה שחוזר על עצמו לאורך היום, הילד יודע למה לצפות.
וכשהוא שותף בבחירה — הוא מרגיש מסוגל.

המטרה איננה למלא כל רגע.
המטרה היא לייצר עוגנים בתוך היום.`,
  },
  {
    icon: Utensils,
    cssColor: "var(--color-sketch-coral)",
    title: "הארוחות — העוגנים המרכזיים של היום",
    content: `ארוחות מסודרות הן העוגן החשוב ביותר בשגרה.
הן מחלקות את היום לחלקים ברורים, יוצרות סדר פנימי ומפחיתות תחושת כאוס.

נסו ככל האפשר:
• לשמור על שלוש ארוחות קבועות ביום
• להימנע מדילוג על ארוחות
• לצמצם נשנושים לא מתוכננים

סדר בארוחות עוזר לילדים להרגיש מאורגנים גם מבפנים.

מומלץ לשתף את הילדים בהכנת הארוחות — שטיפת ירקות, ערבוב, סידור שולחן.
מעורבות יוצרת חיבור, אחריות ותחושת מסוגלות.`,
  },
  {
    icon: BookOpen,
    cssColor: "var(--color-sketch-sky)",
    title: "איך עובדים עם האפליקציה?",
    content: `1. יושבים יחד וממלאים את המאגרים
לפני שמתחילים להשתמש בלוח, שבו עם הילדים והכינו יחד את המאגרים:
• מה אני יכול/ה לעשות לבד?
• מה אנחנו יכולים לעשות ביחד?
• מה מרגיע אותי?
• מה נעים לי בגוף?

אפשר לחשוב לפי מרחבים:
• תנועה במרפסת
• משחק בחדר הילדים
• יצירה בסלון
• אפייה או הכנה פשוטה במטבח
• פינה שקטה לקריאה או מנוחה

ככל שהילד שותף לחשיבה — כך שיתוף הפעולה יגדל.`,
  },
  {
    icon: Users,
    cssColor: "var(--color-sketch-mint)",
    title: "מה מתאים ללא נוכחות הורית?",
    content: `חשוב להגדיר מראש פעילויות שילד יכול לבצע בעצמו בבטחה, בהתאם לגיל:
• ציור ויצירה חופשית
• משחק קופסה
• בנייה
• קריאה
• האזנה לסיפור
• סידור פינה אישית

הגדרה מראש מאפשרת רגיעה בזמן אמת.`,
  },
  {
    icon: Monitor,
    cssColor: "var(--color-sketch-charcoal)",
    title: "זמן מסך",
    content: `אחד האתגרים המרכזיים של הורים כיום הוא ההתמודדות עם זמן המסך של הילדים. דרך יעילה להתמודד עם הנושא היא לשבת עם הילדים, לדבר איתם ולהחליט יחד מה מתאים ומה לא לראות במסך, תוך הגדרת גבולות ברורים. במקביל מומלץ לעודד גם צפייה ועיסוק בתכנים מעשירים במסך.

במקביל, ליצור מגוון פעילויות אחרות שהילד נהנה מהן לבד ועם אחרים. כאשר לילד יש פעילויות מעניינות ללא מסך, נוצר איזון טבעי יותר ללא הגבלת משך הזמן ומאבקים מתמשכים.`,
  },
  {
    icon: Star,
    cssColor: "var(--color-sketch-lavender)",
    title: "תכנון יומי וחיזוק",
    content: `בכל ערב או בוקר — מתכננים את היום שמגיע.
בוחרים יחד את הפעילויות מתוך המאגרים (או מוסיפים רעיונות חדשים).
כותבים אותן בדף "היום שלי".

המבנה נשאר קבוע. רק התוכן משתנה.

הילד לא צריך "להצליח מושלם".
מספיק שעמד בחלקים מהיום.
חזקו אותו על:
• עמידה במסגרת
• חזרה לפעילות אחרי קושי
• שיתוף פעולה
• בחירה עצמאית

משפטים פשוטים כמו "ראיתי שהתאמצת" או "היה לך קשה ובכל זאת המשכת" — מחזקים תחושת מסוגלות.`,
  },
  {
    icon: Coffee,
    cssColor: "var(--color-sketch-peach)",
    title: "וגם לכם, ההורים",
    content: `כדי להחזיק את השגרה, חשוב שתדאגו גם לעצמכם.
נסו לקחת במהלך היום רגע קטן של מנוחה:
• קפה בשקט, בלי מסך
• כמה דקות תנועה
• נשימה ליד חלון פתוח

כשאנחנו מתמלאים — אפילו מעט — יש לנו יותר כוח להחזיק את הילדים.`,
  },
];

export default function ParentInfo() {
  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-hand font-bold">מדריך להורים</h1>
        <p className="text-muted-foreground mt-1 font-sans text-sm">
          חני ציק M.A — מנתחת התנהגות
        </p>
      </div>

      <div className="space-y-6">
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="sketch-card p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-lg border-2 border-dashed flex items-center justify-center shrink-0"
                  style={{
                    borderColor: section.cssColor,
                    backgroundColor: `color-mix(in oklch, ${section.cssColor} 15%, transparent)`,
                  }}
                >
                  <Icon size={20} style={{ color: section.cssColor }} />
                </div>
                <h2 className="font-hand text-xl font-bold flex-1">{section.title}</h2>
              </div>
              <div className="text-foreground/80 whitespace-pre-line leading-relaxed font-sans text-[15px]">
                {section.content}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <div className="sketch-card p-4 inline-block">
          <Heart className="w-6 h-6 mx-auto text-sketch-coral mb-2" />
          <p className="font-hand text-lg font-bold">בהצלחה רבה!</p>
          <p className="text-sm text-muted-foreground">חני ציק M.A — מנתחת התנהגות</p>
        </div>
      </div>
    </div>
  );
}
