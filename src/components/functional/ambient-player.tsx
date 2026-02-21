"use client";

import * as React from "react";

interface AmbientPlayerProps {
  selectedSound: string | null;
  volume?: number;
  enabled?: boolean;
}

const AmbientPlayer: React.FC<AmbientPlayerProps> = ({
  selectedSound,
  volume = 0.5,
  enabled = true,
}) => {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (!selectedSound || !enabled) return;

    // Map sound IDs to file paths
    const soundFiles: Record<string, string> = {
      rain: "/sounds/rain.mp3",
      forest: "/sounds/forest.mp3",
      ocean: "/sounds/ocean.mp3",
      "white-noise": "/sounds/white-noise.mp3",
      // Add placeholders for others if needed, or map to existing ones
      cafe: "/sounds/rain.mp3", // Fallback
      fire: "/sounds/white-noise.mp3", // Fallback
      wind: "/sounds/white-noise.mp3", // Fallback
      waves: "/sounds/ocean.mp3", // Fallback
    };

    const src = soundFiles[selectedSound];
    if (src) {
      const audio = new Audio(src);
      audio.loop = true;
      audio.volume = volume;
      
      // Play with user interaction handling
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Audio playback failed:", error);
        });
      }
      
      audioRef.current = audio;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [selectedSound, enabled]);

  // Update volume without restarting
  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  return null; // Invisible component
};

export { AmbientPlayer };
