"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { FocusTimer } from "@/components/ui/focus-timer";
import { AmbientSelector } from "@/components/ui/ambient-selector";
import { GlassCard } from "@/components/ui/glass-card";
import { PremiumButton } from "@/components/ui/premium-button";
import { Play, Pause, RotateCcw, X, Shield, Instagram, Twitter, Music, Youtube, Plus, Clock, Facebook, Linkedin, Twitch } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { nativeBridge } from "@/lib/native-bridge";

interface FocusScreenProps {
  className?: string;
  isRunning: boolean;
  timeLeft: number;
  totalTime: number;
  selectedSound: string | null;
  onRunningChange: (running: boolean) => void;
  onTimeLeftChange: (timeLeft: number) => void;
  onTotalTimeChange: (totalTime: number) => void;
  onSoundChange: (sound: string | null) => void;
  distractionBlockingEnabled?: boolean;
  ambientSoundsEnabled?: boolean;
  selectedSession?: any;
}

const FocusScreen: React.FC<FocusScreenProps> = ({
  className,
  isRunning,
  timeLeft,
  totalTime,
  selectedSound,
  onRunningChange,
  onTimeLeftChange,
  onTotalTimeChange,
  onSoundChange,
  distractionBlockingEnabled = true,
  ambientSoundsEnabled = true,
  selectedSession,
}) => {
  const [distractionBlocking, setDistractionBlocking] = React.useState(distractionBlockingEnabled);

  // Only show subject if there's a selected session to continue
  const currentSubject = selectedSession?.subject || null;

  // Sync distraction blocking state with prop
  React.useEffect(() => {
    setDistractionBlocking(distractionBlockingEnabled);
  }, [distractionBlockingEnabled]);
  
  // Custom time dialog state
  const [isCustomTimeOpen, setIsCustomTimeOpen] = React.useState(false);
  const [customHours, setCustomHours] = React.useState(0);
  const [customMinutes, setCustomMinutes] = React.useState(0);

  // Quick time presets
  const timePresets = [5, 10, 15, 20, 25, 30, 45, 60]; // in minutes

  const blockedApps = [
    { id: "instagram", name: "Instagram", icon: <Instagram className="w-5 h-5" />, packageName: "com.instagram.android" },
    { id: "twitter", name: "Twitter", icon: <Twitter className="w-5 h-5" />, packageName: "com.twitter.android" },
    { id: "tiktok", name: "TikTok", icon: <Music className="w-5 h-5" />, packageName: "com.zhiliaoapp.musically" },
    { id: "youtube", name: "YouTube", icon: <Youtube className="w-5 h-5" />, packageName: "com.google.android.youtube" },
    { id: "facebook", name: "Facebook", icon: <Facebook className="w-5 h-5" />, packageName: "com.facebook.katana" },
    { id: "snapchat", name: "Snapchat", icon: <Shield className="w-5 h-5" />, packageName: "com.snapchat.android" },
    { id: "reddit", name: "Reddit", icon: <Shield className="w-5 h-5" />, packageName: "com.reddit.frontpage" },
    { id: "linkedin", name: "LinkedIn", icon: <Linkedin className="w-5 h-5" />, packageName: "com.linkedin.android" },
    { id: "twitch", name: "Twitch", icon: <Twitch className="w-5 h-5" />, packageName: "tv.twitch.android" },
  ];

  // Update blocked apps in native service when distraction blocking is enabled
  React.useEffect(() => {
    const updateNativeBlockedApps = async () => {
      if (distractionBlocking && nativeBridge.isNativeAvailable()) {
        const apps = blockedApps.map(app => ({
          id: app.id,
          packageName: app.packageName
        }));
        await nativeBridge.updateBlockedApps?.(apps);
        console.log('Blocked apps updated in native service:', apps);
      }
    };

    updateNativeBlockedApps();
  }, [distractionBlocking]);

  const handleToggleTimer = async () => {
    const newRunningState = !isRunning;

    if (newRunningState) {
      // Starting focus mode
      try {
        // Check if native bridge is available
        if (nativeBridge.isNativeAvailable()) {
          // Check and request permissions if needed
          const permissionsReady = await nativeBridge.requestPermissions();
          
          if (!permissionsReady) {
            console.log('Permissions requested. Waiting for user grant.');
            onRunningChange(false); // Stop the toggle
            return;
          }

          // Start native focus service
          const success = await nativeBridge.startFocus(totalTime * 1000, distractionBlocking); // Convert to milliseconds and pass blocking status
          if (success) {
            console.log('Native focus service started successfully');
          } else {
            console.warn('Native focus service failed to start, continuing with web-only mode');
          }
        } else {
          console.log('Native bridge not available (running in web browser)');
        }
      } catch (error) {
        console.error('Error starting native focus service:', error);
        // Continue with web-only mode
      }
    } else {
      // Pausing/stopping focus mode
      try {
        if (nativeBridge.isNativeAvailable()) {
          await nativeBridge.stopFocus();
          console.log('Native focus service stopped');
        }
      } catch (error) {
        console.error('Error stopping native focus service:', error);
      }
    }

    onRunningChange(newRunningState);
  };

  const handleResetTimer = async () => {
    onRunningChange(false);
    onTimeLeftChange(totalTime);

    // Stop native focus service
    try {
      if (nativeBridge.isNativeAvailable()) {
        await nativeBridge.stopFocus();
        console.log('Native focus service stopped on reset');
      }
    } catch (error) {
      console.error('Error stopping native focus service:', error);
    }
  };

  const handlePresetSelect = (minutes: number) => {
    const seconds = minutes * 60;
    onTotalTimeChange(seconds);
    onTimeLeftChange(seconds);
  };

  const handleCustomTimeOpen = () => {
    setIsCustomTimeOpen(true);
    // Set current time as default values
    const hours = Math.floor(totalTime / 3600);
    const minutes = Math.floor((totalTime % 3600) / 60);
    setCustomHours(hours);
    setCustomMinutes(minutes);
  };

  const handleCustomTimeSubmit = () => {
    const totalSeconds = (customHours * 60 + customMinutes) * 60;
    if (totalSeconds > 0) {
      onTotalTimeChange(totalSeconds);
      onTimeLeftChange(totalSeconds);
    }
    setIsCustomTimeOpen(false);
  };

  return (
    <div className={cn("min-h-screen pb-40 px-4 pt-6", className)}>
      {/* Fullscreen immersive focus mode */}
      <div className="min-h-screen flex flex-col">
        {/* Top Bar - Minimal */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="text-meta text-soft-gray">Focus Mode</div>
          </div>
          <button className="p-2 rounded-lg bg-charcoal-mid text-soft-gray hover:text-soft-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Subject Display - Only show when continuing from a schedule session */}
        {currentSubject && (
          <section className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-charcoal-mid/50 border border-charcoal-light/30 mb-4">
              <span className="text-body-small text-electric-blue">{currentSubject}</span>
            </div>
          </section>
        )}

        {/* Focus Timer - Central Element */}
        <section className="mb-12">
          <FocusTimer
            timeLeft={timeLeft}
            totalTime={totalTime}
            className="w-full"
          />
        </section>

        {/* Timer Controls */}
        <section className="mb-12">
          <div className="flex items-center justify-center gap-5">
            {/* Reset Button */}
            <button
              onClick={handleResetTimer}
              className="relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: "oklch(0.18 0 0 / 90%)",
                backdropFilter: "blur(20px)",
                border: "1px solid oklch(0.28 0 0 / 50%)",
              }}
              aria-label="Reset timer"
            >
              <RotateCcw className="w-5 h-5 text-soft-gray/70 hover:text-soft-white transition-colors duration-200" />
            </button>

            {/* Start/Pause Button */}
            <button
              onClick={handleToggleTimer}
              className="relative flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: isRunning
                  ? "oklch(0.22 0 0 / 90%)"
                  : "oklch(0.6 0.2 250)",
                backdropFilter: "blur(20px)",
                border: isRunning
                  ? "1px solid oklch(0.28 0 0 / 50%)"
                  : "1px solid oklch(0.6 0.2 250 / 40%)",
                boxShadow: isRunning
                  ? "0 4px 12px oklch(0 0 0 / 20%)"
                  : "0 4px 20px oklch(0.6 0.2 250 / 25%)"
              }}
              aria-label={isRunning ? "Pause" : "Start"}
            >
              {isRunning ? (
                <Pause className="w-6 h-6 text-soft-white/90" />
              ) : (
                <Play className="w-6 h-6 text-charcoal-deep ml-0.5" />
              )}
            </button>
          </div>
        </section>

        {/* Quick Time Selection - Hidden when running */}
        {!isRunning && (
          <section className="mb-10">
            <div className="text-center mb-4">
              <h3 className="text-heading text-soft-white mb-1">Quick Select</h3>
              <p className="text-body-small text-soft-gray">Choose your focus duration</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {/* Preset time buttons */}
              {timePresets.map((minutes) => {
                const isSelected = totalTime === minutes * 60;
                return (
                  <button
                    key={minutes}
                    onClick={() => handlePresetSelect(minutes)}
                    className={cn(
                      "relative flex flex-col items-center justify-center transition-all duration-200",
                      "w-16 h-16 rounded-full",
                      "hover:scale-110 active:scale-95"
                    )}
                    style={{
                      background: isSelected
                        ? "oklch(0.6 0.2 250)"
                        : "oklch(0.18 0 0 / 90%)",
                      backdropFilter: "blur(20px)",
                      border: isSelected
                        ? "2px solid oklch(0.6 0.2 250 / 60%)"
                        : "1px solid oklch(0.28 0 0 / 40%)",
                      boxShadow: isSelected
                        ? "0 4px 20px oklch(0.6 0.2 250 / 30%)"
                        : "0 2px 8px oklch(0 0 0 / 20%)",
                    }}
                    aria-label={`Select ${minutes} minutes`}
                  >
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        isSelected
                          ? "text-charcoal-deep"
                          : "text-soft-gray hover:text-soft-white"
                      )}
                      style={{
                        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
                      }}
                    >
                      {minutes}
                    </span>
                    <span
                      className={cn(
                        "text-[10px]",
                        isSelected
                          ? "text-charcoal-deep/70"
                          : "text-soft-gray/60"
                      )}
                    >
                      min
                    </span>
                  </button>
                );
              })}

              {/* Custom time button (+) */}
              <button
                onClick={handleCustomTimeOpen}
                className="flex items-center justify-center w-16 h-16 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, oklch(0.65 0.15 280) 0%, oklch(0.6 0.18 300) 100%)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid oklch(0.65 0.15 280 / 50%)",
                  boxShadow: "0 2px 12px oklch(0.65 0.15 280 / 25%)",
                }}
                aria-label="Custom time"
              >
                <Plus className="w-6 h-6 text-soft-white" />
              </button>
            </div>
          </section>
        )}

        {/* Custom Time Dialog */}
        <Dialog open={isCustomTimeOpen} onOpenChange={setIsCustomTimeOpen}>
          <DialogOverlay className="backdrop-blur-sm bg-charcoal-deep/60" />
          <DialogContent className="p-0 bg-transparent border-none shadow-2xl max-w-[320px]">
            <DialogTitle className="sr-only">Custom Time</DialogTitle>
            <div className="relative mx-4 sm:mx-0">
              <div className="glass-card rounded-2xl overflow-hidden border border-charcoal-light/50">
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-soft-cyan/20 to-electric-blue/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-electric-blue" />
                    </div>
                    <div>
                      <h3 className="text-heading text-soft-white">Custom Time</h3>
                      <p className="text-body-small text-soft-gray">Set your focus duration</p>
                    </div>
                  </div>

                  {/* Time Input */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex-1">
                      <label className="text-xs text-soft-gray mb-1.5 block">Hours</label>
                      <input
                        type="number"
                        min="0"
                        max="12"
                        value={customHours}
                        onChange={(e) => setCustomHours(Math.min(12, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="w-full px-3 py-2 rounded-lg bg-charcoal-mid/50 border border-charcoal-light/50 text-sm text-soft-white focus:outline-none focus:border-electric-blue/50 transition-all"
                      />
                    </div>
                    <span className="text-xl font-semibold text-soft-white">:</span>
                    <div className="flex-1">
                      <label className="text-xs text-soft-gray mb-1.5 block">Minutes</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={customMinutes}
                        onChange={(e) => setCustomMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="w-full px-3 py-2 rounded-lg bg-charcoal-mid/50 border border-charcoal-light/50 text-sm text-soft-white focus:outline-none focus:border-electric-blue/50 transition-all"
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsCustomTimeOpen(false)}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-charcoal-mid/50 border border-charcoal-light/50 text-sm text-soft-gray hover:text-soft-white hover:bg-charcoal-mid transition-all font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCustomTimeSubmit}
                      disabled={(customHours === 0 && customMinutes === 0)}
                      className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: "linear-gradient(135deg, oklch(0.6 0.2 250) 0%, oklch(0.65 0.22 250) 100%)",
                        boxShadow: "0 4px 20px oklch(0.6 0.2 250 / 25%)",
                      }}
                    >
                      Set Time
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Ambient Sounds - Only show when enabled */}
        {ambientSoundsEnabled && (
        <section className="mb-6">
          <div className="text-center mb-3">
            <h3 className="text-heading text-soft-white mb-1">Ambient Sound</h3>
            <p className="text-body-small text-soft-gray">
              Select background sounds for focus
            </p>
          </div>
          <AmbientSelector
            selectedSound={selectedSound}
            onSoundChange={onSoundChange}
            disabled={!ambientSoundsEnabled}
          />
        </section>
        )}

        {/* Distraction Blocking */}
        {distractionBlocking && (
          <section className="mb-6">
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted-green/20 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-muted-green" />
                  </div>
                  <div>
                    <h4 className="text-body text-soft-white mb-0.5">
                      Distraction Blocking
                    </h4>
                    <p className="text-body-small text-soft-gray">
                      Block distracting apps during focus
                    </p>
                  </div>
                </div>
                <Switch
                  checked={distractionBlocking}
                  onCheckedChange={setDistractionBlocking}
                  className="data-[state=checked]:bg-electric-blue/70"
                />
              </div>

              <div className="grid grid-cols-4 gap-2 mt-4">
                {blockedApps.map((app) => (
                  <div
                    key={app.id}
                    className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg bg-charcoal-mid/50"
                  >
                    {app.icon}
                    <span className="text-[10px] text-soft-gray text-center leading-tight">
                      {app.name}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </section>
        )}
      </div>
    </div>
  );
};

export { FocusScreen };
