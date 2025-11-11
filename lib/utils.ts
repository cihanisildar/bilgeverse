import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the base URL for the application
 * Uses NEXT_PUBLIC_APP_URL environment variable if available, otherwise falls back to window.location.origin
 * This ensures correct URLs in both development and production environments
 */
export function getBaseUrl(): string {
  // In server-side rendering, we can't use window
  if (typeof window === 'undefined') {
    // Return a placeholder or use environment variable
    return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_DOMAIN || '';
  }
  
  // Client-side: use environment variable if set, otherwise use current origin
  // window.location.origin automatically uses the correct URL (localhost in dev, production URL in prod)
  return process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
}

export interface LevelInfo {
  level: number;
  title: string;
  pointsForNextLevel: number | null;
  progress: number;
}

const LEVEL_THRESHOLDS = [
  { points: 0, title: 'ACEMİ' },
  { points: 90, title: 'ACEMİ' },
  { points: 179, title: 'ACEMİ' },
  { points: 269, title: 'ACEMİ' },
  { points: 359, title: 'ACEMİ' },
  { points: 449, title: 'TECRÜBELİ' },
  { points: 538, title: 'TECRÜBELİ' },
  { points: 628, title: 'TECRÜBELİ' },
  { points: 718, title: 'TECRÜBELİ' },
  { points: 808, title: 'TECRÜBELİ' },
  { points: 897, title: 'OLGUN' },
  { points: 987, title: 'OLGUN' },
  { points: 1077, title: 'OLGUN' },
  { points: 1167, title: 'OLGUN' },
  { points: 1256, title: 'OLGUN' },
  { points: 1346, title: 'SAVAŞÇI' },
  { points: 1436, title: 'SAVAŞÇI' },
  { points: 1526, title: 'SAVAŞÇI' },
  { points: 1615, title: 'SAVAŞÇI' },
  { points: 1705, title: 'SAVAŞÇI' },
  { points: 1795, title: 'KUMANDAN' },
  { points: 1885, title: 'KUMANDAN' },
  { points: 1974, title: 'KUMANDAN' },
  { points: 2064, title: 'KUMANDAN' },
  { points: 2154, title: 'KUMANDAN' },
  { points: 2244, title: 'ALBAY' },
  { points: 2333, title: 'ALBAY' },
  { points: 2423, title: 'ALBAY' },
  { points: 2513, title: 'ALBAY' },
  { points: 2603, title: 'ALBAY' },
  { points: 2692, title: 'MAREŞAL' },
  { points: 2782, title: 'MAREŞAL' },
  { points: 2872, title: 'MAREŞAL' },
  { points: 2962, title: 'MAREŞAL' },
  { points: 3051, title: 'MAREŞAL' },
  { points: 3141, title: 'SADRAZAM' },
  { points: 3231, title: 'SADRAZAM' },
  { points: 3321, title: 'SADRAZAM' },
  { points: 3410, title: 'SADRAZAM' },
  { points: 3500, title: 'BİLGE HAKAN' },
];

export function calculateLevelInfo(points: number): LevelInfo {
  // Handle the case for BİLGE HAKAN (3500+ points)
  if (points >= 3500) {
    return {
      level: 40,
      title: 'BİLGE HAKAN',
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
