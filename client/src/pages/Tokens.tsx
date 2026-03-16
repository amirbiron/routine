import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Star, Trophy, Sparkles } from "lucide-react";
import { Celebration } from "@/components/Celebration";
import { getTodayIsrael } from "@shared/dateUtils";
import { useActiveChild } from "@/contexts/ChildContext";

export default function Tokens() {
  const [date] = useState(getTodayIsrael);
  const utils = trpc.useUtils();
  const { activeChildId } = useActiveChild();
  const { data: balanceData } = trpc.tokens.balance.useQuery({ childId: activeChildId });
  const { data: history = [] } = trpc.tokens.history.useQuery({ limit: 20, childId: activeChildId });
  const { data: schedule } = trpc.schedule.get.useQuery({ date, childId: activeChildId });

  const [celebrating, setCelebrating] = useState(false);
  const [lastTokensEarned, setLastTokensEarned] = useState(0);

  const awardMutation = trpc.tokens.award.useMutation({
    onSuccess: () => {
      utils.tokens.balance.invalidate();
      utils.tokens.history.invalidate();
      setCelebrating(true);
    },
  });

  const scheduleItems = (schedule?.items as any[]) || [];
  const completedCount = scheduleItems.filter((i: any) => i.completed).length;
  const totalCount = scheduleItems.length;
  const canAward = totalCount > 0 && completedCount > 0;

  const handleAward = async () => {
    const tokensEarned = completedCount >= totalCount ? 3 : completedCount >= totalCount / 2 ? 2 : 1;
    setLastTokensEarned(tokensEarned);
    const reason = completedCount >= totalCount
      ? "!השלמת את כל סדר היום"
      : `השלמת ${completedCount} מתוך ${totalCount} פעילויות`;

    const result = await awardMutation.mutateAsync({
      amount: tokensEarned,
      reason,
      date,
      childId: activeChildId,
    });
    if (result.alreadyAwarded) {
      toast.error("כבר קיבלת אסימונים היום!");
      return;
    }
    toast.success(`!קיבלת ${tokensEarned} אסימונים`);
  };

  const closeCelebration = useCallback(() => setCelebrating(false), []);

  const balance = balanceData?.balance ?? 0;

  // Milestone messages
  const getMilestoneMessage = (balance: number) => {
    if (balance >= 50) return "אלוף/ה! 50 אסימונים!";
    if (balance >= 30) return "מדהים! 30 אסימונים!";
    if (balance >= 20) return "כוכב! 20 אסימונים!";
    if (balance >= 10) return "10 אסימונים! יופי!";
    if (balance >= 5) return "5 אסימונים ראשונים!";
    return null;
  };

  const milestone = getMilestoneMessage(balance);

  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      <Celebration
        show={celebrating}
        onClose={closeCelebration}
        title="!כל הכבוד"
        subtitle="קיבלת אסימון חדש!"
        emoji="🏆"
        tokensEarned={lastTokensEarned}
      />

      {/* Balance display */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-hand font-bold mb-4">האסימונים שלי</h1>
        <motion.div
          className="sketch-card p-6 inline-block"
          whileHover={{ rotate: -2 }}
        >
          <div className="flex items-center gap-3 justify-center">
            <Star className="w-10 h-10 text-sketch-sun fill-sketch-sun" />
            <span className="text-5xl font-hand font-bold">{balance}</span>
          </div>
          <p className="text-muted-foreground mt-2 font-sans text-sm">אסימונים שנאספו</p>
          {milestone && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sketch-sun font-hand text-sm font-bold mt-1"
            >
              {milestone}
            </motion.p>
          )}
        </motion.div>
      </div>

      {/* Today's progress */}
      {totalCount > 0 && (
        <div className="sketch-card p-5 mb-6">
          <h2 className="font-hand text-xl font-bold mb-3 flex items-center gap-2">
            <Trophy size={20} className="text-sketch-sun" />
            ההתקדמות של היום
          </h2>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-3 flex-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-sketch-mint rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(completedCount / totalCount) * 100}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
            <span className="font-mono text-sm">{completedCount}/{totalCount}</span>
          </div>

          {canAward && (
            <Button
              onClick={handleAward}
              disabled={awardMutation.isPending}
              className="w-full sketch-btn bg-sketch-sun text-sketch-charcoal border-sketch-charcoal font-hand text-lg"
            >
              <Sparkles size={18} />
              {awardMutation.isPending ? "...מעניק" : "!קבל אסימונים"}
            </Button>
          )}

          {totalCount > 0 && completedCount === 0 && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              סמנו פעילויות שהושלמו בסדר היום כדי לקבל אסימונים
            </p>
          )}
        </div>
      )}

      {/* Token history */}
      <div>
        <h2 className="font-hand text-xl font-bold mb-3">היסטוריה</h2>
        {history.length === 0 ? (
          <div className="sketch-card p-6 text-center">
            <Star className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground font-sans">עוד אין אסימונים. השלימו פעילויות כדי לצבור!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((event: any) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="sketch-card p-3 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-sketch-sun/20 flex items-center justify-center shrink-0">
                  <Star size={16} className="text-sketch-sun fill-sketch-sun" />
                </div>
                <div className="flex-1">
                  <p className="font-sans text-sm">{event.reason}</p>
                  <p className="text-xs text-muted-foreground font-mono">{event.date}</p>
                </div>
                <span className="font-hand text-lg font-bold text-sketch-sun">+{event.amount}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
