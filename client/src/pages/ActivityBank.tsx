import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ActivityIcon } from "@/components/ActivityIcon";
import { CATEGORY_LABELS, COLOR_MAP, ICON_OPTIONS, type ActivityCategory } from "@shared/types";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useActiveChild } from "@/contexts/ChildContext";

const CATEGORIES: ActivityCategory[] = ["solo", "social", "movement", "screens"];
const COLORS = Object.keys(COLOR_MAP);

export default function ActivityBank() {
  const utils = trpc.useUtils();
  const { activeChildId } = useActiveChild();
  const { data: activities = [], isLoading } = trpc.activities.list.useQuery({ childId: activeChildId });
  const seedMutation = trpc.activities.seedDefaults.useMutation({
    onSuccess: (result) => {
      if (result.seeded) utils.activities.list.invalidate();
    },
  });
  const createMutation = trpc.activities.create.useMutation({
    onSuccess: () => { utils.activities.list.invalidate(); toast.success("הפעילות נוספה!"); },
  });
  const updateMutation = trpc.activities.update.useMutation({
    onSuccess: () => { utils.activities.list.invalidate(); toast.success("הפעילות עודכנה!"); },
  });
  const deleteMutation = trpc.activities.delete.useMutation({
    onSuccess: () => { utils.activities.list.invalidate(); toast.success("הפעילות נמחקה"); },
  });

  // Auto-seed defaults if user has no default activities
  const [seedAttempted, setSeedAttempted] = useState(false);
  if (!isLoading && !seedAttempted && activities.length === 0) {
    setSeedAttempted(true);
    try {
      seedMutation.mutate({ childId: activeChildId });
    } catch (e) {
      console.error("Failed to seed defaults:", e);
    }
  }

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", icon: "star", color: "coral", category: "solo" as ActivityCategory });

  const openCreate = () => {
    setEditingId(null);
    setForm({ title: "", icon: "star", color: "coral", category: "solo" });
    setDialogOpen(true);
  };

  const openEdit = (activity: any) => {
    setEditingId(activity.id);
    setForm({ title: activity.title, icon: activity.icon, color: activity.color, category: activity.category });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, ...form });
    } else {
      await createMutation.mutateAsync({ ...form, childId: activeChildId });
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync({ id });
  };

  const groupedActivities = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = activities.filter((a: any) => a.category === cat);
    return acc;
  }, {} as Record<ActivityCategory, any[]>);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="sketch-card p-4 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-3" />
            <div className="flex gap-2">
              <div className="h-10 bg-muted rounded w-24" />
              <div className="h-10 bg-muted rounded w-28" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-hand font-bold">המאגרים שלי</h1>
        <p className="text-muted-foreground mt-1">בחרו ביחד את הפעילויות שמתאימות לכם</p>
      </div>

      {CATEGORIES.map(cat => {
        const items = groupedActivities[cat] || [];

        return (
          <div key={cat} className="mb-6">
            <h2 className="text-lg font-hand font-bold mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full border-2 border-dashed border-foreground/30 flex items-center justify-center text-xs">
                {items.length}
              </span>
              {CATEGORY_LABELS[cat]}
            </h2>
            <div className="space-y-2">
              <AnimatePresence>
                {items.map((activity: any) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="sketch-card p-3 flex items-center gap-3"
                  >
                    <div
                      className="w-10 h-10 rounded-lg border-2 border-dashed flex items-center justify-center shrink-0"
                      style={{ borderColor: COLOR_MAP[activity.color], backgroundColor: COLOR_MAP[activity.color] + "20" }}
                    >
                      <ActivityIcon icon={activity.icon} color={COLOR_MAP[activity.color]} size={20} />
                    </div>
                    <span className="flex-1 font-sans text-base">{activity.title}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(activity)}>
                        <Pencil size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(activity.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {items.length === 0 && (
                <div className="sketch-card p-3 text-center text-muted-foreground text-sm border-dashed">
                  אין פעילויות עדיין. לחצו + להוספה
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Add button */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
        <Button
          onClick={openCreate}
          className="sketch-btn bg-sketch-coral text-white border-sketch-charcoal rounded-full h-14 w-14 p-0 shadow-lg"
        >
          <Plus size={28} />
        </Button>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sketch-card border-2 border-dashed max-w-sm mx-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-hand text-2xl">
              {editingId ? "עריכת פעילות" : "פעילות חדשה"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="שם הפעילות..."
              className="border-2 border-dashed text-lg h-12"
              dir="rtl"
              autoFocus
            />

            {/* Category picker */}
            <div>
              <label className="text-sm font-bold text-muted-foreground mb-2 block">קטגוריה</label>
              <div className="flex flex-col gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setForm({ ...form, category: cat })}
                    className={`px-3 py-2 rounded-lg border-2 border-dashed text-sm font-sans transition-all text-right ${
                      form.category === cat
                        ? "border-sketch-coral bg-sketch-coral/10 font-bold"
                        : "border-foreground/20 hover:border-foreground/40"
                    }`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div>
              <label className="text-sm font-bold text-muted-foreground mb-2 block">צבע</label>
              <div className="flex gap-3">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      form.color === c ? "border-foreground scale-125 shadow-md" : "border-transparent"
                    }`}
                    style={{ backgroundColor: COLOR_MAP[c] }}
                  />
                ))}
              </div>
            </div>

            {/* Icon picker */}
            <div>
              <label className="text-sm font-bold text-muted-foreground mb-2 block">אייקון</label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map(ic => (
                  <button
                    key={ic}
                    onClick={() => setForm({ ...form, icon: ic })}
                    className={`w-10 h-10 rounded-lg border-2 border-dashed flex items-center justify-center transition-all ${
                      form.icon === ic
                        ? "border-sketch-coral bg-sketch-coral/10 scale-110"
                        : "border-foreground/20 hover:border-foreground/40"
                    }`}
                  >
                    <ActivityIcon icon={ic} color={form.icon === ic ? COLOR_MAP[form.color] : undefined} size={18} />
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={!form.title.trim() || createMutation.isPending || updateMutation.isPending}
              className="w-full sketch-btn bg-sketch-coral text-white border-sketch-charcoal font-hand text-lg h-12"
            >
              {editingId ? "שמור שינויים" : "הוסף פעילות"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
