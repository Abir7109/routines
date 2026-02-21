"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";
import { Plus, Calendar as CalendarIcon, MoreVertical, Edit2, Trash2, Clock, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddSessionDialog } from "@/components/add-session-dialog";
import { clientDb } from "@/lib/client-db";

interface ScheduleItem {
  id: string;
  subject: string;
  time: string;
  duration: number; // Changed from string to number to match DB type
  tag?: string;
  completed: boolean;
  order: number;
}

interface ScheduleScreenProps {
  className?: string;
  selectedSession?: any;
}

const ScheduleScreen: React.FC<ScheduleScreenProps> = ({ className, selectedSession }) => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [scheduleItems, setScheduleItems] = React.useState<ScheduleItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedDate] = React.useState<Date>(new Date());

  // Load schedule from Local DB
  React.useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const data = await clientDb.getSchedule(today);
      setScheduleItems(data.items);
    } catch (error) {
      console.error("Error loading schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSession = () => {
    setIsDialogOpen(true);
  };

  const handleSessionAdded = async (newSession: {
    subject: string;
    topic: string;
    time: string;
    duration: string;
  }) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await clientDb.addScheduleItem({
        subject: newSession.subject,
        tag: newSession.topic,
        time: newSession.time,
        duration: parseInt(newSession.duration) || 0,
        date: today,
        order: scheduleItems.length,
      });
      await loadSchedule(); // Reload schedule
    } catch (error) {
      console.error("Error adding session:", error);
    }
  };

  const handleToggleComplete = async (id: string) => {
    try {
      const item = scheduleItems.find(s => s.id === id);
      if (!item) return;

      await clientDb.toggleScheduleItemComplete(id, !item.completed);
      
      // Optimistic update
      setScheduleItems(prev => prev.map(s => 
        s.id === id ? { ...s, completed: !s.completed } : s
      ));
    } catch (error) {
      console.error("Error toggling complete:", error);
      await loadSchedule(); // Revert on error
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await clientDb.deleteScheduleItem(id);
      
      // Optimistic update
      setScheduleItems(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error("Error deleting session:", error);
      await loadSchedule(); // Revert on error
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const getTagStyles = (tag: string) => {
    const styles: Record<string, { bg: string, text: string, border: string, gradient: string }> = {
      Science: {
        bg: "bg-electric-blue/10",
        text: "text-electric-blue",
        border: "border-electric-blue",
        gradient: "from-electric-blue/10 to-transparent"
      },
      Math: {
        bg: "bg-soft-cyan/10",
        text: "text-soft-cyan",
        border: "border-soft-cyan",
        gradient: "from-soft-cyan/10 to-transparent"
      },
      Arts: {
        bg: "bg-subtle-violet/10",
        text: "text-subtle-violet",
        border: "border-subtle-violet",
        gradient: "from-subtle-violet/10 to-transparent"
      },
      CS: {
        bg: "bg-muted-green/10",
        text: "text-muted-green",
        border: "border-muted-green",
        gradient: "from-muted-green/10 to-transparent"
      },
      General: {
        bg: "bg-soft-gray/10",
        text: "text-soft-gray",
        border: "border-soft-gray",
        gradient: "from-soft-gray/10 to-transparent"
      },
    };
    return styles[tag] || styles["General"];
  };

  if (loading) {
    return (
      <div className={cn("min-h-screen pb-32 px-4 pt-6 flex items-center justify-center", className)}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-electric-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-body text-soft-gray">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen pb-32 px-4 pt-6", className)}>
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-title text-soft-white mb-2">Schedule</h1>
            <div className="flex items-center gap-2 text-soft-gray">
              <CalendarIcon className="w-4 h-4" />
              <span className="text-body-small">{formatDate(selectedDate)}</span>
            </div>
          </div>
          <Button
            onClick={handleAddSession}
            size="icon"
            className="bg-electric-blue text-charcoal-deep hover:bg-electric-blue/90 rounded-xl h-12 w-12 shadow-glow-primary"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Schedule List */}
      <section className="space-y-4">
        {scheduleItems.map((item, index) => {
          const styles = getTagStyles(item.tag || "General");
          return (
            <GlassCard
              key={item.id}
              className={cn(
                "relative overflow-hidden group transition-all duration-300 border-0 bg-opacity-10 backdrop-blur-xl",
                item.completed ? "opacity-60 grayscale-[0.3]" : "hover:scale-[1.01]",
                styles.border.replace("border-", "border-l-4 border-")
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Background Gradient */}
              <div className={cn(
                "absolute inset-0 opacity-10 pointer-events-none bg-gradient-to-r",
                styles.gradient
              )} />

              <div className="p-4 relative z-10">
                <div className="flex justify-between items-start mb-3">
                  {/* Time & Duration */}
                  <div className="flex items-center gap-2">
                    <div className="bg-charcoal-deep/50 px-2 py-1 rounded-md border border-white/5 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-electric-blue" />
                      <span className="text-xs font-medium text-soft-gray font-mono tracking-wide">{item.time}</span>
                    </div>
                    <div className="text-xs text-soft-gray flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-soft-gray/50" />
                      {item.duration} min
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1 text-soft-gray hover:text-white">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-card min-w-[140px]">
                      <DropdownMenuItem className="text-soft-white focus:bg-electric-blue/10 focus:text-electric-blue cursor-pointer">
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteSession(item.id)}
                        className="text-muted-red focus:bg-muted-red/10 focus:text-muted-red cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Content */}
                <div className="mb-4">
                  <h3 className={cn(
                    "text-lg font-semibold tracking-tight mb-2 leading-tight",
                    item.completed ? "text-soft-gray line-through decoration-soft-gray/50" : "text-white"
                  )}>
                    {item.subject}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border border-opacity-20",
                      styles.text,
                      styles.bg,
                      styles.border
                    )}>
                      {item.tag || "General"}
                    </span>
                  </div>
                </div>

                {/* Complete Button */}
                <Button
                  onClick={() => handleToggleComplete(item.id)}
                  variant="ghost"
                  className={cn(
                    "w-full h-10 rounded-xl transition-all border",
                    item.completed
                      ? "bg-muted-green/20 text-muted-green border-muted-green/20 hover:bg-muted-green/30"
                      : "bg-charcoal-light/30 text-soft-gray border-white/5 hover:bg-electric-blue/10 hover:text-electric-blue hover:border-electric-blue/30"
                  )}
                >
                  {item.completed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Completed
                    </>
                  ) : (
                    <>
                      <Circle className="w-4 h-4 mr-2" />
                      Mark as Done
                    </>
                  )}
                </Button>
              </div>
            </GlassCard>
          );
        })}
      </section>

      {/* Empty State - shown when no items */}
      {scheduleItems.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-charcoal-mid flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="w-8 h-8 text-soft-gray" />
          </div>
          <h3 className="text-heading text-soft-white mb-2">No Schedule Today</h3>
          <p className="text-body text-soft-gray mb-6">
            Your schedule is empty. Add a session to get started.
          </p>
          <Button
            onClick={handleAddSession}
            className="bg-electric-blue text-charcoal-deep hover:bg-electric-blue/90 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Session
          </Button>
        </div>
      )}

      {/* Add Session Dialog */}
      <AddSessionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSessionAdded={handleSessionAdded}
      />
    </div>
  );
};

export { ScheduleScreen };
