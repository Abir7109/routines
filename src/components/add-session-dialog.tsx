"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookOpen, Clock, X, Save, Sparkles, Target } from "lucide-react";

interface AddSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionAdded?: (session: {
    subject: string;
    topic: string;
    time: string;
    duration: string;
  }) => void;
}

const AddSessionDialog: React.FC<AddSessionDialogProps> = ({
  open,
  onOpenChange,
  onSessionAdded,
}) => {
  const [subject, setSubject] = React.useState("");
  const [topic, setTopic] = React.useState("");
  const [time, setTime] = React.useState("");
  const [duration, setDuration] = React.useState("60");
  const [savedSubjects, setSavedSubjects] = React.useState<string[]>([]);

  // Convert 24-hour time string to 12-hour format
  const to12Hour = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Set current time when dialog opens
  React.useEffect(() => {
    if (open) {
      const now = new Date();
      setTime(to12Hour(`${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`));
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject || !time) {
      return;
    }

    const newSession = {
      subject,
      topic,
      time: time, // Keep 12-hour format
      duration: `${duration} min`,
    };

    onSessionAdded?.(newSession);

    // Reset form
    setSubject("");
    setTopic("");
    setTime("");
    setDuration("60");

    onOpenChange(false);
  };

  const handleSaveTemplate = () => {
    if (subject && !savedSubjects.includes(subject)) {
      setSavedSubjects([...savedSubjects, subject]);
    }
  };

  const handleUseTemplate = (template: string) => {
    setSubject(template);
  };

  const handleRemoveTemplate = (templateToRemove: string) => {
    setSavedSubjects(savedSubjects.filter((t) => t !== templateToRemove));
  };

  const durationOptions = [
    { value: "30", label: "30m" },
    { value: "45", label: "45m" },
    { value: "60", label: "1h" },
    { value: "90", label: "1.5h" },
    { value: "120", label: "2h" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="backdrop-blur-sm bg-charcoal-deep/60" />
      <DialogContent
        showCloseButton={false}
        className="p-0 bg-transparent border-none shadow-2xl max-w-[360px]"
      >
        {/* Hidden title for screen readers */}
        <DialogTitle className="sr-only">Add New Session</DialogTitle>

        <div className="relative mx-4 sm:mx-0">
          {/* Main glass card */}
          <div className="relative glass-card rounded-2xl overflow-hidden border border-glass-border">
            {/* Decorative gradient top bar */}
            <div className="h-0.5 bg-gradient-to-r from-electric-blue via-soft-cyan to-subtle-violet" />

            {/* Compact Header */}
            <div className="p-4 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-electric-blue/20 to-electric-blue/5 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-electric-blue" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-soft-white">
                    New Session
                  </h2>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-soft-gray/60 hover:text-soft-white hover:bg-charcoal-mid transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 pb-4 space-y-3">
              {/* Saved Templates */}
              {savedSubjects.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-soft-gray/70 uppercase tracking-wide">
                    Saved Templates
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {savedSubjects.map((template) => (
                      <div
                        key={template}
                        onClick={() => handleUseTemplate(template)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleUseTemplate(template);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        className="relative px-2.5 py-1.5 rounded-md bg-charcoal-mid/50 border border-charcoal-light/50 text-xs text-soft-gray hover:text-soft-white hover:border-electric-blue/50 transition-all group cursor-pointer"
                      >
                        <span className="max-w-[100px] truncate">{template}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveTemplate(template);
                          }}
                          className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-muted-red text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted-red/80"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subject Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-soft-gray/80">
                    <BookOpen className="w-3 h-3 text-electric-blue" />
                    <label>Subject</label>
                  </div>
                  {subject && (
                    <button
                      type="button"
                      onClick={handleSaveTemplate}
                      className="text-[10px] text-soft-cyan hover:text-soft-cyan/80 flex items-center gap-1 transition-colors"
                    >
                      <Save className="w-2.5 h-2.5" />
                      Save
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Enter subject name..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-charcoal-mid/50 border border-charcoal-light/50 text-sm text-soft-white placeholder:text-soft-gray/40 focus:outline-none focus:border-electric-blue/50 focus:bg-charcoal-mid/70 transition-all"
                />
              </div>

              {/* Topic Input */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-soft-gray/80">
                  <Target className="w-3 h-3 text-subtle-violet" />
                  <label>Topic</label>
                </div>
                <input
                  type="text"
                  placeholder="Specific topic to study..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-charcoal-mid/50 border border-charcoal-light/50 text-sm text-soft-white placeholder:text-soft-gray/40 focus:outline-none focus:border-subtle-violet/50 focus:bg-charcoal-mid/70 transition-all"
                />
              </div>

              {/* Time and Duration Row */}
              <div className="grid grid-cols-2 gap-2">
                {/* Time Input - 12-hour format */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-soft-gray/80">
                    <Clock className="w-3 h-3 text-soft-cyan" />
                    <label>Time</label>
                  </div>
                  <input
                    type="text"
                    placeholder="HH:MM AM/PM"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    pattern="[0-9]{1,2}:[0-9]{2} (AM|PM|am|pm)"
                    className="w-full px-3 py-2 rounded-lg bg-charcoal-mid/50 border border-charcoal-light/50 text-sm text-soft-white placeholder:text-soft-gray/40 focus:outline-none focus:border-electric-blue/50 focus:bg-charcoal-mid/70 transition-all uppercase"
                  />
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-soft-gray/80">
                    <Clock className="w-3 h-3 text-subtle-violet" />
                    <label>Duration</label>
                  </div>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-charcoal-mid/50 border border-charcoal-light/50 text-sm text-soft-white focus:outline-none focus:border-electric-blue/50 focus:bg-charcoal-mid/70 transition-all cursor-pointer appearance-none"
                  >
                    {durationOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-charcoal-mid/50 border border-charcoal-light/50 text-sm text-soft-gray hover:text-soft-white hover:bg-charcoal-mid transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!subject || !time}
                  className={cn(
                    "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all relative overflow-hidden",
                    "disabled:opacity-40 disabled:cursor-not-allowed",
                    "bg-gradient-to-r from-electric-blue to-soft-cyan text-charcoal-deep",
                    "shadow-glow-primary hover:shadow-glow-primary/50",
                    "hover:scale-[1.02] active:scale-[0.98]"
                  )}
                >
                  <span className="relative z-10 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Add
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { AddSessionDialog };
