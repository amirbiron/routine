import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";

const CONFETTI_COLORS = ["#e8846b", "#6ba8e8", "#6bc9a8", "#e8c96b", "#a86be8", "#e8a86b"];

function ConfettiPiece({ color, left, delay, size, rotation }: {
  color: string;
  left: string;
  delay: number;
  size: number;
  rotation: number;
}) {
  return (
    <motion.div
      className="absolute"
      style={{
        left,
        top: -20,
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
      }}
      initial={{ y: -20, opacity: 1, rotate: rotation }}
      animate={{ y: "100vh", opacity: 0, rotate: rotation + 720 }}
      transition={{ duration: 2 + Math.random(), delay, ease: "easeIn" }}
    />
  );
}

function StarBurst() {
  const stars = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    angle: (i * 30) * (Math.PI / 180),
    delay: i * 0.05,
    distance: 60 + Math.random() * 40,
    size: 10 + Math.random() * 14,
  }));

  return (
    <>
      {stars.map(s => (
        <motion.div
          key={s.id}
          className="absolute"
          style={{ color: CONFETTI_COLORS[s.id % CONFETTI_COLORS.length] }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{
            x: Math.cos(s.angle) * s.distance,
            y: Math.sin(s.angle) * s.distance,
            scale: [0, 1.5, 0],
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 1, delay: s.delay }}
        >
          <Star size={s.size} fill="currentColor" />
        </motion.div>
      ))}
    </>
  );
}

interface CelebrationProps {
  show: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  emoji?: string;
  tokensEarned?: number;
}

export function Celebration({
  show,
  onClose,
  title = "!כל הכבוד",
  subtitle = "המשיכו כך!",
  emoji = "🏆",
  tokensEarned,
}: CelebrationProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  const confettiPieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 1.2,
    size: 5 + Math.random() * 10,
    rotation: Math.random() * 360,
  }));

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" />

          {/* Confetti */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {confettiPieces.map(p => (
              <ConfettiPiece key={p.id} {...p} />
            ))}
          </div>

          {/* Card */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", damping: 10, stiffness: 100 }}
            className="sketch-card p-8 text-center bg-card max-w-sm mx-4 relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Star burst behind emoji */}
            <div className="relative flex items-center justify-center mb-4">
              <StarBurst />
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 0.6, repeat: 2 }}
                className="text-6xl relative z-10"
              >
                {emoji}
              </motion.div>
            </div>

            <h2 className="text-3xl font-hand font-bold mb-2">{title}</h2>
            <p className="text-lg text-foreground/70">{subtitle}</p>

            {tokensEarned && tokensEarned > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="mt-4 flex items-center justify-center gap-2"
              >
                <Star className="w-8 h-8 text-sketch-sun fill-sketch-sun" />
                <span className="text-2xl font-hand font-bold text-sketch-sun">+{tokensEarned}</span>
              </motion.div>
            )}

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="text-xs text-muted-foreground mt-4"
            >
              לחצו לסגירה
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
