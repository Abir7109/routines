
import { v4 as uuidv4 } from 'uuid';

// Types matching the Prisma schema/API responses
export interface Session {
  id: string;
  subject: string;
  tag?: string;
  time: string;
  duration: number;
  date: string;
  order: number;
  completed: boolean;
}

export interface FocusSession {
  id: string;
  userId: string;
  subject: string;
  duration: number; // in minutes
  startedAt: string;
  completedAt: string;
  ambientSound?: string;
}

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  bio: string | null;
  avatar: string | null;
  totalSessions: number;
  totalFocusTime: number; // in seconds
}

const STORAGE_KEYS = {
  SCHEDULE: 'student_focus_schedule',
  FOCUS_SESSIONS: 'student_focus_sessions',
  PROFILE: 'student_focus_profile',
};

// Helper to safely access localStorage
const getStorageItem = (key: string, defaultValue: string = '[]'): string => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    return localStorage.getItem(key) || defaultValue;
  } catch (e) {
    console.warn('LocalStorage access failed:', e);
    return defaultValue;
  }
};

const setStorageItem = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn('LocalStorage write failed:', e);
  }
};

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const clientDb = {
  // --- Schedule ---
  getSchedule: async (date: string): Promise<{ items: Session[], date: string }> => {
    await delay(100);
    const allSessions: Session[] = JSON.parse(getStorageItem(STORAGE_KEYS.SCHEDULE));
    const items = allSessions.filter(s => s.date === date).sort((a, b) => a.order - b.order);
    return { items, date };
  },

  addScheduleItem: async (item: Omit<Session, 'id' | 'completed'>): Promise<Session> => {
    await delay(100);
    const allSessions: Session[] = JSON.parse(getStorageItem(STORAGE_KEYS.SCHEDULE));
    const newSession: Session = { ...item, id: uuidv4(), completed: false };
    allSessions.push(newSession);
    setStorageItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(allSessions));
    return newSession;
  },

  toggleScheduleItemComplete: async (id: string, completed: boolean): Promise<void> => {
    await delay(100);
    const allSessions: Session[] = JSON.parse(getStorageItem(STORAGE_KEYS.SCHEDULE));
    const index = allSessions.findIndex(s => s.id === id);
    if (index !== -1) {
      allSessions[index].completed = completed;
      setStorageItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(allSessions));
      
      // If completed, add to focus sessions and update profile stats
      if (completed) {
        const session = allSessions[index];
        await clientDb.recordFocusSession({
          subject: session.subject,
          duration: session.duration,
          ambientSound: 'None'
        });
      }
    }
  },
  
  deleteScheduleItem: async (id: string): Promise<void> => {
    await delay(100);
    const allSessions: Session[] = JSON.parse(getStorageItem(STORAGE_KEYS.SCHEDULE));
    const filtered = allSessions.filter(s => s.id !== id);
    setStorageItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(filtered));
  },

  // --- Focus Sessions ---
  recordFocusSession: async (data: { subject: string, duration: number, ambientSound?: string }): Promise<FocusSession> => {
    await delay(100);
    const sessions: FocusSession[] = JSON.parse(getStorageItem(STORAGE_KEYS.FOCUS_SESSIONS));
    const newSession: FocusSession = {
      id: uuidv4(),
      userId: 'user_default',
      subject: data.subject,
      duration: data.duration,
      startedAt: new Date(Date.now() - data.duration * 60000).toISOString(),
      completedAt: new Date().toISOString(),
      ambientSound: data.ambientSound
    };
    sessions.push(newSession);
    setStorageItem(STORAGE_KEYS.FOCUS_SESSIONS, JSON.stringify(sessions));

    // Update Profile
    const profile = await clientDb.getProfile();
    profile.totalSessions += 1;
    profile.totalFocusTime += data.duration * 60; // seconds
    setStorageItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));

    return newSession;
  },

  // --- Analytics ---
  getAnalytics: async (): Promise<any> => {
    await delay(300);
    const sessions: FocusSession[] = JSON.parse(getStorageItem(STORAGE_KEYS.FOCUS_SESSIONS));
    const profile = await clientDb.getProfile();
    
    // Helper to check if two dates are the same day
    const isSameDay = (d1: Date, d2: Date) => {
      return d1.getFullYear() === d2.getFullYear() &&
             d1.getMonth() === d2.getMonth() &&
             d1.getDate() === d2.getDate();
    };

    // 1. Calculate Weekly Data (Last 7 days)
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      return d;
    });

    const weeklyData = last7Days.map(day => {
      const daySessions = sessions.filter(s => isSameDay(new Date(s.completedAt), day));
      const totalMinutes = daySessions.reduce((acc, s) => acc + s.duration, 0);
      return Math.round((totalMinutes / 60) * 10) / 10; // Hours
    });

    // 2. Calculate Streaks
    // Sort sessions by date descending
    const sortedSessions = [...sessions].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    
    let currentStreak = 0;
    if (sortedSessions.length > 0) {
      // Check if there is a session today or yesterday to keep streak alive
      const lastSessionDate = new Date(sortedSessions[0].completedAt);
      const diffDays = Math.floor((today.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        // Count backwards
        let checkDate = new Date(lastSessionDate);
        currentStreak = 1;
        
        // This is a simplified streak calculation
        // A robust one would check for gaps > 1 day
        const uniqueDates = new Set(sessions.map(s => new Date(s.completedAt).toLocaleDateString()));
        // ... (Skipping complex streak logic for now, using simplified)
        
        // Let's do a better simple streak: count consecutive days backwards from most recent
        // Get all unique dates sorted descending
        const uniqueDatesArr = Array.from(new Set(sessions.map(s => new Date(s.completedAt).toISOString().split('T')[0]))).sort().reverse();
        
        if (uniqueDatesArr.length > 0) {
            const lastDate = new Date(uniqueDatesArr[0]);
            // If last session was today or yesterday, streak is active
            if ((today.getTime() - lastDate.getTime()) < (48 * 60 * 60 * 1000)) {
                 currentStreak = 1;
                 for (let i = 0; i < uniqueDatesArr.length - 1; i++) {
                    const d1 = new Date(uniqueDatesArr[i]);
                    const d2 = new Date(uniqueDatesArr[i+1]);
                    const diffTime = Math.abs(d1.getTime() - d2.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                    if (diffDays === 1) {
                        currentStreak++;
                    } else {
                        break;
                    }
                 }
            } else {
                currentStreak = 0;
            }
        }
      }
    }

    // Longest Streak (Simplified: just track max of current for now or store in profile)
    // For now, let's assume current is the best if it's the only one tracked, or default to current
    const longestStreak = Math.max(currentStreak, 0); // In real app, store this in profile

    // 3. Stats
    const totalFocusHours = Math.round((profile.totalFocusTime / 3600) * 10) / 10;
    const averageSessionLength = sessions.length > 0 ? Math.round(profile.totalFocusTime / 60 / sessions.length) : 0;
    
    // 4. Most Productive Day
    const dayCounts: Record<string, number> = {};
    sessions.forEach(s => {
        const dayName = new Date(s.completedAt).toLocaleDateString('en-US', { weekday: 'long' });
        dayCounts[dayName] = (dayCounts[dayName] || 0) + s.duration;
    });
    let mostProductiveDay = "None";
    let maxDuration = 0;
    Object.entries(dayCounts).forEach(([day, duration]) => {
        if (duration > maxDuration) {
            maxDuration = duration;
            mostProductiveDay = day;
        }
    });

    // 5. Efficiency (Current week vs Last week)
    // Simple comparison of total minutes
    const startOfCurrentWeek = new Date(today);
    startOfCurrentWeek.setDate(today.getDate() - 7);
    const startOfLastWeek = new Date(today);
    startOfLastWeek.setDate(today.getDate() - 14);

    const currentWeekMins = sessions
        .filter(s => new Date(s.completedAt) > startOfCurrentWeek)
        .reduce((acc, s) => acc + s.duration, 0);
        
    const lastWeekMins = sessions
         .filter(s => {
             const d = new Date(s.completedAt);
             return d > startOfLastWeek && d <= startOfCurrentWeek;
         })
         .reduce((acc, s) => acc + s.duration, 0);
 
     let efficiency = "0%";
     if (lastWeekMins > 0) {
         const diff = ((currentWeekMins - lastWeekMins) / lastWeekMins) * 100;
         efficiency = `${diff > 0 ? '+' : ''}${Math.round(diff)}%`;
     } else if (currentWeekMins > 0) {
         efficiency = "+100%";
     }

     const sessionsThisWeek = sessions.filter(s => new Date(s.completedAt) > startOfCurrentWeek).length;
 
     return {
       weeklyData: weeklyData, // For sparkline [0.5, 1.2, ...]
       weeklyBars: weeklyData, // reusing same data for bar chart
       currentStreak,
       longestStreak,
       totalFocusHours,
       totalSessions: profile.totalSessions,
       sessionsThisWeek,
       averageSessionLength,
       mostProductiveDay,
       efficiency
     };
   },

  // --- Profile ---
  getProfile: async (): Promise<UserProfile> => {
    await delay(100);
    const profileStr = getStorageItem(STORAGE_KEYS.PROFILE, '');
    if (profileStr && profileStr !== '[]' && profileStr !== '') return JSON.parse(profileStr);

    const defaultProfile: UserProfile = {
      id: 'user_default',
      name: 'Student',
      email: 'student@example.com',
      bio: 'Focusing on my goals.',
      avatar: null,
      totalSessions: 0,
      totalFocusTime: 0
    };
    setStorageItem(STORAGE_KEYS.PROFILE, JSON.stringify(defaultProfile));
    return defaultProfile;
  },

  updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    await delay(100);
    const profile = await clientDb.getProfile();
    const updated = { ...profile, ...data };
    setStorageItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
    return updated;
  }
};
