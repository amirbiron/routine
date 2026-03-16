import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useActiveChild } from "@/contexts/ChildContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { COLOR_MAP } from "@shared/types";
import { Plus, Pencil, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const AVATAR_COLORS = Object.keys(COLOR_MAP);

export default function ChildrenManager() {
  const utils = trpc.useUtils();
  const { children, activeChild, setActiveChildId, refetch } = useActiveChild();

  const createMutation = trpc.children.create.useMutation({
    onSuccess: () => {
      utils.children.list.invalidate();
      refetch();
      toast.success("הילד/ה נוסף/ה!");
    },
  });
  const updateMutation = trpc.children.update.useMutation({
    onSuccess: () => {
      utils.children.list.invalidate();
      refetch();
      toast.success("הפרטים עודכנו!");
    },
  });
  const deleteMutation = trpc.children.delete.useMutation({
    onSuccess: () => {
      utils.children.list.invalidate();
      refetch();
      toast.success("הילד/ה נמחק/ה");
    },
    onError: (err) => {
      toast.error(err.message || "שגיאה במחיקה");
    },
  });

  const seedMutation = trpc.activities.seedDefaults.useMutation({
    onSuccess: (result) => {
      if (result.seeded) {
        utils.activities.list.invalidate();
        toast.success("פעילויות ברירת מחדל נוספו!");
      }
    },
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", avatarColor: "coral" });

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: "", avatarColor: "coral" });
    setDialogOpen(true);
  };

  const openEdit = (child: { id: number; name: string; avatarColor: string }) => {
    setEditingId(child.id);
    setForm({ name: child.name, avatarColor: child.avatarColor });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, name: form.name.trim(), avatarColor: form.avatarColor });
    } else {
      const result = await createMutation.mutateAsync({ name: form.name.trim(), avatarColor: form.avatarColor });
      // seed פעילויות ברירת מחדל לילד החדש
      if (result.id) {
        await seedMutation.mutateAsync({ childId: result.id });
        setActiveChildId(result.id);
      }
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (children.length <= 1) {
      toast.error("לא ניתן למחוק את הילד האחרון");
      return;
    }
    await deleteMutation.mutateAsync({ id });
  };

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-hand font-bold">הילדים שלי</h1>
        <p className="text-muted-foreground mt-1">ניהול ילדים — ניתן ליצור לוח זמנים נפרד לכל ילד/ה</p>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {children.map((child) => {
            const color = COLOR_MAP[child.avatarColor] || COLOR_MAP.coral;
            const isActive = child.id === activeChild?.id;
            return (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`sketch-card p-4 flex items-center gap-3 ${isActive ? "ring-2 ring-sketch-coral ring-offset-2" : ""}`}
              >
                <div
                  className="w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center text-lg font-bold text-white shrink-0"
                  style={{ backgroundColor: color, borderColor: color }}
                >
                  {child.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-hand text-xl font-bold">{child.name}</p>
                  {isActive && (
                    <p className="text-xs text-sketch-coral font-sans flex items-center gap-1">
                      <Check size={12} /> פעיל/ה כרגע
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  {!isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-hand text-sm"
                      onClick={() => setActiveChildId(child.id)}
                    >
                      בחר
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(child)}>
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(child.id)}
                    disabled={children.length <= 1}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* כפתור הוספת ילד */}
      <div className="mt-6">
        <Button
          onClick={openCreate}
          className="w-full sketch-btn bg-sketch-mint text-white border-sketch-charcoal font-hand text-lg h-12"
        >
          <Plus size={20} />
          הוספת ילד/ה
        </Button>
      </div>

      {/* דיאלוג יצירה/עריכה */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sketch-card border-2 border-dashed max-w-sm mx-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-hand text-2xl">
              {editingId ? "עריכת פרטים" : "הוספת ילד/ה"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="שם הילד/ה..."
              className="border-2 border-dashed text-lg h-12"
              dir="rtl"
              autoFocus
            />

            {/* בחירת צבע אווטאר */}
            <div>
              <label className="text-sm font-bold text-muted-foreground mb-2 block">צבע</label>
              <div className="flex gap-3">
                {AVATAR_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, avatarColor: c })}
                    className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${
                      form.avatarColor === c ? "border-foreground scale-125 shadow-md" : "border-transparent"
                    }`}
                    style={{ backgroundColor: COLOR_MAP[c] }}
                  >
                    {form.avatarColor === c && <Check size={16} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={!form.name.trim() || createMutation.isPending || updateMutation.isPending}
              className="w-full sketch-btn bg-sketch-coral text-white border-sketch-charcoal font-hand text-lg h-12"
            >
              {editingId ? "שמור שינויים" : "הוסף ילד/ה"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
