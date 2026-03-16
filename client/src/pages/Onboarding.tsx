import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useActiveChild } from "@/contexts/ChildContext";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  {
    title: "שלום ילד יקר!",
    subtitle: "איך קוראים לך?",
    showInput: true,
  },
  {
    title: "ברוך הבא!",
    content: "כאן אתה יכול להיות המארגן של היום שלך.\nאתה יכול לבחור פעילויות שאתה עושה לבד, עם המשפחה, בתנועה, או עם מסכים.",
  },
  {
    title: "למה סדר יום?",
    content: "כשאנחנו מתכננים את היום שלנו מראש, אנחנו מרגישים יותר רגועים.\nאנחנו יודעים מה צפוי לנו, יש מקום לדברים כיפיים, וגם יותר קל לעבור מדבר לדבר.",
  },
  {
    title: "גם בלי בית ספר",
    content: "אפילו כשלא הולכים לבית הספר או לגן, סדר יום קטן יכול לעזור ליום להיות נעים, ברור וכיפי יותר.\n\nאנחנו נחלק את היום לשלושה חלקים: בוקר, צהריים וערב — ואתם תגררו פעילויות לכל חלק!",
  },
  {
    title: "רגע חשוב!",
    content: "עכשיו כדאי לך לקרוא לאמא או אבא ולהראות להם את מה שכתוב פה.\nביחד תמלאו את המאגרים של הפעילויות שלכם!",
    isParentStep: true,
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [childName, setChildName] = useState("");
  const [createdChildId, setCreatedChildId] = useState<number | null>(null);

  const updateProfile = trpc.profile.update.useMutation();
  const createChild = trpc.children.create.useMutation();
  const seedActivities = trpc.activities.seedDefaults.useMutation();
  const { refetch } = useActiveChild();

  const handleNext = async () => {
    try {
      if (step === 0 && childName.trim() && createdChildId === null) {
        // יצירת רשומת ילד — שלב קריטי, בלעדיו האפליקציה לא תעבוד
        await updateProfile.mutateAsync({ childName: childName.trim() });
        const result = await createChild.mutateAsync({ name: childName.trim() });
        if (result.id) {
          setCreatedChildId(result.id);
          await seedActivities.mutateAsync({ childId: result.id });
        }
      }
      if (step < STEPS.length - 1) {
        setStep(step + 1);
      } else {
        await updateProfile.mutateAsync({ onboardingDone: true });
        refetch();
        onComplete();
      }
    } catch (error) {
      console.error("Onboarding error:", error);
      // שלב 0 — יצירת ילד הכרחית, אסור להתקדם בלעדיה
      if (step === 0) {
        toast.error("שגיאה ביצירת הפרופיל, נסו שוב");
        return;
      }
      if (step < STEPS.length - 1) {
        setStep(step + 1);
      } else {
        onComplete();
      }
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const currentStep = STEPS[step];
  const canProceed = step === 0 ? childName.trim().length > 0 : true;

  return (
    <div className="min-h-screen paper-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="sketch-card p-6 sm:p-8"
          >
            {/* Decorative corner marks */}
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-foreground/30 rounded-tr-sm" />
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-foreground/30 rounded-tl-sm" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-foreground/30 rounded-br-sm" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-foreground/30 rounded-bl-sm" />

            {/* Step indicator */}
            <div className="flex justify-center gap-2 mb-6">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full border-2 transition-all ${
                    i === step
                      ? "bg-sketch-coral border-sketch-coral scale-125"
                      : i < step
                      ? "bg-sketch-mint border-sketch-mint"
                      : "bg-transparent border-foreground/30"
                  }`}
                />
              ))}
            </div>

            {/* Content */}
            <div className="text-center space-y-4">
              <h2 className="text-3xl sm:text-4xl font-hand font-bold text-foreground">
                {currentStep.title}
              </h2>

              {currentStep.subtitle && (
                <p className="text-xl font-hand text-foreground/70">{currentStep.subtitle}</p>
              )}

              {currentStep.showInput && (
                <div className="mt-6">
                  <Input
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="השם שלי..."
                    className="text-center text-xl font-hand border-2 border-dashed border-foreground/30 bg-transparent h-14 text-foreground placeholder:text-muted-foreground"
                    autoFocus
                    dir="rtl"
                  />
                </div>
              )}

              {currentStep.content && (
                <p className="text-lg leading-relaxed whitespace-pre-line text-foreground/80 font-sans">
                  {currentStep.content}
                </p>
              )}

              {currentStep.isParentStep && (
                <div className="mt-4 p-4 bg-sketch-sun/20 border-2 border-dashed border-sketch-sun rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="text-sketch-sun" size={20} />
                    <span className="font-hand text-xl font-bold">להורים</span>
                    <Sparkles className="text-sketch-sun" size={20} />
                  </div>
                  <p className="text-sm text-foreground/70">
                    בדף הבא תוכלו למלא ביחד את מאגר הפעילויות ב-4 קטגוריות:
                    פעילויות לבד, עם המשפחה, בתנועה, ועם מסכים.
                    אחר כך הילד/ה יוכל/ה לגרור פעילויות לסדר היום.
                  </p>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={step === 0}
                className="font-hand text-lg"
              >
                <ChevronRight size={20} />
                חזרה
              </Button>

              <Button
                onClick={handleNext}
                disabled={!canProceed || updateProfile.isPending || createChild.isPending || seedActivities.isPending}
                className="sketch-btn bg-sketch-coral text-white border-sketch-charcoal font-hand text-lg"
              >
                {step === STEPS.length - 1 ? "!יאללה, נתחיל" : "הבא"}
                <ChevronLeft size={20} />
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Decorative doodles */}
        <div className="mt-8 flex justify-center gap-4 opacity-30">
          <svg width="40" height="40" viewBox="0 0 40 40" className="animate-wiggle">
            <circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
          </svg>
          <svg width="40" height="40" viewBox="0 0 40 40" style={{ animationDelay: "0.2s" }} className="animate-wiggle">
            <rect x="5" y="5" width="30" height="30" rx="3" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" transform="rotate(5 20 20)" />
          </svg>
          <svg width="40" height="40" viewBox="0 0 40 40" style={{ animationDelay: "0.4s" }} className="animate-wiggle">
            <polygon points="20,5 35,35 5,35" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
          </svg>
        </div>
      </div>
    </div>
  );
}
