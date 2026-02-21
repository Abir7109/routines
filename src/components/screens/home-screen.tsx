"use client";


import * as React from "react";
import { cn } from "@/lib/utils";
import { clientDb } from "@/lib/client-db";
import { GlassCard } from "@/components/ui/glass-card";
import { PremiumButton } from "@/components/ui/premium-button";
import { Play, Flame, Clock, ArrowRight, Calendar, TrendingUp, BarChart3, Target, Award, Plus } from "lucide-react";

interface Session {
  id: string;
  time: string;
  subject: string;
  duration: string;
  completed: boolean;
  active?: boolean;
}

interface HomeScreenProps {
  className?: string;
  onNavigateToFocus?: (session?: any) => void;
  onSessionClick?: (session: Session) => void;
  selectedSession?: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  className,
  onNavigateToFocus,
  onSessionClick,
  selectedSession,
}) => {
  const [mounted, setMounted] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState<Date | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Real data from database
  const [nextSession, setNextSession] = React.useState<any>(null);
  const [todaySessions, setTodaySessions] = React.useState<Session[]>([]);
  const [weeklyData, setWeeklyData] = React.useState<number[]>([]);
  const [currentStreak, setCurrentStreak] = React.useState(0);
  const [weeklyBars, setWeeklyBars] = React.useState<number[]>([]);
  const [bestStreak, setBestStreak] = React.useState(0);
  const [totalFocusWeek, setTotalFocusWeek] = React.useState(0);
  const [sessionsThisWeek, setSessionsThisWeek] = React.useState(0);
  const [avgSessionLength, setAvgSessionLength] = React.useState(0);
  const [mostProductiveDay, setMostProductiveDay] = React.useState("");
  const [efficiency, setEfficiency] = React.useState("0%");

  React.useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    loadHomeData();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      // Load schedule for today
      const scheduleData = await clientDb.getSchedule(today);
      let items = scheduleData.items || [];
      
      // Sort by time
      items.sort((a: any, b: any) => a.time.localeCompare(b.time));

      // Find relevant session (First incomplete)
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      let upcomingSession = items.find((item: any) => !item.completed);
      let sessionLabel = "Next Focus";

      if (upcomingSession) {
        // Determine status
        const [h, m] = upcomingSession.time.split(':').map(Number);
        const startMinutes = h * 60 + m;
        const duration = parseInt(upcomingSession.duration) || 0;
        const endMinutes = startMinutes + duration;

        if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
          sessionLabel = "Current Focus";
        } else if (currentMinutes >= endMinutes) {
          sessionLabel = "Overdue";
        }
      }

      // If no session today (or all completed), check tomorrow
      if (!upcomingSession) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDateStr = tomorrow.toISOString().split('T')[0];
        const tomorrowSchedule = await clientDb.getSchedule(tomorrowDateStr);
        if (tomorrowSchedule.items && tomorrowSchedule.items.length > 0) {
           // Sort tomorrow's items
           const tomorrowItems = tomorrowSchedule.items.sort((a: any, b: any) => a.time.localeCompare(b.time));
           upcomingSession = tomorrowItems[0];
           sessionLabel = "Tomorrow";
        }
      }

      if (upcomingSession) {
          setNextSession({ ...upcomingSession, label: sessionLabel });
      } else {
          setNextSession(null);
      }

      setTodaySessions(items.map((item: any) => ({
        id: item.id,
        time: item.time,
        subject: item.subject,
        duration: `${item.duration}m`,
        completed: item.completed,
      })));

      // Load weekly stats
      const statsData = await clientDb.getAnalytics();

      setWeeklyData(statsData.weeklyData || []);
      setCurrentStreak(statsData.currentStreak || 0);
      setWeeklyBars(statsData.weeklyBars || []);
      setBestStreak(statsData.longestStreak || 0);
      setTotalFocusWeek(statsData.totalFocusHours || 0);
      setSessionsThisWeek(statsData.sessionsThisWeek || 0);
      setAvgSessionLength(statsData.averageSessionLength || 0);
      setMostProductiveDay(statsData.mostProductiveDay || "None");
      setEfficiency(statsData.efficiency || "0%");

    } catch (error) {
      console.error("Error loading home data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = (): string => {
    if (!currentTime) return "Good morning";
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning ☀️";
    if (hour < 18) return "Good afternoon 🌤";
    return "Good evening 🌙";
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const completedToday = todaySessions.filter(s => s.completed).length;
  const totalToday = todaySessions.length;
  const plannedTimeToday = todaySessions.reduce((acc, s) => {
    const mins = parseInt(s.duration);
    return acc + (isNaN(mins) ? 0 : mins);
  }, 0);

  if (loading) {
    return (
      <div className={cn("min-h-screen pb-40 px-4 pt-6 bg-charcoal-deep flex items-center justify-center", className)}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-electric-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-body text-soft-gray">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen pb-40 px-4 pt-6 bg-charcoal-deep", className)}>
      {/* Header - Greeting, Time & Date */}
      <header
        className={cn("mb-6", mounted && "animate-fade-in")}
        style={{ animationDelay: "0ms" }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-grow">
            <h1 className="text-title text-soft-white mb-1">
              {getGreeting()}
            </h1>
            <p className="text-body text-soft-gray">
              {currentTime ? formatDate(currentTime) : 'Loading...'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-[2rem] font-semibold text-soft-white tracking-tight">
              {currentTime ? formatTime(currentTime) : '--:--'}
            </div>
          </div>
        </div>
      </header>

      {/* CARD 1 — FOCUS CARD (MAIN) */}
      {nextSession ? (
        <div
          className={cn(
            "glass-card rounded-2xl p-5 mb-4 transition-all duration-200",
            "hover:scale-[1.02] hover:shadow-glow-primary",
            mounted && "animate-fade-in"
          )}
          style={{ animationDelay: "50ms" }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-grow">
              <p className="text-meta text-electric-blue mb-1 uppercase tracking-wider">
                {nextSession.label || "Next Focus"}
              </p>
              <h2 className="text-subtitle text-soft-white mb-1">
                {nextSession.subject}
              </h2>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-electric-blue/10 text-electric-blue border border-electric-blue/20">
                  {nextSession.tag || 'Focus'}
                </span>
                <span className="text-body-small text-soft-gray flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {nextSession.duration}m • {nextSession.time}
                </span>
              </div>
            </div>
            <PremiumButton 
              size="sm" 
              className="h-10 w-10 rounded-full p-0 flex items-center justify-center bg-electric-blue text-charcoal-deep shadow-glow-primary"
              onClick={() => onNavigateToFocus && onNavigateToFocus(nextSession)}
            >
              <Play className="w-5 h-5 ml-0.5" />
            </PremiumButton>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "glass-card rounded-2xl p-5 mb-4 transition-all duration-200",
            mounted && "animate-fade-in"
          )}
          style={{ animationDelay: "50ms" }}
        >
          <div className="text-center">
            <p className="text-meta text-electric-blue mb-1 uppercase tracking-wider">
              Next Focus
            </p>
            <h3 className="text-heading text-soft-white mb-2">
              No upcoming sessions today
            </h3>
            <PremiumButton
              size="md"
              onClick={() => onNavigateToFocus?.()}
              icon={<Plus className="w-4 h-4" />}
            >
              Start Free Focus
            </PremiumButton>
          </div>
        </div>
      )}

      {/* 2-Column Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* CARD 2 — TODAY CARD */}
        <div
          className={cn(
            "glass-card rounded-2xl p-4 transition-all duration-200",
            "hover:scale-[1.02]",
            mounted && "animate-slide-up"
          )}
          style={{ animationDelay: "100ms" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-soft-gray" />
              <p className="text-meta text-soft-gray uppercase tracking-wider">
                Today
              </p>
            </div>
            <div className="text-body-small text-electric-blue font-semibold">
              {completedToday}/{totalToday}
            </div>
          </div>

          {/* Total planned time */}
          <div className="mb-3 pb-3 border-b border-charcoal-light/30">
            <div className="flex items-center justify-between">
              <span className="text-body-small text-soft-gray">Planned</span>
              <span className="text-body text-soft-white font-semibold">
                {plannedTimeToday > 0 ? `${Math.floor(plannedTimeToday / 60)}h ${plannedTimeToday % 60}m` : '0h 0m'}
              </span>
            </div>
          </div>

          {/* Session list - scrollable */}
          <div className="space-y-2 max-h-44 overflow-y-auto scrollbar-hide">
            {todaySessions.length > 0 ? (
              todaySessions.slice(0, 6).map((session, index) => (
                <button
                  key={session.id}
                  onClick={() => onSessionClick?.(session)}
                  className={cn(
                    "w-full flex items-center justify-between py-2 transition-all duration-200 rounded-lg",
                    mounted && "animate-slide-up",
                    session.completed && "opacity-50",
                    session.active && "px-2 -mx-2 bg-electric-blue/10",
                    "hover:bg-charcoal-light/50"
                  )}
                  style={{ animationDelay: `${150 + index * 30}ms` }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all duration-300",
                        session.active
                          ? "bg-electric-blue shadow-[0_0_6px_var(--electric-blue)]"
                          : session.completed
                          ? "bg-muted-green"
                          : "bg-charcoal-light"
                      )}
                    />
                    <span
                      className={cn(
                        "text-body-small",
                        session.active ? "text-soft-white" : session.completed ? "text-soft-gray/60" : "text-soft-gray"
                      )}
                    >
                      {session.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-body-small truncate max-w-[65px]",
                        session.active ? "text-soft-white" : session.completed ? "text-soft-gray/60" : "text-soft-gray"
                      )}
                    >
                      {session.subject}
                    </span>
                    <span className="text-[10px] text-soft-gray/60">
                      {session.duration}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-body-small text-soft-gray">No sessions today</p>
              </div>
            )}
            {todaySessions.length > 6 && (
              <div className="text-center py-2 text-body-small text-electric-blue">
                +{todaySessions.length - 6} more sessions
              </div>
            )}
          </div>
        </div>

        {/* CARD 3 — PROGRESS CARD */}
        <div
          className={cn(
            "glass-card rounded-2xl p-4 transition-all duration-200",
            "hover:scale-[1.02]",
            mounted && "animate-slide-up"
          )}
          style={{ animationDelay: "150ms" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-soft-gray" />
            <p className="text-meta text-soft-gray uppercase tracking-wider">
              Progress
            </p>
          </div>

          <div className="mb-3">
            <div className="text-3xl font-bold text-soft-white mb-1">
              {totalFocusWeek > 0 ? `${totalFocusWeek}h` : '0h'}
            </div>
            <div className="flex items-center justify-between text-body-small text-soft-gray">
              <span>This week</span>
              <span className="text-muted-green">{sessionsThisWeek} {sessionsThisWeek === 1 ? 'session' : 'sessions'}</span>
            </div>
          </div>

          {/* Mini sparkline */}
          <div className="h-10 flex items-end gap-1.5 mb-3">
            {weeklyData.length > 0 ? weeklyData.map((value, index) => (
              <div
                key={index}
                className="flex-1 rounded-t-sm transition-all duration-300 ease-in-out"
                style={{
                  height: `${(value / Math.max(...weeklyData)) * 100}%`,
                  backgroundColor: index === 3 ? "oklch(0.6 0.2 250)" : "oklch(0.3 0.15 250)",
                  opacity: mounted ? 1 : 0,
                  transitionDelay: `${200 + index * 30}ms`,
                }}
              />
            )) : Array(7).fill(0).map((_, index) => (
              <div
                key={index}
                className="flex-1 rounded-t-sm bg-charcoal-light/30"
                style={{ height: "10%" }}
              />
            ))}
          </div>

          {/* Additional metrics */}
          <div className="space-y-2 pt-2 border-t border-charcoal-light/30">
            <div className="flex items-center justify-between text-body-small">
              <span className="text-soft-gray">Avg Session</span>
              <span className="text-soft-white font-medium">{avgSessionLength > 0 ? `${avgSessionLength}m` : '0m'}</span>
            </div>
            <div className="flex items-center justify-between text-body-small">
              <span className="text-soft-gray">Best Day</span>
              <span className="text-electric-blue font-medium">{mostProductiveDay || "—"}</span>
            </div>
          </div>
        </div>

        {/* CARD 4 — STREAK CARD */}
        <div
          className={cn(
            "glass-card rounded-2xl p-4 transition-all duration-200",
            "hover:scale-[1.02]",
            mounted && "animate-slide-up"
          )}
          style={{ animationDelay: "200ms" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-soft-gray" />
            <p className="text-meta text-soft-gray uppercase tracking-wider">
              Streak
            </p>
          </div>

          <div className="mb-3">
            <div className="flex items-center gap-3">
              <div>
                <div className="text-3xl font-bold text-soft-white">
                  {currentStreak > 0 ? currentStreak : 0}
                </div>
                <p className="text-body-small text-soft-gray">Days</p>
              </div>
              <div className="w-px h-8 bg-charcoal-light/50" />
              <div>
                <div className="text-sm font-semibold text-muted-green">
                  {efficiency !== "0%" ? efficiency : "—"}
                </div>
                <p className="text-body-small text-soft-gray">vs last week</p>
              </div>
            </div>
          </div>

          {/* Weekly bars */}
          <div className="h-8 flex items-end gap-1.5 mb-3">
            {weeklyBars.length > 0 ? weeklyBars.map((height, index) => (
              <div
                key={index}
                className={cn(
                  "flex-1 rounded-t-sm transition-all duration-300 ease-in-out",
                  index === 6 && "shadow-[0_0_4px_var(--muted-green)]"
                )}
                style={{
                  height: `${(height / 7) * 100}%`,
                  backgroundColor:
                    index === 6 ? "oklch(0.6 0.12 145)" : "oklch(0.3 0.12 145)",
                  opacity: mounted ? 1 : 0,
                  transitionDelay: `${250 + index * 25}ms`,
                }}
              />
            )) : Array(7).fill(0).map((_, index) => (
              <div
                key={index}
                className="flex-1 rounded-t-sm bg-charcoal-light/30"
                style={{ height: "10%" }}
              />
            ))}
          </div>

          {/* Best streak indicator */}
          <div className="mt-3 pt-2 border-t border-charcoal-light/30">
            <div className="flex items-center gap-2 text-body-small text-soft-gray">
              <Award className="w-3.5 h-3.5 text-electric-blue" />
              <span>Best: {bestStreak > 0 ? `${bestStreak} days` : '0 days'}</span>
            </div>
          </div>
        </div>

        {/* CARD 5 — STATS CARD */}
        <div
          className={cn(
            "glass-card rounded-2xl p-4 transition-all duration-200",
            "hover:scale-[1.02]",
            mounted && "animate-slide-up"
          )}
          style={{ animationDelay: "250ms" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-soft-gray" />
            <p className="text-meta text-soft-gray uppercase tracking-wider">
              Stats
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-body-small text-soft-gray">This Week</span>
              <span className="text-body text-soft-white font-semibold">
                {totalFocusWeek > 0 ? `${totalFocusWeek}h` : '0h'}
              </span>
            </div>
            <div className="h-1.5 bg-charcoal-light rounded-full overflow-hidden">
              <div
                className="h-full bg-electric-blue rounded-full"
                style={{ width: `${Math.min((totalFocusWeek / 40) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { HomeScreen };
