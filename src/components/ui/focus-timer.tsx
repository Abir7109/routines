"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface FocusTimerProps {
  timeLeft: number; // in seconds
  totalTime: number; // in seconds
  className?: string;
  accentColor?: string;
}

const FocusTimer: React.FC<FocusTimerProps> = ({
  timeLeft,
  totalTime,
  className,
  accentColor = "oklch(0.6 0.2 250)",
}) => {
  const circumference = 2 * Math.PI * 92; // radius = 92
  const progress = totalTime > 0 && timeLeft > 0 ? ((totalTime - timeLeft) / totalTime) : 0;
  const normalizedProgress = Math.min(1, Math.max(0, progress));
  const strokeDashoffset = circumference - (normalizedProgress * circumference);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Main SVG Progress Ring */}
      <svg
        width="220"
        height="220"
        className="transform -rotate-90"
        viewBox="0 0 220 220"
      >
        {/* Background circle */}
        <circle
          cx="110"
          cy="110"
          r="92"
          fill="none"
          stroke="oklch(0.22 0 0)"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Progress circle */}
        <circle
          cx="110"
          cy="110"
          r="92"
          fill="none"
          stroke={accentColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-300 ease-out"
          style={{
            filter: "drop-shadow(0 0 12px oklch(0.6 0.2 250 / 40%))",
          }}
        />
      </svg>

      {/* Timer display in center - overlapping with ring */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className="text-center"
          style={{
            marginTop: "-4px",
          }}
        >
          <div
            className="text-[3.5rem] font-bold tracking-tighter text-soft-white"
            style={{
              fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
              letterSpacing: "-0.03em",
            }}
          >
            {formatTime(timeLeft)}
          </div>
          <div className="text-xs text-soft-gray leading-none">
            {Math.ceil(timeLeft / 60)} min left
          </div>
        </div>
      </div>

      {/* Checkmark when complete */}
      {timeLeft === 0 && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            animation: "fade-in 300ms ease-out forwards",
          }}
        >
          <div className="relative">
            <div
              className="w-16 h-16 rounded-full bg-muted-green/20 flex items-center justify-center"
              style={{
                animation: "checkmark-appear 500ms ease-out forwards",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="oklch(0.6 0.12 145)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  animation: "checkmark-draw 500ms ease-out forwards",
                }}
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { FocusTimer };
