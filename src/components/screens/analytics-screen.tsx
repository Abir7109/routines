"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { clientDb } from "@/lib/client-db";
import { GlassCard } from "@/components/ui/glass-card";
import { Calendar, TrendingUp, Clock, Flame } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface AnalyticsScreenProps {
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 rounded-lg">
        <p className="text-body-small text-soft-gray mb-1">{label}</p>
        <p className="text-body text-soft-white">
          {payload[0].value} hours
        </p>
      </div>
    );
  }
  return null;
};

const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ className }) => {
  const [loading, setLoading] = React.useState(true);

  // Real data from API
  const [weeklyFocusData, setWeeklyFocusData] = React.useState<any[]>([]);
  const [subjectDistribution, setSubjectDistribution] = React.useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState({
    totalFocusHours: 0,
    totalSessions: 0,
    averageSessionLength: 0,
    weeklyStreak: 0,
    longestStreak: 0,
    mostProductiveDay: "",
  });

  React.useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const data = await clientDb.getAnalytics();

      setWeeklyFocusData(data.weeklyFocusData || []);
      setSubjectDistribution(data.subjectDistribution || []);
      setMonthlyTrend(data.monthlyTrend || []);
      setStats({
        totalFocusHours: data.totalFocusHours || 0,
        totalSessions: data.totalSessions || 0,
        averageSessionLength: data.averageSessionLength || 0,
        weeklyStreak: data.weeklyStreak || 0,
        longestStreak: data.longestStreak || 0,
        mostProductiveDay: data.mostProductiveDay || "",
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={cn("min-h-screen pb-32 px-4 pt-6 flex items-center justify-center", className)}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-electric-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-body text-soft-gray">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen pb-32 px-4 pt-6", className)}>
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-title text-soft-white mb-1">Analytics</h1>
            <div className="flex items-center gap-2 text-soft-gray">
              <Calendar className="w-4 h-4" />
              <span className="text-body-small">This Week</span>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <section className="grid grid-cols-2 gap-4 mb-8">
        <GlassCard className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-electric-blue/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-electric-blue" />
            </div>
            <div>
              <div className="text-2xl font-bold text-soft-white">
                {stats.totalFocusHours}h
              </div>
              <div className="text-meta text-soft-gray">Total Hours</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-soft-cyan/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-soft-cyan" />
            </div>
            <div>
              <div className="text-2xl font-bold text-soft-white">
                {stats.totalSessions}
              </div>
              <div className="text-meta text-soft-gray">Sessions</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-subtle-violet/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-subtle-violet" />
            </div>
            <div>
              <div className="text-2xl font-bold text-soft-white">
                {stats.averageSessionLength}m
              </div>
              <div className="text-meta text-soft-gray">Avg Session</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-muted-green/20 flex items-center justify-center">
              <Flame className="w-5 h-5 text-muted-green" />
            </div>
            <div>
              <div className="text-2xl font-bold text-soft-white">
                {stats.weeklyStreak}
              </div>
              <div className="text-meta text-soft-gray">Day Streak</div>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Weekly Focus Hours Chart */}
      <section className="mb-8">
        <GlassCard className="p-6">
          <div className="mb-6">
            <h3 className="text-heading text-soft-white mb-2">Weekly Focus Hours</h3>
            <p className="text-body-small text-soft-gray">Your focus time this week</p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyFocusData.length > 0 ? weeklyFocusData : [
                { day: "Mon", hours: 0 },
                { day: "Tue", hours: 0 },
                { day: "Wed", hours: 0 },
                { day: "Thu", hours: 0 },
                { day: "Fri", hours: 0 },
                { day: "Sat", hours: 0 },
                { day: "Sun", hours: 0 },
              ]}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="oklch(0.28 0 0)"
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "oklch(0.7 0 0)", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "oklch(0.7 0 0)", fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "oklch(0.22 0 0 / 50%)" }} />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                  {weeklyFocusData.length > 0 ? weeklyFocusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 3 ? "oklch(0.6 0.2 250)" : "oklch(0.3 0.15 250)"}
                    />
                  )) : Array(7).fill(0).map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 3 ? "oklch(0.6 0.2 250)" : "oklch(0.3 0.15 250)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </section>

      {/* Monthly Trend */}
      <section className="mb-8">
        <GlassCard className="p-6">
          <div className="mb-6">
            <h3 className="text-heading text-soft-white mb-2">Monthly Trend</h3>
            <p className="text-body-small text-soft-gray">Sessions over time</p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend.length > 0 ? monthlyTrend : [
                { week: "W1", sessions: 0, hours: 0 },
                { week: "W2", sessions: 0, hours: 0 },
                { week: "W3", sessions: 0, hours: 0 },
                { week: "W4", sessions: 0, hours: 0 },
              ]}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="oklch(0.28 0 0)"
                />
                <XAxis
                  dataKey="week"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "oklch(0.7 0 0)", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "oklch(0.7 0 0)", fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "oklch(0.6 0.2 250)", strokeWidth: 1 }} />
                <Line
                  type="monotone"
                  dataKey="sessions"
                  stroke="oklch(0.6 0.2 250)"
                  strokeWidth={2}
                  dot={{ fill: "oklch(0.6 0.2 250)", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: "oklch(0.6 0.2 250)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </section>

      {/* Subject Distribution */}
      <section>
        <GlassCard className="p-6">
          <div className="mb-6">
            <h3 className="text-heading text-soft-white mb-2">Subject Distribution</h3>
            <p className="text-body-small text-soft-gray">Time by subject this month</p>
          </div>
          <div className="space-y-4">
            {subjectDistribution.length > 0 ? subjectDistribution.map((item) => (
              <div key={item.subject}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-body text-soft-white">{item.subject}</span>
                  <span className="text-body-small text-soft-gray">{item.hours}h</span>
                </div>
                <div className="h-2 bg-charcoal-light rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${(item.hours / Math.max(...subjectDistribution.map((d: any) => d.hours))) * 100}%`,
                      backgroundColor: item.color,
                      boxShadow: `0 0 12px ${item.color}40`,
                    }}
                  />
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-soft-gray">
                <p className="text-body">No data available yet</p>
                <p className="text-body-small mt-2">Start a focus session to see your subject distribution</p>
              </div>
            )}
          </div>
        </GlassCard>
      </section>
    </div>
  );
};

export { AnalyticsScreen };
