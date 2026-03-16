import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ActivityIcon } from "@/components/ActivityIcon";
import {
  COLOR_MAP,
  SECTION_LABELS,
  SECTION_COLORS,
  SECTIONS_ORDER,
  CATEGORY_LABELS,
  type ScheduleItem,
  type ScheduleSection,
  type ActivityCategory,
} from "@shared/types";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Save,
  Printer,
  ChevronDown,
  ChevronUp,
  Check,
  Sunrise,
  Sun,
  Moon,
  Plus,
  GripVertical,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { PrintSchedule } from "@/components/PrintSchedule";
import { Celebration } from "@/components/Celebration";
import { getTodayIsrael, formatDateHebrew } from "@shared/dateUtils";
import { useActiveChild } from "@/contexts/ChildContext";

const SECTION_ICON_MAP: Record<ScheduleSection, typeof Sunrise> = {
  morning: Sunrise,
  afternoon: Sun,
  evening: Moon,
};

// ─── Sortable Activity Item ──────────────────────────────────
function SortableItem({
  item,
  onToggle,
  onRemove,
}: {
  item: ScheduleItem;
  onToggle: (id: number) => void;
  onRemove: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `schedule-${item.activityId}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sketch-card p-3 flex items-center gap-3 ${item.completed ? "opacity-60" : ""}`}
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none p-1">
        <GripVertical size={16} className="text-muted-foreground" />
      </button>
      <button
        onClick={() => onToggle(item.activityId)}
        className={`w-7 h-7 rounded-md border-2 border-dashed flex items-center justify-center shrink-0 transition-all ${
          item.completed ? "bg-sketch-mint border-sketch-mint" : "border-foreground/30"
        }`}
      >
        {item.completed && <Check size={14} className="text-white" />}
      </button>
      <div
        className="w-8 h-8 rounded-lg border-2 border-dashed flex items-center justify-center shrink-0"
        style={{ borderColor: COLOR_MAP[item.color], backgroundColor: COLOR_MAP[item.color] + "20" }}
      >
        <ActivityIcon icon={item.icon} color={COLOR_MAP[item.color]} size={16} />
      </div>
      <span className={`flex-1 font-sans text-sm ${item.completed ? "line-through" : ""}`}>
        {item.title}
      </span>
      <button
        onClick={() => onRemove(item.activityId)}
        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Droppable Section ───────────────────────────────────────
function DroppableSection({
  section,
  items,
  onToggle,
  onRemove,
}: {
  section: ScheduleSection;
  items: ScheduleItem[];
  onToggle: (id: number) => void;
  onRemove: (id: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `section-${section}` });
  const SectionIcon = SECTION_ICON_MAP[section];
  const sectionColor = SECTION_COLORS[section];

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-8 h-8 rounded-lg border-2 border-dashed flex items-center justify-center"
          style={{ borderColor: sectionColor, backgroundColor: sectionColor + "20" }}
        >
          <SectionIcon size={16} style={{ color: sectionColor }} />
        </div>
        <h3 className="font-hand text-lg font-bold flex-1">{SECTION_LABELS[section]}</h3>
        <span className="text-xs text-muted-foreground font-mono">
          {items.filter(i => i.completed).length}/{items.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`min-h-[60px] rounded-xl border-2 border-dashed p-2 transition-colors space-y-2 ${
          isOver ? "border-sketch-coral bg-sketch-coral/5" : "border-foreground/10"
        }`}
      >
        <SortableContext items={items.map(i => `schedule-${i.activityId}`)} strategy={verticalListSortingStrategy}>
          {items.map(item => (
            <SortableItem key={item.activityId} item={item} onToggle={onToggle} onRemove={onRemove} />
          ))}
        </SortableContext>
        {items.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            גררו פעילויות לכאן
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Activity Bank Item ──────────────────────────────────────
function BankItem({
  activity,
  onAdd,
  isInSchedule,
}: {
  activity: any;
  onAdd: (activity: any) => void;
  isInSchedule: boolean;
}) {
  return (
    <button
      onClick={() => !isInSchedule && onAdd(activity)}
      disabled={isInSchedule}
      className={`sketch-card p-2 flex items-center gap-2 w-full text-right transition-all ${
        isInSchedule ? "opacity-40 cursor-not-allowed" : "hover:shadow-md active:scale-95"
      }`}
    >
      <div
        className="w-8 h-8 rounded-lg border-2 border-dashed flex items-center justify-center shrink-0"
        style={{ borderColor: COLOR_MAP[activity.color], backgroundColor: COLOR_MAP[activity.color] + "20" }}
      >
        <ActivityIcon icon={activity.icon} color={COLOR_MAP[activity.color]} size={14} />
      </div>
      <span className="flex-1 font-sans text-sm truncate">{activity.title}</span>
      {!isInSchedule && <Plus size={14} className="text-muted-foreground shrink-0" />}
    </button>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function ScheduleBuilder() {
  const [date] = useState(getTodayIsrael);
  const utils = trpc.useUtils();
  const { activeChildId } = useActiveChild();
  const { data: activities = [] } = trpc.activities.list.useQuery({ childId: activeChildId });
  const { data: existingSchedule, isLoading } = trpc.schedule.get.useQuery({ date, childId: activeChildId });
  const saveMutation = trpc.schedule.save.useMutation({
    onSuccess: () => {
      utils.schedule.get.invalidate();
      toast.success("סדר היום נשמר!");
    },
  });
  const toggleMutation = trpc.schedule.toggleItem.useMutation({
    onSuccess: (result) => {
      utils.schedule.get.invalidate();
      if (result.allCompleted) {
        setCelebrating(true);
      }
    },
  });

  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [bankOpen, setBankOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addToSection, setAddToSection] = useState<ScheduleSection | null>(null);
  const [celebrating, setCelebrating] = useState(false);

  // איפוס state בעת החלפת ילד פעיל
  const prevChildIdRef = useRef(activeChildId);
  useEffect(() => {
    if (prevChildIdRef.current !== activeChildId) {
      prevChildIdRef.current = activeChildId;
      setScheduleItems([]);
    }
  }, [activeChildId]);

  // אתחול מלוח זמנים קיים — רץ מחדש כשהנתונים מתעדכנים (כולל לאחר החלפת ילד)
  const scheduleKey = existingSchedule?.id ?? null;
  useEffect(() => {
    if (isLoading) return;
    if (existingSchedule?.items) {
      const items = existingSchedule.items as ScheduleItem[];
      const migratedItems = items.map((item, idx) => ({
        ...item,
        section: item.section || ("morning" as ScheduleSection),
        order: item.order ?? idx,
      }));
      setScheduleItems(migratedItems);
    } else {
      setScheduleItems([]);
    }
  }, [scheduleKey, isLoading]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const scheduleActivityIds = useMemo(
    () => new Set(scheduleItems.map(i => i.activityId)),
    [scheduleItems]
  );

  const itemsBySection = useMemo(() => {
    const result: Record<ScheduleSection, ScheduleItem[]> = {
      morning: [],
      afternoon: [],
      evening: [],
    };
    for (const item of scheduleItems) {
      const section = item.section || "morning";
      if (result[section]) {
        result[section].push(item);
      }
    }
    for (const section of SECTIONS_ORDER) {
      result[section].sort((a, b) => a.order - b.order);
    }
    return result;
  }, [scheduleItems]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    if (overIdStr.startsWith("section-")) {
      const targetSection = overIdStr.replace("section-", "") as ScheduleSection;
      const activeActivityId = parseInt(activeIdStr.replace("schedule-", ""));

      setScheduleItems(prev =>
        prev.map(i =>
          i.activityId === activeActivityId ? { ...i, section: targetSection } : i
        )
      );
      return;
    }

    if (activeIdStr.startsWith("schedule-") && overIdStr.startsWith("schedule-")) {
      const activeActivityId = parseInt(activeIdStr.replace("schedule-", ""));
      const overActivityId = parseInt(overIdStr.replace("schedule-", ""));

      setScheduleItems(prev => {
        const activeItem = prev.find(i => i.activityId === activeActivityId);
        const overItem = prev.find(i => i.activityId === overActivityId);
        if (!activeItem || !overItem) return prev;

        const newItems = prev.map(i =>
          i.activityId === activeActivityId ? { ...i, section: overItem.section } : i
        );

        const oldIndex = newItems.findIndex(i => i.activityId === activeActivityId);
        const newIndex = newItems.findIndex(i => i.activityId === overActivityId);
        return arrayMove(newItems, oldIndex, newIndex).map((item, idx) => ({
          ...item,
          order: idx,
        }));
      });
    }
  };

  const addActivity = useCallback((activity: any, section: ScheduleSection) => {
    if (scheduleActivityIds.has(activity.id)) return;
    const sectionItems = itemsBySection[section];
    const newItem: ScheduleItem = {
      activityId: activity.id,
      title: activity.title,
      icon: activity.icon,
      color: activity.color,
      section,
      completed: false,
      order: sectionItems.length,
    };
    setScheduleItems(prev => [...prev, newItem]);
  }, [scheduleActivityIds, itemsBySection]);

  const removeActivity = useCallback((activityId: number) => {
    setScheduleItems(prev => prev.filter(i => i.activityId !== activityId));
  }, []);

  const toggleActivity = useCallback((activityId: number) => {
    const item = scheduleItems.find(i => i.activityId === activityId);
    if (!item) return;

    if (existingSchedule) {
      toggleMutation.mutate({ date, childId: activeChildId, activityId, completed: !item.completed });
    }

    setScheduleItems(prev => {
      const updated = prev.map(i =>
        i.activityId === activityId ? { ...i, completed: !i.completed } : i
      );
      // Check if all completed after toggle
      if (updated.length > 0 && updated.every(i => i.completed)) {
        setTimeout(() => setCelebrating(true), 300);
      }
      return updated;
    });
  }, [scheduleItems, existingSchedule, date, activeChildId, toggleMutation]);

  const handleSave = async () => {
    const orderedItems = scheduleItems.map((item, idx) => ({ ...item, order: idx }));
    await saveMutation.mutateAsync({
      date,
      childId: activeChildId,
      items: orderedItems,
      isCompleted: orderedItems.every(i => i.completed),
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const closeCelebration = useCallback(() => setCelebrating(false), []);

  const dateStr = formatDateHebrew(date);

  const totalItems = scheduleItems.length;
  const completedItems = scheduleItems.filter(i => i.completed).length;

  const CATEGORIES: ActivityCategory[] = ["solo", "social", "movement", "screens"];
  const activitiesByCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = activities.filter((a: any) => a.category === cat);
    return acc;
  }, {} as Record<ActivityCategory, any[]>);

  if (isLoading) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <div className="sketch-card p-6 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/2 mx-auto mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Celebration
        show={celebrating}
        onClose={closeCelebration}
        title="!כל הכבוד"
        subtitle="השלמת את כל הפעילויות של היום!"
        emoji="🌟"
      />

      <div className="p-4 pb-24 max-w-lg mx-auto print:hidden">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-hand font-bold">היום שלי</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">{dateStr}</p>
        </div>

        {/* Progress bar */}
        {totalItems > 0 && (
          <div className="sketch-card p-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-3 flex-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-sketch-mint rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedItems / totalItems) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="font-mono text-sm text-muted-foreground">
                {completedItems}/{totalItems}
              </span>
            </div>
          </div>
        )}

        {/* Schedule sections with drag and drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {SECTIONS_ORDER.map(section => (
            <DroppableSection
              key={section}
              section={section}
              items={itemsBySection[section]}
              onToggle={toggleActivity}
              onRemove={removeActivity}
            />
          ))}

          <DragOverlay>
            {activeId && (() => {
              const activityId = parseInt(activeId.replace("schedule-", ""));
              const item = scheduleItems.find(i => i.activityId === activityId);
              if (!item) return null;
              return (
                <div className="sketch-card p-3 flex items-center gap-3 shadow-lg rotate-2">
                  <GripVertical size={16} className="text-muted-foreground" />
                  <div
                    className="w-8 h-8 rounded-lg border-2 border-dashed flex items-center justify-center"
                    style={{ borderColor: COLOR_MAP[item.color], backgroundColor: COLOR_MAP[item.color] + "20" }}
                  >
                    <ActivityIcon icon={item.icon} color={COLOR_MAP[item.color]} size={16} />
                  </div>
                  <span className="font-sans text-sm">{item.title}</span>
                </div>
              );
            })()}
          </DragOverlay>
        </DndContext>

        {/* Add activities panel */}
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => setBankOpen(!bankOpen)}
            className="w-full sketch-btn border-sketch-charcoal font-hand text-lg justify-between"
          >
            <span className="flex items-center gap-2">
              <Plus size={18} />
              הוסיפו פעילויות
            </span>
            {bankOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </Button>

          <AnimatePresence>
            {bankOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                {/* Section selector for adding */}
                <div className="flex gap-2 mt-3 mb-2">
                  {SECTIONS_ORDER.map(section => {
                    const SIcon = SECTION_ICON_MAP[section];
                    const isSelected = addToSection === section;
                    return (
                      <button
                        key={section}
                        onClick={() => setAddToSection(isSelected ? null : section)}
                        className={`flex-1 py-2 px-2 rounded-lg border-2 border-dashed text-xs font-hand font-bold transition-all flex items-center justify-center gap-1 ${
                          isSelected
                            ? "border-sketch-coral bg-sketch-coral/10"
                            : "border-foreground/20 hover:border-foreground/40"
                        }`}
                        style={isSelected ? {} : { borderColor: SECTION_COLORS[section] + "60" }}
                      >
                        <SIcon size={14} style={{ color: SECTION_COLORS[section] }} />
                        {section === "morning" ? "בוקר" : section === "afternoon" ? "צהריים" : "ערב"}
                      </button>
                    );
                  })}
                </div>

                {!addToSection && (
                  <p className="text-center text-sm text-muted-foreground my-2">
                    בחרו קודם לאיזה חלק ביום להוסיף
                  </p>
                )}

                {addToSection && (
                  <div className="mt-2 space-y-3">
                    {CATEGORIES.map(cat => {
                      const catActivities = activitiesByCategory[cat];
                      if (!catActivities || catActivities.length === 0) return null;
                      return (
                        <div key={cat}>
                          <p className="text-xs font-bold text-muted-foreground mb-1">{CATEGORY_LABELS[cat]}</p>
                          <div className="grid grid-cols-2 gap-2">
                            {catActivities.map((activity: any) => (
                              <BankItem
                                key={activity.id}
                                activity={activity}
                                onAdd={(a) => addActivity(a, addToSection)}
                                isInSchedule={scheduleActivityIds.has(activity.id)}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action buttons */}
        {scheduleItems.length > 0 && (
          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="flex-1 sketch-btn bg-sketch-sky text-white border-sketch-charcoal font-hand text-lg"
            >
              <Save size={18} />
              {saveMutation.isPending ? "שומר..." : "שמור"}
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
              className="sketch-btn border-sketch-charcoal font-hand text-lg"
            >
              <Printer size={18} />
              הדפס
            </Button>
          </div>
        )}
      </div>

      {/* Print version */}
      <PrintSchedule items={scheduleItems} date={date} />
    </>
  );
}
