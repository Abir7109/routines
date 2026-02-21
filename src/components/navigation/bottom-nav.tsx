"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Home, Calendar, Clock, BarChart3, Settings } from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

const navItems: NavItem[] = [
  { id: "home", label: "Home", icon: <Home className="w-6 h-6" /> },
  { id: "schedule", label: "Schedule", icon: <Calendar className="w-6 h-6" /> },
  { id: "focus", label: "Focus", icon: <Clock className="w-6 h-6" /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-6 h-6" /> },
  { id: "settings", label: "Settings", icon: <Settings className="w-6 h-6" /> },
];

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, className }) => {
  return (
    <nav
      className={cn(
        "fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50 glass rounded-2xl border border-white/10 p-2 shadow-xl shadow-black/40",
        className
      )}
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 flex-1",
                isActive
                  ? "text-electric-blue bg-white/5"
                  : "text-soft-gray hover:text-soft-white hover:bg-white/5"
              )}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <div className={cn(
                "relative z-10 flex items-center justify-center transition-transform duration-200",
                isActive ? "scale-110" : ""
              )}>
                {item.icon}
              </div>
              
              <span className={cn(
                "text-[10px] font-medium mt-1 transition-all duration-200",
                isActive ? "text-electric-blue" : "text-soft-gray"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export { BottomNav };
