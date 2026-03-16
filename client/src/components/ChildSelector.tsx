import { useActiveChild } from "@/contexts/ChildContext";
import { COLOR_MAP } from "@shared/types";
import { ChevronDown, Plus } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";

export function ChildSelector() {
  const { children, activeChild, setActiveChildId } = useActiveChild();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!activeChild || children.length === 0) return null;

  const avatarColor = COLOR_MAP[activeChild.avatarColor] || COLOR_MAP.coral;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg border-2 border-dashed border-foreground/20 hover:border-foreground/40 transition-all"
      >
        <div
          className="w-6 h-6 rounded-full border-2 border-dashed flex items-center justify-center text-xs font-bold text-white"
          style={{ backgroundColor: avatarColor, borderColor: avatarColor }}
        >
          {activeChild.name.charAt(0)}
        </div>
        <span className="font-hand text-sm font-bold max-w-[80px] truncate">{activeChild.name}</span>
        {children.length > 1 && <ChevronDown size={14} className="text-muted-foreground" />}
      </button>

      {open && (
        <div className="absolute top-full mt-1 right-0 bg-card border-2 border-dashed border-border rounded-xl shadow-lg z-50 min-w-[160px] overflow-hidden">
          {children.map(child => {
            const color = COLOR_MAP[child.avatarColor] || COLOR_MAP.coral;
            const isActive = child.id === activeChild.id;
            return (
              <button
                key={child.id}
                onClick={() => {
                  setActiveChildId(child.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 transition-all ${
                  isActive ? "bg-sketch-coral/10" : "hover:bg-muted/50"
                }`}
              >
                <div
                  className="w-7 h-7 rounded-full border-2 border-dashed flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: color, borderColor: color }}
                >
                  {child.name.charAt(0)}
                </div>
                <span className="font-hand text-sm font-bold">{child.name}</span>
                {isActive && <div className="w-2 h-2 rounded-full bg-sketch-coral mr-auto" />}
              </button>
            );
          })}
          <Link href="/children" onClick={() => setOpen(false)}>
            <div className="flex items-center gap-2 px-3 py-2.5 border-t-2 border-dashed border-border hover:bg-muted/50 transition-all cursor-pointer">
              <div className="w-7 h-7 rounded-full border-2 border-dashed border-foreground/30 flex items-center justify-center">
                <Plus size={14} className="text-muted-foreground" />
              </div>
              <span className="font-hand text-sm text-muted-foreground">ניהול ילדים</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
