"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Cloud, Trees, Coffee, Waves, Volume2 } from "lucide-react";

interface AmbientSound {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface AmbientSelectorProps {
  selectedSound: string | null;
  onSoundChange: (soundId: string | null) => void;
  className?: string;
  disabled?: boolean;
}

const ambientSounds: AmbientSound[] = [
  { id: "rain", name: "Rain", icon: <Cloud className="w-5 h-5" /> },
  { id: "forest", name: "Forest", icon: <Trees className="w-5 h-5" /> },
  { id: "cafe", name: "Cafe", icon: <Coffee className="w-5 h-5" /> },
  { id: "ocean", name: "Ocean", icon: <Waves className="w-5 h-5" /> },
  { id: "white-noise", name: "White Noise", icon: <Volume2 className="w-5 h-5" /> },
];

const AmbientSelector: React.FC<AmbientSelectorProps> = ({
  selectedSound,
  onSoundChange,
  className,
  disabled = false,
}) => {
  // Color mapping for each sound
  const getSelectedStyle = (soundId: string) => {
    const colorMap: Record<string, { bg: string; border: string; glow: string }> = {
      rain: {
        bg: "oklch(0.6 0.2 250)",
        border: "oklch(0.6 0.2 250 / 60%)",
        glow: "oklch(0.6 0.2 250 / 30%)",
      },
      forest: {
        bg: "oklch(0.65 0.15 280)",
        border: "oklch(0.65 0.15 280 / 60%)",
        glow: "oklch(0.65 0.15 280 / 30%)",
      },
      cafe: {
        bg: "oklch(0.55 0.15 40)",
        border: "oklch(0.55 0.15 40 / 60%)",
        glow: "oklch(0.55 0.15 40 / 30%)",
      },
      ocean: {
        bg: "oklch(0.65 0.2 200)",
        border: "oklch(0.65 0.2 200 / 60%)",
        glow: "oklch(0.65 0.2 200 / 30%)",
      },
      "white-noise": {
        bg: "oklch(0.6 0.15 145)",
        border: "oklch(0.6 0.15 145 / 60%)",
        glow: "oklch(0.6 0.15 145 / 30%)",
      },
    };
    return colorMap[soundId] || colorMap.rain;
  };

  return (
    <div className={cn("flex flex-wrap justify-center gap-2", className)}>
      {ambientSounds.map((sound) => {
        const isSelected = selectedSound === sound.id;
        const selectedStyle = isSelected ? getSelectedStyle(sound.id) : null;
        
        return (
          <button
            key={sound.id}
            onClick={() => !disabled && onSoundChange(selectedSound === sound.id ? null : sound.id)}
            disabled={disabled}
            className={cn(
              "relative flex flex-col items-center justify-center transition-all duration-200",
              "p-3 rounded-lg",
              disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95"
            )}
            style={{
              background: isSelected
                ? selectedStyle!.bg
                : "oklch(0.18 0 0 / 90%)",
              backdropFilter: "blur(20px)",
              border: isSelected
                ? selectedStyle!.border
                : "1px solid oklch(0.28 0 0 / 40%)",
              boxShadow: isSelected
                ? `0 4px 20px ${selectedStyle!.glow}`
                : "0 2px 8px oklch(0 0 0 / 20%)",
              minWidth: "72px",
            }}
            aria-label={`Select ${sound.name}`}
            aria-disabled={disabled}
          >
            {sound.icon}
            <span
              className={cn(
                "text-[10px] mt-1.5 font-medium",
                isSelected || disabled
                  ? "text-charcoal-deep"
                  : "text-soft-gray"
              )}
            >
              {sound.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export { AmbientSelector };
