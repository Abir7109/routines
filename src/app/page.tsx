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

  // Helper function to get initial timer state from localStorage
  const getInitialTimerState = () => {
    // Don't restore session on app start - just check if it completed
    return { timeLeft: 25 * 60, totalTime: 25 * 60, isRunning: false, sessionStartTime: null, selectedSound: null, selectedSession: null };
  };
  
  // Get initial state from localStorage synchronously to prevent flash
  const initialTimerState = getInitialTimerState();
  
  const [selectedSession, setSelectedSession] = React.useState<{ id: string; session: any } | null>(initialTimerState.selectedSession);

  // Focus state lifted to page level for status bar access
  const [focusIsRunning, setFocusIsRunning] = React.useState(initialTimerState.isRunning);
  const [focusTimeLeft, setFocusTimeLeft] = React.useState(initialTimerState.timeLeft);
  const [focusTotalTime, setFocusTotalTime] = React.useState(initialTimerState.totalTime);
  const [selectedSound, setSelectedSound] = React.useState<string | null>(initialTimerState.selectedSound);
  // Track when the current focus session started (for persistence calculation)
  const [sessionStartTime, setSessionStartTime] = React.useState<number | null>(initialTimerState.sessionStartTime);

  // Stop focus session when app is closed/cleared from background
  React.useEffect(() => {
    // Handle app being closed/killed - clear the timer state
    const handleBeforeUnload = () => {
      if (focusIsRunning && focusTimeLeft > 0) {
        // Stop native focus service when app is closing
        nativeBridge.stopFocus();
        // Clear the timer state so it doesn't persist
        localStorage.removeItem('focusTimerState');
      }
    };

    // Handle visibility change - when app becomes hidden (switched away or minimized)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App is going to background - already handled by persistence
      } else {
        // App is now visible - check if we need to stop the session
        // If the session was running but is now stale (app was killed), stop it
        const savedState = localStorage.getItem('focusTimerState');
        if (savedState) {
          try {
            const timerState = JSON.parse(savedState);
            // If app was in background for too long or was killed, stop the session
            const elapsed = Math.floor((Date.now() - timerState.sessionStartTime) / 1000);
            const remainingTime = timerState.totalTime - elapsed;
            
            // If session was completed while in background, handle it
            if (remainingTime <= 0 && timerState.isRunning) {
              // Timer completed in background - record it
              const subject = timerState.selectedSession?.session?.subject || "Free Focus";
              const duration = Math.floor(timerState.totalTime / 60);
              clientDb.recordFocusSession({
                subject,
                duration,
                ambientSound: timerState.selectedSound || "None"
              }).catch(err => console.error("Failed to record completed session:", err));
              
              localStorage.removeItem('focusTimerState');
            }
            // For sessions still running, we stop them when app reopens
            // This ensures the session stops when app is cleared from background
          } catch (error) {
            console.error('Error handling visibility change:', error);
          }
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [focusIsRunning, focusTimeLeft]);

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

  // Persist timer state to localStorage
  React.useEffect(() => {
    if (focusIsRunning && sessionStartTime) {
      const timerState = {
        isRunning: focusIsRunning,
        timeLeft: focusTimeLeft,
        totalTime: focusTotalTime,
        selectedSound,
        sessionStartTime: sessionStartTime,
        selectedSession: selectedSession, // Save session info for restoration
        timestamp: Date.now()
      };
      localStorage.setItem('focusTimerState', JSON.stringify(timerState));
    } else {
      // Clear timer state when not running
      localStorage.removeItem('focusTimerState');
    }
  }, [focusIsRunning, focusTimeLeft, focusTotalTime, selectedSound, sessionStartTime, selectedSession]);

  // Restore timer state from localStorage when app starts or comes to foreground
  // This now handles: if timer completed in background, record it; otherwise stop the session
  React.useEffect(() => {
    const restoreTimerState = () => {
      const savedState = localStorage.getItem('focusTimerState');
      if (savedState) {
        try {
          const timerState = JSON.parse(savedState);
          
          // Calculate elapsed time since session started
          const elapsed = Math.floor((Date.now() - timerState.sessionStartTime) / 1000);
          const remainingTime = timerState.totalTime - elapsed;
          
          if (remainingTime > 0 && timerState.isRunning) {
            // Session is still running - STOP IT when app reopens
            // This handles the case where app was cleared from background
            setFocusTimeLeft(0);
            setFocusIsRunning(false);
            
            // Stop native focus service
            nativeBridge.stopFocus();
            
            // Clear the timer state
            localStorage.removeItem('focusTimerState');
            
            console.log('Focus session stopped - app was closed/cleared');
          } else if (remainingTime <= 0 && timerState.isRunning) {
            // Timer completed while app was closed - record as completed session
            const subject = timerState.selectedSession?.session?.subject || "Free Focus";
            const duration = Math.floor(timerState.totalTime / 60); // minutes
            clientDb.recordFocusSession({
              subject,
              duration,
              ambientSound: timerState.selectedSound || "None"
            }).catch(err => console.error("Failed to record completed session:", err));
            
            setFocusTimeLeft(0);
            setFocusIsRunning(false);
            localStorage.removeItem('focusTimerState');
          }
        } catch (error) {
          console.error('Error restoring timer state:', error);
        }
      }
    };
    
    // Restore on initial mount
    restoreTimerState();
    
    // Also check when app comes back to foreground
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        restoreTimerState();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Auto-start timer when entering focus screen if enabled
  React.useEffect(() => {
    if (activeTab === "focus" && autoStartTimer && !focusIsRunning) {
      setFocusIsRunning(true);
    }
  }, [activeTab, autoStartTimer, focusIsRunning]);

  // Set session start time when timer starts
  React.useEffect(() => {
    if (focusIsRunning && !sessionStartTime) {
      // Timer just started, record the start time
      setSessionStartTime(Date.now());
    } else if (!focusIsRunning) {
      // Timer stopped, clear the start time
      setSessionStartTime(null);
    }
  }, [focusIsRunning, sessionStartTime]);

  // Use ref to track if session was previously running (for detecting manual stop)
  const wasRunningRef = React.useRef(false);
  
  React.useEffect(() => {
    wasRunningRef.current = focusIsRunning;
  }, [focusIsRunning]);

  // Detect when user manually resets the session (not completed, not paused)
  React.useEffect(() => {
    const wasRunning = wasRunningRef.current;
    
    // User just stopped/reset the timer (was running, now not, and not completed)
    if (wasRunning && !focusIsRunning && focusTimeLeft > 0 && focusTimeLeft === focusTotalTime) {
      // This is a manual reset - record as not_finished
      const subject = selectedSession?.session?.subject || "Free Focus";
      const actualDuration = Math.floor((focusTotalTime - focusTimeLeft) / 60); // minutes actually focused
      
      if (actualDuration > 0) {
        clientDb.recordFocusSession({
          subject,
          duration: actualDuration,
          ambientSound: selectedSound || "None",
          status: 'not_finished'
        }).catch(err => console.error("Failed to record incomplete session:", err));
      }
      
      console.log('Session reset by user, recorded as not_finished');
    }
  }, [focusIsRunning, focusTimeLeft, focusTotalTime, selectedSession, selectedSound]);

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
      
      // Clear timer state when completed
      localStorage.removeItem('focusTimerState');
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
