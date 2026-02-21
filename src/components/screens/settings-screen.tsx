"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";
import { Switch } from "@/components/ui/switch";
import { ChevronRight, User, Shield, Bell, Palette, Database, Lock, Info } from "lucide-react";

interface SettingsItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  type: "toggle" | "navigate";
  value?: boolean;
  onToggle?: (value: boolean) => void;
  onClick?: () => void;
}

interface SettingsSection {
  id: string;
  title: string;
  items: SettingsItem[];
}

interface SettingsScreenProps {
  className?: string;
  distractionBlockingEnabled?: boolean;
  onDistractionBlockingChange?: (value: boolean) => void;
  ambientSoundsEnabled?: boolean;
  onAmbientSoundsChange?: (value: boolean) => void;
  autoStartTimer?: boolean;
  onAutoStartTimerChange?: (value: boolean) => void;
  theme?: "dark" | "light";
  onThemeChange?: (theme: "dark" | "light") => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({
  className,
  distractionBlockingEnabled = true,
  onDistractionBlockingChange,
  ambientSoundsEnabled = true,
  onAmbientSoundsChange,
  autoStartTimer = false,
  onAutoStartTimerChange,
  theme = "dark",
  onThemeChange,
}) => {
  // Use props from parent instead of local state
  const [settings, setSettings] = React.useState({
    distractionBlocking: distractionBlockingEnabled,
    ambientSounds: ambientSoundsEnabled,
    notifications: true,
    soundEnabled: true,
    autoStart: autoStartTimer,
    syncData: true,
    theme: theme,
  });

  const handleToggle = (key: keyof typeof settings) => (value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));

    // Call parent callbacks to update global state
    switch (key) {
      case "distractionBlocking":
        onDistractionBlockingChange?.(value);
        break;
      case "ambientSounds":
        onAmbientSoundsChange?.(value);
        break;
      case "autoStart":
        onAutoStartTimerChange?.(value);
        break;
    }
  };

  const settingsSections: SettingsSection[] = [
    {
      id: "profile",
      title: "Profile",
      items: [
        {
          id: "manage-profile",
          title: "Manage Profile",
          description: "Edit your name, email, and bio",
          icon: <User className="w-5 h-5" />,
          type: "navigate",
        },
      ],
    },
    {
      id: "account",
      title: "Account",
      items: [
        {
          id: "security",
          title: "Security",
          description: "Password and authentication",
          icon: <Lock className="w-5 h-5" />,
          type: "navigate",
        },
      ],
    },
    {
      id: "focus-mode",
      title: "Focus Mode",
      items: [
        {
          id: "distraction-blocking",
          title: "Distraction Blocking",
          description: "Block distracting apps during focus",
          icon: <Shield className="w-5 h-5" />,
          type: "toggle",
          value: settings.distractionBlocking,
          onToggle: handleToggle("distractionBlocking"),
        },
        {
          id: "ambient-sounds",
          title: "Ambient Sounds",
          description: "Enable background sounds",
          icon: <Bell className="w-5 h-5" />,
          type: "toggle",
          value: settings.ambientSounds,
          onToggle: handleToggle("ambientSounds"),
        },
        {
          id: "auto-start",
          title: "Auto-Start Timer",
          description: "Automatically start when opening focus mode",
          icon: <ChevronRight className="w-5 h-5" />,
          type: "toggle",
          value: settings.autoStart,
          onToggle: handleToggle("autoStart"),
        },
      ],
    },
    {
      id: "preferences",
      title: "Preferences",
      items: [
        {
          id: "notifications",
          title: "Notifications",
          description: "Session reminders and updates",
          icon: <Bell className="w-5 h-5" />,
          type: "toggle",
          value: settings.notifications,
          onToggle: handleToggle("notifications"),
        },
        {
          id: "themes",
          title: "Theme",
          description: settings.theme === "dark" ? "Dark theme" : "Light theme",
          icon: <Palette className="w-5 h-5" />,
          type: "toggle",
          value: settings.theme === "dark",
          onToggle: () => {
            const newTheme = settings.theme === "dark" ? "light" : "dark";
            setSettings(prev => ({ ...prev, theme: newTheme }));
            onThemeChange?.(newTheme);
          },
        },
      ],
    },
    {
      id: "data",
      title: "Data & Backup",
      items: [
        {
          id: "sync",
          title: "Sync & Backup",
          description: "Sync data across devices",
          icon: <Database className="w-5 h-5" />,
          type: "toggle",
          value: settings.syncData,
          onToggle: handleToggle("syncData"),
        },
        {
          id: "export",
          title: "Export Data",
          description: "Download your data",
          icon: <ChevronRight className="w-5 h-5" />,
          type: "navigate",
        },
      ],
    },
    {
      id: "about",
      title: "About",
      items: [
        {
          id: "version",
          title: "Version",
          description: "Student's Routine v1.0.0",
          icon: <Info className="w-5 h-5" />,
          type: "navigate",
        },
      ],
    },
  ];

  return (
    <div className={cn("min-h-screen pb-32 px-4 pt-6", className)}>
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-title text-soft-white">Settings</h1>
        <p className="text-body text-soft-gray mt-2">
          Customize your experience
        </p>
      </header>

      {/* Settings Sections */}
      <div className="space-y-6">
        {settingsSections.map((section) => (
          <section key={section.id}>
            <h2 className="text-meta text-soft-gray mb-3 px-2 uppercase tracking-wider">
              {section.title}
            </h2>
            <GlassCard className="p-0 overflow-hidden">
              {section.items.map((item, index) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between p-4 transition-smooth",
                    index !== section.items.length - 1 && "border-b border-charcoal-light",
                    item.type === "navigate" && "hover:bg-charcoal-light/30 cursor-pointer"
                  )}
                  onClick={() => item.type === "navigate" && item.onClick?.()}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-electric-blue/20 flex items-center justify-center text-electric-blue">
                      {item.icon}
                    </div>
                    <div className="flex-grow min-w-0">
                      <h3 className="text-body text-soft-white mb-1">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-body-small text-soft-gray truncate">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {item.type === "toggle" ? (
                      <Switch
                        checked={item.value || false}
                        onCheckedChange={item.onToggle}
                        className="data-[state=checked]:bg-electric-blue"
                      />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-soft-gray" />
                    )}
                  </div>
                </div>
              ))}
            </GlassCard>
          </section>
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center">
        <p className="text-body-small text-soft-gray">
          Student's Routine © 2024
        </p>
        <p className="text-body-small text-soft-gray mt-1">
          Developed by R S Abir
        </p>
      </footer>
    </div>
  );
};

export { SettingsScreen };
