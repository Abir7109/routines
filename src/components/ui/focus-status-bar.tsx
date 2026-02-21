"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Clock, Volume2, X, Pause } from "lucide-react";

interface FocusStatusBarProps {
  isRunning: boolean;
  timeLeft: number;
  totalTime: number;
  selectedSound: string | null;
  soundName?: string;
  className?: string;
  onClose?: () => void;
  onTogglePause?: () => void;
}

// Sound names mapping
const soundNames: Record<string, string> = {
  rain: "Rain",
  ocean: "Ocean",
  forest: "Forest",
  whiteNoise: "White Noise",
  fire: "Fireplace",
  cafe: "Café",
  wind: "Wind",
  waves: "Waves",
};

const FocusStatusBar: React.FC<FocusStatusBarProps> = ({
  isRunning,
  timeLeft,
  totalTime,
  selectedSound,
  soundName,
  className,
  onClose,
  onTogglePause,
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getSoundDisplayName = (): string => {
    if (soundName) return soundName;
    if (selectedSound) return soundNames[selectedSound] || selectedSound;
    return "None";
  };

  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  // Show when there's an active focus session (even if paused)
  const hasActiveSession = totalTime > 0 && timeLeft < totalTime;

  // Only render when there's an active focus session
  if (!hasActiveSession) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-40 px-4 py-3",
        "bg-charcoal-deep/95 backdrop-blur-lg border-b border-charcoal-light/30",
        "transition-all duration-300 ease-in-out",
        className
      )}
      style={{
        borderBottom: "1px solid oklch(0.6 0.2 250 / 20%)",
        boxShadow: "0 4px 20px oklch(0 0 0 / 30%)",
      }}
    >
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Timer Info */}
          <div className="flex items-center gap-3 flex-1">
            {/* Clock/Pause Icon - Clickable to toggle pause/resume */}
            <button
              onClick={onTogglePause}
              className="relative group"
              aria-label={isRunning ? "Pause focus" : "Resume focus"}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
                  "hover:scale-110 active:scale-95"
                )}
                style={{
                  background: "oklch(0.6 0.2 250 / 15%)",
                  border: "1px solid oklch(0.6 0.2 250 / 30%)",
                }}
              >
                {isRunning ? (
                  <Clock className="w-5 h-5 text-electric-blue" />
                ) : (
                  <Pause className="w-5 h-5 text-electric-blue" />
                )}
              </div>
              {/* Progress indicator */}
              <div
                className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full"
                style={{
                  background: isRunning ? "oklch(0.6 0.2 250)" : "oklch(0.55 0.15 40)",
                  boxShadow: isRunning ? "0 0 8px oklch(0.6 0.2 250 / 60%)" : "0 0 8px oklch(0.55 0.15 40 / 60%)",
                }}
              />
            </button>

            {/* Time and Status */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-lg font-semibold text-soft-white"
                  style={{
                    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
                  }}
                >
                  {formatTime(timeLeft)}
                </span>
                <span className="text-xs text-soft-gray">remaining</span>
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  isRunning ? "text-electric-blue" : "text-amber-500"
                )}
              >
                {isRunning ? "Focus Mode Active" : "Paused"}
              </span>
            </div>
          </div>

          {/* Center: Ambient Sound */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-charcoal-mid/50 border border-charcoal-light/30">
            <Volume2 className="w-3.5 h-3.5 text-muted-green" />
            <span className="text-sm text-soft-gray whitespace-nowrap">
              {getSoundDisplayName()}
            </span>
          </div>

          {/* Right: Close Button (optional) */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-charcoal-mid/50 transition-all duration-200 group"
              aria-label="Hide status bar"
            >
              <X className="w-4 h-4 text-soft-gray group-hover:text-soft-white transition-colors" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-2.5 h-1 rounded-full bg-charcoal-mid/50 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, oklch(0.6 0.2 250) 0%, oklch(0.65 0.22 250) 100%)",
              boxShadow: "0 0 10px oklch(0.6 0.2 250 / 50%)",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export { FocusStatusBar };
