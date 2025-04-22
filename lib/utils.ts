import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface LevelInfo {
  level: number;
  title: string;
  pointsForNextLevel: number | null;
  progress: number;
}

const LEVEL_THRESHOLDS = [
  { points: 20, title: 'ÇAYLAK' },
  { points: 60, title: 'ÇAYLAK' },
  { points: 100, title: 'ÇAYLAK' },
  { points: 140, title: 'ÇAYLAK' },
  { points: 180, title: 'ÇAYLAK' },
  { points: 260, title: 'KALFA' },
  { points: 340, title: 'KALFA' },
  { points: 420, title: 'KALFA' },
  { points: 500, title: 'KALFA' },
  { points: 580, title: 'KALFA' },
  { points: 700, title: 'LİDER' },
  { points: 820, title: 'LİDER' },
  { points: 940, title: 'LİDER' },
  { points: 1060, title: 'LİDER' },
  { points: 1180, title: 'LİDER' },
  { points: 1340, title: 'MUTEBER' },
  { points: 1500, title: 'MUTEBER' },
  { points: 1660, title: 'MUTEBER' },
  { points: 1980, title: 'MUTEBER' },
  { points: 2180, title: 'MUTEBER' },
  { points: 2380, title: 'GAZİ' },
  { points: 2580, title: 'GAZİ' },
  { points: 2780, title: 'GAZİ' },
  { points: 2980, title: 'GAZİ' },
  { points: 3180, title: 'GAZİ' },
  { points: 3420, title: 'SAVAŞÇI' },
  { points: 3660, title: 'SAVAŞÇI' },
  { points: 3900, title: 'SAVAŞÇI' },
  { points: 4140, title: 'SAVAŞÇI' },
  { points: 4380, title: 'SAVAŞÇI' },
  { points: 4660, title: 'DANIŞMENT' },
  { points: 4940, title: 'DANIŞMENT' },
  { points: 5220, title: 'DANIŞMENT' },
  { points: 5500, title: 'DANIŞMENT' },
  { points: 5780, title: 'DANIŞMENT' },
  { points: 6100, title: 'SADRAZAM' },
  { points: 6420, title: 'SADRAZAM' },
  { points: 6540, title: 'SADRAZAM' },
  { points: 7060, title: 'SADRAZAM' },
  { points: 8000, title: 'SADRAZAM' },
];

export function calculateLevelInfo(points: number): LevelInfo {
  // Handle the case for BİLGE KRAL (8000+ points)
  if (points >= 8000) {
    return {
      level: 40,
      title: 'BİLGE KRAL',
      pointsForNextLevel: null,
      progress: 100
    };
  }

  // Find the current level
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (points >= LEVEL_THRESHOLDS[i].points) {
      level = i + 1;
    } else {
      break;
    }
  }

  // Get current title
  const title = LEVEL_THRESHOLDS[level - 1].title;

  // Calculate progress to next level
  let progress = 100;
  let pointsForNextLevel = null;
  
  if (level < LEVEL_THRESHOLDS.length) {
    const currentThreshold = LEVEL_THRESHOLDS[level - 1].points;
    const nextThreshold = LEVEL_THRESHOLDS[level].points;
    pointsForNextLevel = nextThreshold;
    
    const pointsInCurrentLevel = points - currentThreshold;
    const pointsNeededForNextLevel = nextThreshold - currentThreshold;
    progress = Math.min(100, Math.floor((pointsInCurrentLevel / pointsNeededForNextLevel) * 100));
  }

  return {
    level,
    title,
    pointsForNextLevel,
    progress
  };
}
