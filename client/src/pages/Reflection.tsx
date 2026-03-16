import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MOOD_OPTIONS, type Mood } from "@shared/types";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { getTodayIsrael } from "@shared/dateUtils";
import { useActiveChild } from "@/contexts/ChildContext";

const QUESTIONS = [
  { key: "mood", label: "?איך היה היום", type: "mood" },
  { key: "enjoyedMost", label: "?ממה הכי נהנית היום", type: "text" },
  { key: "hardest", label: "?מה היה לך קשה", type: "text" },
  { key: "whatHelped", label: "?מה עזר לך", type: "text" },
  { key: "tomorrowWish", label: "?מה אתה הכי רוצה שיקרה מחר", type: "text" },
] as const;

export default function Reflection() {
  const [date] = useState(getTodayIsrael);
  const { activeChildId } = useActiveChild();
  const { data: existingReflection, isLoading } = trpc.reflection.get.useQuery({ date, childId: activeChildId });
  // שמירת ה-childId שעבורו נשלחה המוטציה — רק אם עדיין פעיל, מסמנים submitted
  const submittedForChildRef = useRef<number | undefined>(undefined);
  const saveMutation = trpc.reflection.save.useMutation({
    onSuccess: () => {
      if (submittedForChildRef.current === activeChildId) {
        toast.success("הרפלקציה נשמרה! כל הכבוד!");
        setSubmitted(true);
      }
    },
  });

  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({
    mood: "",
    enjoyedMost: "",
    hardest: "",
    whatHelped: "",
    tomorrowWish: "",
  });

  // איפוס state בעת החלפת ילד פעיל
  const prevChildIdRef = useRef(activeChildId);
  useEffect(() => {
    if (prevChildIdRef.current !== activeChildId) {
      prevChildIdRef.current = activeChildId;
      setSubmitted(false);
      setStep(0);
      setAnswers({ mood: "", enjoyedMost: "", hardest: "", whatHelped: "", tomorrowWish: "" });
    }
  }, [activeChildId]);

  const currentQ = QUESTIONS[step];
  const isLastStep = step === QUESTIONS.length - 1;

  const handleNext = () => {
    if (!isLastStep) setStep(step + 1);
  };
  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    submittedForChildRef.current = activeChildId;
    await saveMutation.mutateAsync({
      date,
      childId: activeChildId,
      mood: (answers.mood as Mood) || undefined,
      enjoyedMost: answers.enjoyedMost || undefined,
      hardest: answers.hardest || undefined,
      whatHelped: answers.whatHelped || undefined,
      tomorrowWish: answers.tomorrowWish || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[60vh]">
        <div className="sketch-card p-8 animate-pulse w-full max-w-md">
          <div className="h-8 bg-muted rounded w-2/3 mx-auto mb-4" />
          <div className="h-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (existingReflection || submitted) {
    const ref = existingReflection || answers;
    return (
      <div className="p-4 pb-24 max-w-md mx-auto">
        <div className="text-center mb-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-6xl mb-4">
            {MOOD_OPTIONS.find(m => m.value === (ref as any).mood)?.emoji || "🌟"}
          </motion.div>
          <h1 className="text-3xl font-hand font-bold">!כל הכבוד</h1>
          <p className="text-muted-foreground mt-1">הרפלקציה של היום נשמרה</p>
        </div>

        <div className="space-y-4">
          {QUESTIONS.filter(q => q.type === "text").map(q => {
            const answer = (ref as any)[q.key];
            if (!answer) return null;
            return (
              <motion.div
                key={q.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="sketch-card p-4"
              >
                <p className="font-hand text-lg font-bold mb-1">{q.label}</p>
                <p className="text-foreground/80 notebook-lines">{answer}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 max-w-md mx-auto flex flex-col min-h-[70vh] justify-center">
      {/* Step indicator */}
      <div className="flex justify-center gap-2 mb-8">
        {QUESTIONS.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full border-2 transition-all ${
              i === step
                ? "bg-sketch-lavender border-sketch-lavender scale-125"
                : i < step
                ? "bg-sketch-mint border-sketch-mint"
                : "bg-transparent border-foreground/30"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
          className="sketch-card p-6"
        >
          {/* Decorative corners */}
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-foreground/20 rounded-tr-sm" />
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-foreground/20 rounded-tl-sm" />

          <h2 className="text-2xl sm:text-3xl font-hand font-bold text-center mb-6">
            {currentQ.label}
          </h2>

          {currentQ.type === "mood" ? (
            <div className="flex flex-wrap justify-center gap-3">
              {MOOD_OPTIONS.map(mood => (
                <button
                  key={mood.value}
                  onClick={() => setAnswers({ ...answers, mood: mood.value })}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 border-dashed transition-all min-w-[70px] ${
                    answers.mood === mood.value
                      ? "border-sketch-lavender bg-sketch-lavender/10 scale-110"
                      : "border-foreground/20 hover:border-foreground/40"
                  }`}
                >
                  <span className="text-3xl">{mood.emoji}</span>
                  <span className="text-xs font-sans">{mood.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <Textarea
              value={answers[currentQ.key] || ""}
              onChange={(e) => setAnswers({ ...answers, [currentQ.key]: e.target.value })}
              placeholder="כתוב כאן..."
              className="border-2 border-dashed min-h-[120px] text-lg notebook-lines resize-none bg-transparent"
              dir="rtl"
              autoFocus
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={step === 0}
          className="font-hand text-lg"
        >
          <ChevronRight size={20} />
          חזרה
        </Button>

        {isLastStep ? (
          <Button
            onClick={handleSubmit}
            disabled={saveMutation.isPending}
            className="sketch-btn bg-sketch-lavender text-white border-sketch-charcoal font-hand text-lg"
          >
            <Sparkles size={18} />
            {saveMutation.isPending ? "שומר..." : "!סיימתי"}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            className="sketch-btn bg-sketch-sky text-white border-sketch-charcoal font-hand text-lg"
          >
            הבא
            <ChevronLeft size={20} />
          </Button>
        )}
      </div>
    </div>
  );
}
