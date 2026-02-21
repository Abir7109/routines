import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch analytics data
export async function GET() {
  try {
    // Get or create user
    let user = await db.user.findFirst();
    if (!user) {
      user = await db.user.create({
        data: {
          email: 'user@example.com',
        },
      });

      // Return empty analytics for new user
      return NextResponse.json({
        weeklyFocusData: [
          { day: "Mon", hours: 0 },
          { day: "Tue", hours: 0 },
          { day: "Wed", hours: 0 },
          { day: "Thu", hours: 0 },
          { day: "Fri", hours: 0 },
          { day: "Sat", hours: 0 },
          { day: "Sun", hours: 0 },
        ],
        subjectDistribution: [],
        monthlyTrend: [
          { week: "W1", sessions: 0, hours: 0 },
          { week: "W2", sessions: 0, hours: 0 },
          { week: "W3", sessions: 0, hours: 0 },
          { week: "W4", sessions: 0, hours: 0 },
        ],
        totalFocusHours: 0,
        totalSessions: 0,
        averageSessionLength: 0,
        weeklyStreak: 0,
        longestStreak: 0,
        mostProductiveDay: "",
        weeklyData: [],
        weeklyBars: [],
        currentStreak: 0,
        bestStreak: 0,
        sessionsThisWeek: 0,
        totalFocusWeek: 0,
        avgSessionLength: 0,
        mostProductiveDay: "",
        efficiency: "0%",
      });
    }

    // Get completed focus sessions
    const sessions = await db.focusSession.findMany({
      where: {
        userId: user.id,
        completed: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    // Calculate weekly data
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyFocusData = days.map((day, index) => {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + index);
      const dateStr = dayDate.toISOString().split('T')[0];

      const daySessions = sessions.filter(s => {
        const sessionDate = s.startedAt.toISOString().split('T')[0];
        return sessionDate === dateStr;
      });

      const totalHours = daySessions.reduce((acc, s) => acc + s.duration / 3600, 0);
      return { day, hours: Math.round(totalHours * 10) / 10 };
    });

    // Calculate total focus hours this week
    const weeklySessions = sessions.filter(s => s.startedAt >= startOfWeek);
    const totalFocusWeek = weeklySessions.reduce((acc, s) => acc + s.duration, 0) / 3600;
    const sessionsThisWeek = weeklySessions.length;

    // Calculate monthly trend (by week)
    const fourWeeksAgo = new Date(now);
    fourWeeksAgo.setDate(now.getDate() - 28);
    const fourWeeksAgoStr = fourWeeksAgo.toISOString().split('T')[0];

    const recentSessions = sessions.filter(
      s => s.startedAt.toISOString().split('T')[0] >= fourWeeksAgoStr
    );

    const monthlyTrend = [
      { week: "W4", sessions: 0, hours: 0 },
      { week: "W3", sessions: 0, hours: 0 },
      { week: "W2", sessions: 0, hours: 0 },
      { week: "W1", sessions: 0, hours: 0 },
    ];

    recentSessions.forEach(session => {
      const sessionDate = new Date(session.startedAt);
      const weeksAgo = Math.floor((now.getTime() - sessionDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const weekIndex = Math.min(weeksAgo, 3);
      monthlyTrend[weekIndex].sessions++;
      monthlyTrend[weekIndex].hours += session.duration / 3600;
    });

    monthlyTrend.forEach(week => {
      week.hours = Math.round(week.hours * 10) / 10;
    });

    // Calculate subject distribution
    const subjectMap = new Map<string, number>();
    sessions.forEach(session => {
      const subject = session.subject;
      const hours = session.duration / 3600;
      subjectMap.set(subject, (subjectMap.get(subject) || 0) + hours);
    });

    const colorMap = [
      "oklch(0.6 0.2 250)",    // electric-blue
      "oklch(0.7 0.12 200)",   // soft-cyan
      "oklch(0.65 0.15 300)",  // subtle-violet
      "oklch(0.6 0.12 145)",   // muted-green
      "oklch(0.55 0.15 25)",   // muted-red
    ];

    let colorIndex = 0;
    const subjectDistribution = Array.from(subjectMap.entries())
      .map(([subject, hours]) => ({
        subject,
        hours: Math.round(hours * 10) / 10,
        color: colorMap[colorIndex++ % colorMap.length],
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5); // Top 5 subjects

    // Calculate overall stats
    const totalFocusHours = sessions.reduce((acc, s) => acc + s.duration, 0) / 3600;
    const totalSessions = sessions.length;
    const averageSessionLength = sessions.length > 0
      ? Math.round(sessions.reduce((acc, s) => acc + s.duration, 0) / sessions.length / 60)
      : 0;

    // Calculate streak
    const dailyStats = await db.dailyStats.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
    });

    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < dailyStats.length; i++) {
      const stats = dailyStats[i];
      if (stats.sessionsCompleted > 0) {
        tempStreak++;
        if (tempStreak > maxStreak) {
          maxStreak = tempStreak;
        }
      } else {
        if (i === 0) {
          currentStreak = tempStreak;
        }
        tempStreak = 0;
      }
    }

    if (dailyStats.length > 0 && dailyStats[0].sessionsCompleted > 0) {
      currentStreak = tempStreak;
    }

    // Find most productive day
    const dayTotals = new Map<string, number>();
    dailyStats.forEach(stats => {
      const date = new Date(stats.date);
      const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1];
      dayTotals.set(dayName, (dayTotals.get(dayName) || 0) + stats.totalFocusTime);
    });

    let mostProductiveDay = "";
    let maxHours = 0;
    dayTotals.forEach((hours, day) => {
      if (hours > maxHours) {
        maxHours = hours;
        mostProductiveDay = day;
      }
    });

    // Calculate efficiency vs last week
    const lastWeekStart = new Date(startOfWeek);
    lastWeekStart.setDate(startOfWeek.getDate() - 7);
    const lastWeekEnd = new Date(startOfWeek);

    const lastWeekSessions = sessions.filter(s =>
      s.startedAt >= lastWeekStart && s.startedAt < startOfWeek
    );
    const lastWeekHours = lastWeekSessions.reduce((acc, s) => acc + s.duration, 0) / 3600;

    const thisWeekHours = totalFocusWeek;
    const efficiency = lastWeekHours > 0
      ? `${Math.round(((thisWeekHours - lastWeekHours) / lastWeekHours) * 100)}%`
      : "+0%";

    // Weekly bars for home screen (sessions per day)
    const weeklyBars = days.map((day, index) => {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + index);
      const dateStr = dayDate.toISOString().split('T')[0];

      const daySessionsCount = sessions.filter(s => {
        const sessionDate = s.startedAt.toISOString().split('T')[0];
        return sessionDate === dateStr && s.completed;
      }).length;

      return Math.min(daySessionsCount, 7); // Max 7 sessions per day for display
    });

    return NextResponse.json({
      weeklyFocusData,
      subjectDistribution,
      monthlyTrend,
      totalFocusHours: Math.round(totalFocusHours * 10) / 10,
      totalSessions,
      averageSessionLength,
      weeklyStreak: currentStreak,
      longestStreak: maxStreak,
      mostProductiveDay,
      // Additional fields for home screen
      weeklyData: weeklyFocusData.map(d => d.hours),
      weeklyBars,
      currentStreak,
      bestStreak: maxStreak,
      sessionsThisWeek,
      totalFocusWeek: Math.round(totalFocusWeek * 10) / 10,
      avgSessionLength: averageSessionLength,
      efficiency,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
