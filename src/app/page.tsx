"use client";

import * as React from "react";
import { HomeScreen } from "@/components/screens/home-screen";
import { ScheduleScreen } from "@/components/screens/schedule-screen";
import { FocusScreen } from "@/components/screens/focus-screen";
import { ProfileScreen } from "@/components/screens/profile-screen";
import { AnalyticsScreen } from "@/components/screens/analytics-screen";
import { SettingsScreen } from "@/components/screens/settings-screen";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { FocusStatusBar } from "@/components/ui/focus-status-bar";
import { AmbientPlayer } from "@/components/functional/ambient-player";
import { nativeBridge } from "@/lib/native-bridge";
import { clientDb } from "@/lib/client-db";

export default function App() {
  const [activeTab, setActiveTab] = React.useState("home");
  const [selectedSession, setSelectedSession] = React.useState<{ id: string; session: any } | null>(null);

  // Focus state lifted to page level for status bar access
  const [focusIsRunning, setFocusIsRunning] = React.useState(false);
  const [focusTimeLeft, setFocusTimeLeft] = React.useState(25 * 60); // 25 minutes
  const [focusTotalTime, setFocusTotalTime] = React.useState(25 * 60);
  const [selectedSound, setSelectedSound] = React.useState<string | null>(null);

  // Settings lifted to page level to control app-wide behavior
  const [distractionBlockingEnabled, setDistractionBlockingEnabled] = React.useState(true);
  const [ambientSoundsEnabled, setAmbientSoundsEnabled] = React.useState(true);
  const [autoStartTimer, setAutoStartTimer] = React.useState(false);
  const [appTheme, setAppTheme] = React.useState<"dark" | "light">("dark");

  // Apply theme to document
  React.useEffect(() => {
    if (appTheme === "dark") {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  }, [appTheme]);

  // Use ref to track current timeLeft for interval updates
  const timeLeftRef = React.useRef(focusTimeLeft);

  // Update ref when timeLeft changes
  React.useEffect(() => {
    timeLeftRef.current = focusTimeLeft;
  }, [focusTimeLeft]);

  // Auto-start timer when entering focus screen if enabled
  React.useEffect(() => {
    if (activeTab === "focus" && autoStartTimer && !focusIsRunning) {
      setFocusIsRunning(true);
    }
  }, [activeTab, autoStartTimer, focusIsRunning]);

  // Timer interval - runs at page level so it continues when navigating
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (focusIsRunning && focusTimeLeft > 0) {
      // Update native service on initial start
      nativeBridge.updateTime(focusTimeLeft, focusIsRunning, focusTotalTime);

      interval = setInterval(() => {
        const newTime = timeLeftRef.current - 1;
        setFocusTimeLeft(newTime);
        // Update native service with new time
        nativeBridge.updateTime(newTime, true, focusTotalTime);
      }, 1000);
    } else if (focusTimeLeft === 0 && focusIsRunning) {
      setFocusIsRunning(false);
      // Stop native service when timer completes
      nativeBridge.stopFocus();

      // Record session in DB
      const subject = selectedSession?.session?.subject || "Free Focus";
      const duration = Math.floor(focusTotalTime / 60); // minutes
      clientDb.recordFocusSession({
        subject,
        duration,
        ambientSound: selectedSound || "None"
      }).catch(err => console.error("Failed to record session:", err));
      
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [focusIsRunning, focusTimeLeft, focusTotalTime]);

  const handleNavigateToFocus = (session?: any) => {
    if (session) {
      setSelectedSession({ id: session.id || Date.now().toString(), session });
      
      // Auto-set timer duration from session
      if (session.duration) {
        // duration is in minutes
        const durationMins = typeof session.duration === 'string' 
          ? parseInt(session.duration) 
          : session.duration;
          
        if (durationMins && !isNaN(durationMins) && durationMins > 0) {
          const durationSecs = durationMins * 60;
          setFocusTotalTime(durationSecs);
          setFocusTimeLeft(durationSecs);
        }
      }
    } else {
      setSelectedSession(null);
    }
    setActiveTab("focus");
  };

  const handleSessionClick = (session: any) => {
    setSelectedSession({ id: session.id || Date.now().toString(), session });
    setActiveTab("schedule");
  };

  const renderScreen = () => {
    switch (activeTab) {
      case "home":
        return (
          <HomeScreen
            onNavigateToFocus={handleNavigateToFocus}
            onSessionClick={handleSessionClick}
            selectedSession={selectedSession}
          />
        );
      case "schedule":
        return <ScheduleScreen selectedSession={selectedSession?.session} />;
      case "focus":
        return (
          <FocusScreen
            isRunning={focusIsRunning}
            timeLeft={focusTimeLeft}
            totalTime={focusTotalTime}
            selectedSound={selectedSound}
            onRunningChange={setFocusIsRunning}
            onTimeLeftChange={setFocusTimeLeft}
            onTotalTimeChange={setFocusTotalTime}
            onSoundChange={setSelectedSound}
            distractionBlockingEnabled={distractionBlockingEnabled}
            ambientSoundsEnabled={ambientSoundsEnabled}
            selectedSession={selectedSession?.session}
          />
        );
      case "profile":
        return <ProfileScreen />;
      case "analytics":
        return <AnalyticsScreen />;
      case "settings":
        return (
          <SettingsScreen
            distractionBlockingEnabled={distractionBlockingEnabled}
            onDistractionBlockingChange={setDistractionBlockingEnabled}
            ambientSoundsEnabled={ambientSoundsEnabled}
            onAmbientSoundsChange={setAmbientSoundsEnabled}
            autoStartTimer={autoStartTimer}
            onAutoStartTimerChange={setAutoStartTimer}
            theme={appTheme}
            onThemeChange={setAppTheme}
          />
        );
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-charcoal-deep">
      {/* Focus Status Bar - Visible when focus mode is running or paused */}
      <FocusStatusBar
        isRunning={focusIsRunning}
        timeLeft={focusTimeLeft}
        totalTime={focusTotalTime}
        selectedSound={selectedSound}
        onTogglePause={() => setFocusIsRunning(!focusIsRunning)}
      />

      <AmbientPlayer 
        selectedSound={selectedSound} 
        enabled={ambientSoundsEnabled && focusIsRunning} 
      />

      <main className="min-h-screen pt-0">
        {renderScreen()}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
