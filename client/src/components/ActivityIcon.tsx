import {
  Star, Heart, Sun, Moon, Cloud, Music, BookOpen, Palette,
  Puzzle, Blocks, Headphones, Home, Cookie, Gamepad2,
  Scissors, Wind, Footprints, Sunrise, Utensils, Zap, User, Users,
  Monitor, Tv, Smartphone, Tablet,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  star: Star,
  heart: Heart,
  sun: Sun,
  moon: Moon,
  cloud: Cloud,
  music: Music,
  book: BookOpen,
  palette: Palette,
  puzzle: Puzzle,
  blocks: Blocks,
  headphones: Headphones,
  home: Home,
  cookie: Cookie,
  gamepad: Gamepad2,
  scissors: Scissors,
  wind: Wind,
  footprints: Footprints,
  stretch: Zap,
  sunrise: Sunrise,
  utensils: Utensils,
  zap: Zap,
  user: User,
  users: Users,
  monitor: Monitor,
  tv: Tv,
  smartphone: Smartphone,
  tablet: Tablet,
};

interface ActivityIconProps {
  icon: string;
  color?: string;
  size?: number;
  className?: string;
}

export function ActivityIcon({ icon, color, size = 20, className = "" }: ActivityIconProps) {
  const IconComponent = ICON_MAP[icon] || Star;
  return <IconComponent size={size} className={className} style={color ? { color } : undefined} />;
}
