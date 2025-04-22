import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { calculateLevelInfo } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LevelBadgeProps {
  points: number;
  showProgress?: boolean;
  className?: string;
}

export function LevelBadge({ points, showProgress = false, className = "" }: LevelBadgeProps) {
  const levelInfo = calculateLevelInfo(points);

  const getTitleColor = (title: string) => {
    switch (title) {
      case 'ÇAYLAK':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'KALFA':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'LİDER':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'MUTEBER':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'GAZİ':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'SAVAŞÇI':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'DANIŞMENT':
        return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200';
      case 'SADRAZAM':
        return 'bg-pink-100 text-pink-800 hover:bg-pink-200';
      case 'BİLGE KRAL':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className={`flex flex-col gap-1 ${className}`}>
            <Badge 
              variant="secondary" 
              className={`${getTitleColor(levelInfo.title)} transition-colors duration-200`}
            >
              <span className="flex items-center gap-1">
                {levelInfo.title === 'BİLGE KRAL' && <Sparkles className="h-3 w-3" />}
                {levelInfo.title} - Seviye {levelInfo.level}
                {levelInfo.title === 'BİLGE KRAL' && <Sparkles className="h-3 w-3" />}
              </span>
            </Badge>
            {showProgress && levelInfo.pointsForNextLevel && (
              <div className="w-full">
                <Progress value={levelInfo.progress} className="h-1" />
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-semibold">{points} Puan</p>
            {levelInfo.pointsForNextLevel && (
              <p className="text-gray-500">
                Sonraki seviye için {levelInfo.pointsForNextLevel - points} puan gerekli
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 