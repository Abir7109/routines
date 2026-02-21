# COMPLETE PRODUCTION PROMPT: Convert Next.js Web App to Native Android APK

## PROJECT OVERVIEW

You are tasked with converting a production-ready Next.js 16 student productivity web application into a native Android APK. This is a fully functional application with real-time focus tracking, distraction blocking, ambient sounds, scheduling, analytics, and profile management.

### CRITICAL SUCCESS CRITERIA
1. **100% UI Fidelity**: Native app must look and behave EXACTLY like the web version
2. **Zero Compilation Errors**: Build must complete without errors or warnings
3. **All Features Working**: Every feature must function as designed
4. **Production Quality**: Professional app suitable for app store distribution
5. **No Sample Data**: All data must come from actual user activity and database

### NON-NEGOTIABLE REQUIREMENTS
- **DO NOT** modify UI/UX, colors, fonts, layouts, or animations
- **DO NOT** add/remove features or screens
- **DO NOT** change navigation flow or user experience
- **DO NOT** use any hardcoded or sample data
- **MUST** implement native bridge for overlay and app blocking
- **MUST** ensure proper Android permissions handling
- **MUST** follow all best practices for native Android development

---

## TECHNOLOGY STACK

### Web App (Source)
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5 (strict mode)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4 with custom OKLCH color system
- **Components**: Radix UI primitives (shadcn/ui New York style)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **State Management**: React hooks (useState, useEffect)
- **Database**: Prisma ORM with SQLite
- **Theme**: Dark/Light mode with next-themes

### Custom Color System (Must match exactly)
```
electric-blue: oklch(0.6 0.2 250)
soft-cyan: oklch(0.7 0.12 200)
subtle-violet: oklch(0.65 0.15 300)
muted-green: oklch(0.6 0.12 145)
muted-red: oklch(0.55 0.15 25)
charcoal-deep: oklch(0.12 0 0)
charcoal-mid: oklch(0.165 0 0)
charcoal-light: oklch(0.22 0 0)
soft-white: oklch(0.9 0 0)
soft-gray: oklch(0.7 0 0)
glass-surface: oklch(0.18 0 0 / 60%)
glass-border: oklch(1 0 0 / 8%)
```

### Typography
- **Font Family**: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif
- **Font Sizes**:
  - title: 28-32px
  - heading: 20-24px
  - body: 16-18px
  - body-small: 14px
  - meta: 12px

### Design System
- **Glassmorphism**: Backdrop blur 20px, semi-transparent backgrounds (60% opacity), subtle borders
- **Shadows**: "0 4px 24px oklch(0 0 0 / 30%), 0 0 1px oklch(1 0 0 / 5%) inset"
- **Border Radius**: rounded-xl (16px), rounded-2xl (24px), rounded-full
- **Animations**: Smooth transitions (200-300ms), hover scale effects, fade-in animations

---

## APPLICATION SCREENS

### 1. Home Screen (src/components/screens/home-screen.tsx)
**Purpose**: Dashboard showing schedule overview, quick access to focus, progress tracking

**Components**:
- Header with greeting and current time/date
- Focus card with next session info
- Today's schedule list (max 6 visible, scrollable for more)
- Progress card with weekly data visualization
- Streak card with daily streak and weekly bars
- Stats card with total focus hours

**Data Flow**:
- Loads from `/api/schedule?date={today}` for today's sessions
- Loads from `/api/analytics` for weekly data, streaks, productivity metrics
- "Next Focus" shows only if there's an upcoming session
- "No upcoming sessions" shown when no sessions scheduled
- "Start Free Focus" button when no sessions
- "Start" button when continuing from scheduled session

**Key Displays**:
- Today: `{completedToday}/{totalToday}` (e.g., "3/7")
- Planned Time: `0h 0m` (when no data), `2h 30m` (with data)
- This Week: `0h` (no data), `32.3h` (with data)
- Sessions: `0 sessions` (singular), `5 sessions` (plural)
- Avg Session: `0m` (no data), `69m` (with data)
- Best Day: `"—"` (no data), `"Thursday"` (with data)
- Current Streak: `0` (no data), `7` (with data)
- Best Streak: `0 days` (no data), `14 days` (with data)
- Efficiency: `"—"` (no data), `"+12%"` (with data)

**IMPORTANT**: All data comes from real API calls. No hardcoded values anywhere.

### 2. Focus Screen (src/components/screens/focus-screen.tsx)
**Purpose**: Fullscreen immersive focus mode with timer, distraction blocking, ambient sounds

**Components**:
- Minimal top bar with "Focus Mode" label and X button
- Subject display (conditional - only shows when continuing from schedule session)
- Large circular focus timer (central element)
- Timer controls: Reset and Start/Pause buttons
- Quick time selection (5, 10, 15, 20, 25, 30, 45, 60 minutes)
- Custom time dialog with hours/minutes input
- Ambient sound selector (when enabled in settings)
- Distraction blocking card with blocked apps list
- Subject display: Shows only when `selectedSession?.subject` is passed

**Native Bridge Integration**:
```typescript
// From src/lib/native-bridge.ts - MUST implement exactly
window.FocusBlocking = {
  startFocus(options: { totalTime: number }): Promise<{ success: boolean }>;
  stopFocus(): Promise<{ success: boolean }>;
  updateTime(options: {
    timeLeft: number;
    isRunning: boolean;
    totalTime: number;
  }): Promise<{ success: boolean }>;
  checkOverlayPermission(): Promise<{ hasPermission: boolean }>;
  requestOverlayPermission(): Promise<{ success: boolean }>;
  checkUsageStatsPermission(): Promise<{ hasPermission: boolean }>;
  updateBlockedApps(apps: Array<{ id: string; packageName: string }>): Promise<{ success: boolean }>;
};
```

**Data Flow**:
- User selects duration (preset or custom)
- Web app calculates totalTime in seconds
- Calls `nativeBridge.startFocus(totalTime * 1000)` (convert to ms)
- Native service starts foreground service
- Overlay appears with timer display
- Every second, web app calls `nativeBridge.updateTime(timeLeft, isRunning, totalTime)`
- Overlay updates in real-time
- When paused/stopped, calls `nativeBridge.stopFocus()`

**Blocked Apps** (configurable, stored in database):
```typescript
const blockedApps = [
  { id: "instagram", name: "Instagram", icon: InstagramIcon, packageName: "com.instagram.android" },
  { id: "twitter", name: "Twitter", icon: TwitterIcon, packageName: "com.twitter.android" },
  { id: "tiktok", name: "TikTok", icon: MusicIcon, packageName: "com.zhiliaoapp.musically" },
  { id: "youtube", name: "YouTube", icon: YoutubeIcon, packageName: "com.google.android.youtube" },
];
```

**Subject Display Behavior**:
- When user clicks "Start" on scheduled session → passes session object to FocusScreen
- FocusScreen receives `selectedSession` prop
- Displays subject in pill: `"{selectedSession?.subject}"`
- When user starts "Free Focus" → no subject displayed
- Clean UI with or without subject based on context

**CRITICAL**: Subject display is 100% conditional based on real schedule data. No hardcoded subject.

### 3. Schedule Screen (src/components/screens/schedule-screen.tsx)
**Purpose**: Manage daily schedule with add/edit/delete/complete sessions

**Components**:
- Header with current date and "Add Session" button
- Schedule list with time slots
- Each item shows: time, subject, tag, completion status
- Dropdown menu with options: Mark Done/Pending, Edit, Delete
- Empty state when no sessions scheduled

**Data Flow**:
- Loads from `/api/schedule?date={today}`
- User adds session → POST to `/api/schedule`
- User marks complete → PATCH to `/api/schedule/{id}`
  - Creates FocusSession in database
  - Updates DailyStats
- User deletes → DELETE to `/api/schedule/{id}`

**Session Item Structure**:
```typescript
{
  id: string,
  subject: string,
  time: string,  // "09:00 AM" (12-hour format)
  duration: string,  // "60 min"
  tag: string,  // e.g., "Science", "Math", "Arts"
  completed: boolean,
  order: number
}
```

**Tags and Colors**:
- Science: bg-electric-blue/20 text-electric-blue
- Math: bg-soft-cyan/20 text-soft-cyan
- Arts: bg-subtle-violet/20 text-subtle-violet
- CS: bg-muted-green/20 text-muted-green
- General: bg-soft-gray/20 text-soft-gray

**CRITICAL**: All sessions come from database. No sample data.

### 4. Profile Screen (src/components/screens/profile-screen.tsx)
**Purpose**: User profile management with editing capabilities

**Components**:
- Avatar display with camera upload button
- Name input (editable)
- Email input (disabled - cannot be changed)
- Bio textarea (editable, max 200 characters)
- Edit/Cancel/Save workflow with visual feedback
- Account settings section with "Change Password" option
- Account stats cards: Focus Sessions, Total Focus Time

**Data Flow**:
- Loads from `/api/profile`
- User edits → PUT to `/api/profile` with name and bio
- Displays real stats from database (totalSessions, totalFocusTime)

**Stats Display** (from database):
- Focus Sessions: `0` (no data), `127` (with data)
- Total Focus Time: `0h` (no data), `24.5h` (with data)

**Loading States**:
- Shows spinner when loading
- Shows "Loading profile..." message

**Editing States**:
- Input fields disabled when not editing
- Save button with loading state
- Visual feedback: "Saving...", "Saved!", "Failed", "Save Changes"

**Validation**:
- Name: 2-50 characters, required
- Email: Valid email format (immutable)
- Bio: Max 200 characters, optional

**CRITICAL**: No default profile data. All loads from API.

### 5. Analytics Screen (src/components/screens/analytics-screen.tsx)
**Purpose**: Visualize focus data with charts and statistics

**Components**:
- Header with "This Week" label
- Quick stats cards: Total Hours, Sessions, Avg Session, Day Streak
- Weekly Focus Hours bar chart (Recharts)
- Monthly Trend line chart (Recharts)
- Subject Distribution progress bars
- Empty state when no data available

**Data Flow**:
- Loads from `/api/analytics`
- Calculates all metrics from real FocusSession data in database

**Charts Data** (all from real database):
```typescript
weeklyFocusData: [
  { day: "Mon", hours: 0 },  // 0 when no data, real hours when data
  { day: "Tue", hours: 5.2 },
  { day: "Wed", hours: 3.8 },
  { day: "Thu", hours: 6.1 },
  { day: "Fri", hours: 5.5 },
  { day: "Sat", hours: 4.0 },
  { day: "Sun", hours: 3.2 },
];

subjectDistribution: [
  { subject: "Mathematics", hours: 12.5, color: "oklch(0.6 0.2 250)" },
  { subject: "Physics", hours: 9.8, color: "oklch(0.7 0.12 200)" },
  { subject: "Chemistry", hours: 7.2, color: "oklch(0.65 0.15 300)" },
  { subject: "Literature", hours: 6.5, color: "oklch(0.6 0.12 145)" },
  { subject: "Programming", hours: 11.0, color: "oklch(0.55 0.15 25)" },
];

monthlyTrend: [
  { week: "W1", sessions: 0, hours: 0 },
  { week: "W2", sessions: 0, hours: 0 },
  { week: "W3", sessions: 0, hours: 0 },
  { week: "W4", sessions: 0, hours: 0 },
];
```

**Stats Display**:
- Total Hours: `0h` (no data), `32.3h` (calculated)
- Sessions: `0` (no data), `28` (from DB)
- Avg Session: `0m` (no data), `69m` (calculated)
- Day Streak: `0` (no data), `7` (from DB)

**Empty State**:
- When no subject data → "No data available yet"
- Message: "Start a focus session to see your subject distribution"

**CRITICAL**: All charts use real calculated data. No fake values.

### 6. Settings Screen (src/components/screens/settings-screen.tsx)
**Purpose**: App-wide configuration and preferences

**Components**:
- Focus Mode settings: Distraction Blocking, Auto-Start Timer
- Audio settings: Ambient Sounds toggle
- Theme toggle: Dark/Light mode
- Account section: Profile management
- Other settings: Notifications (placeholder), Sync & Backup (placeholder), Export Data (placeholder), Security (placeholder)

**Settings State Management** (from page.tsx):
```typescript
const [distractionBlockingEnabled, setDistractionBlockingEnabled] = useState(true);
const [ambientSoundsEnabled, setAmbientSoundsEnabled] = useState(true);
const [autoStartTimer, setAutoStartTimer] = useState(false);
const [appTheme, setAppTheme] = useState<"dark" | "light">("dark");
```

**Theme Implementation**:
- Dark mode (default): Applies `dark` class to document
- Light mode: Applies `light` class to document
- Theme affects: All screens and components
- Color variables defined in tailwind.config.ts

**Working Settings**:
✅ Distraction Blocking - Controls blocking visibility in Focus Screen
✅ Ambient Sounds - Controls sound selector visibility
✅ Auto-Start Timer - Auto-starts when entering Focus Screen
✅ Theme - Switches Dark/Light modes with immediate app-wide effect
✅ Profile - Navigates to Profile screen

Placeholder Settings (not implemented yet):
⚠️ Notifications - Toggle only, no actual functionality
⚠️ Sync & Backup - Toggle only, no sync logic
⚠️ Export Data - Navigation only, no export logic
⚠️ Security - Visual only, no functionality

---

## DATABASE SCHEMA (prisma/schema.prisma)

### Models

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  settings          UserSettings?
  focusSessions     FocusSession[]
  scheduleItems     ScheduleItem[]
  dailyStats        DailyStats[]
  weeklyStreaks     WeeklyStreak[]
}

model UserSettings {
  id                    String   @id @default(cuid())
  userId                String   @unique
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  distractionBlocking  Boolean  @default(true)
  ambientSoundsEnabled Boolean  @default(true)
  notificationsEnabled Boolean  @default(true)
  soundEnabled         Boolean  @default(true)
  autoStartTimer       Boolean  @default(false)
  syncDataEnabled      Boolean  @default(true)

  defaultSessionDuration Int     @default(25) // minutes
  defaultBreakDuration   Int     @default(5)  // minutes

  preferredAmbientSound String?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

model FocusSession {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  subject     String
  duration    Int      // in seconds
  completed   Boolean  @default(false)
  pausedAt    DateTime?

  ambientSound String?

  startedAt   DateTime @default(now())
  completedAt DateTime?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@index([startedAt])
}

model ScheduleItem {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  subject     String
  tag         String?  // e.g., Science, Math, Arts
  date        String   // YYYY-MM-DD
  time        String   // HH:mm
  duration    Int      // in minutes

  completed   Boolean  @default(false)
  order       Int      // for drag-and-drop ordering

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId, date])
  @@index([userId, date, order])
}

model DailyStats {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  date            String   // YYYY-MM-DD
  totalFocusTime  Int      @default(0) // in seconds
  sessionsCount   Int      @default(0)
  sessionsCompleted Int     @default(0)

  // Subject-wise breakdown (JSON string for SQLite)
  subjectBreakdown String? // JSON: { "Math": 3600, "Physics": 1800 }

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([userId, date])
  @@index([userId])
}

model WeeklyStreak {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  weekStart       String   // YYYY-MM-DD (Monday)
  streakDays      Int      @default(0) // consecutive days with focus
  longestStreak   Int      @default(0) // longest streak in this week

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([userId, weekStart])
  @@index([userId])
}
```

**IMPORTANT**: Prisma schema is already defined. Do not modify it.

---

## API ROUTES

### Profile API (src/app/api/profile/route.ts)

**GET /api/profile**
- Returns user profile with statistics
- Response structure:
```json
{
  "id": "string",
  "name": "string | null",
  "email": "string",
  "bio": "string | null",
  "avatar": "string | null",
  "totalSessions": number,
  "totalFocusTime": number
}
```
- Creates default user if none exists
- Calculates totalSessions and totalFocusTime from completed FocusSession records

**PUT /api/profile**
- Updates user profile (name, bio)
- Validation:
  - Name: 2-50 characters, required
  - Bio: Max 200 characters, optional
- Returns success/failure with error messages
- Updates user settings if bio provided

### Schedule API (src/app/api/schedule/route.ts)

**GET /api/schedule?date={YYYY-MM-DD}**
- Returns schedule items for specific date
- Response structure:
```json
{
  "items": [
    {
      "id": "string",
      "subject": "string",
      "time": "string",  // "09:00 AM" format
      "duration": "string",  // "60 min"
      "tag": "string",
      "completed": boolean,
      "order": number
    }
  ],
  "date": "YYYY-MM-DD"
}
```
- Formats time to 12-hour format (HH:mm AM/PM)
- Orders by `order` field

**POST /api/schedule**
- Creates new schedule item
- Request body:
```json
{
  "subject": "string",
  "tag": "string | null",
  "time": "string",  // HH:mm 24-hour format
  "duration": number,  // in minutes
  "date": "string",  // YYYY-MM-DD
  "order": number
}
```
- Validation:
  - Subject, time, duration, date are required
  - Duration must be positive number
  - Time must match HH:mm format

### Schedule Item API (src/app/api/schedule/[id]/route.ts)

**PATCH /api/schedule/{id}**
- Toggles session completion status
- Request body: `{ "completed": boolean }`
- Side effect: When marking as completed, creates FocusSession in database
- Updates DailyStats:
  - sessionsCount + 1
  - sessionsCompleted + 1 (if completed)
  - totalFocusTime + session duration (in seconds)

**DELETE /api/schedule/{id}**
- Deletes schedule item by ID
- Returns `{ "success": true }`

### Analytics API (src/app/api/analytics/route.ts)

**GET /api/analytics**
- Returns all analytics data calculated from database
- Response structure:
```json
{
  "weeklyFocusData": [
    { "day": "Mon", "hours": 0 },
    { "day": "Tue", "hours": 5.2 },
    ...
  ],
  "subjectDistribution": [
    { "subject": "Mathematics", "hours": 12.5, "color": "oklch(0.6 0.2 250)" },
    ...
  ],
  "monthlyTrend": [
    { "week": "W1", "sessions": 0, "hours": 0 },
    { "week": "W2", "sessions": 0, "hours": 0 },
    ...
  ],
  "totalFocusHours": 32.3,
  "totalSessions": 28,
  "averageSessionLength": 69,
  "weeklyStreak": 7,
  "longestStreak": 14,
  "mostProductiveDay": "Thursday",
  "weeklyData": [3.5, 4.2, 3.8, 6.1, 5.5, 4.0, 3.2],
  "weeklyBars": [4, 5, 6, 7, 6, 5, 7],
  "currentStreak": 7,
  "bestStreak": 14,
  "sessionsThisWeek": 28,
  "totalFocusWeek": 32.3,
  "avgSessionLength": 69,
  "mostProductiveDay": "Thursday",
  "efficiency": "+12%"
}
```

**Calculations**:
- weeklyFocusData: Focus time per day (Mon-Sun) from DailyStats
- subjectDistribution: Top 5 subjects by hours, assigned colors from palette
- monthlyTrend: Last 4 weeks of session/hour counts
- totalFocusHours: Sum of all completed FocusSession durations (in hours)
- totalSessions: Count of completed FocusSession records
- averageSessionLength: Average duration of all completed sessions (in minutes)
- weeklyStreak: Current consecutive days with completed sessions
- longestStreak: Maximum streak in WeeklyStreak records
- mostProductiveDay: Day with highest total focus time
- efficiency: Percentage change vs last week
- weeklyBars: Session count per day (max 7 for display)
- currentStreak, bestStreak: Streak metrics

**Empty Data Handling**:
- Returns all zeros or empty arrays when no data exists
- Charts show empty state or zero values
- No hardcoded sample values anywhere

---

## NATIVE BRIDGE IMPLEMENTATION

### Overview
The web app uses a native bridge to communicate with Android for focus timer overlay and app blocking. The interface is defined in `src/lib/native-bridge.ts` and must be implemented exactly as specified.

### Platform Choice: Capacitor (RECOMMENDED)
**Why Capacitor**:
- Preserves existing web UI perfectly via WebView
- Minimal code changes required
- Excellent native bridge support
- Quick development and maintenance
- Proven for production apps

### Setup Instructions

**Step 1: Install Dependencies**
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npm install -D @capacitor/assets
```

**Step 2: Initialize Capacitor**
```bash
npx cap init StudentFocus com.studentfocus.app --web-dir=.next
```

**Step 3: Configure capacitor.config.ts**
Create `capacitor.config.ts` in project root:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.studentfocus.app',
  appName: 'StudentFocus',
  webDir: '.next',
  server: {
    androidScheme: 'https'
  },
  android: {
    buildOptions: {
      signingType: 'apksigner'
    }
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1E1E1E',  // charcoal-deep
      splashFullScreen: true,
      splashImmersive: true,
      androidScaleType: 'CENTER_CROP',
      backgroundColor: '#1E1E1E'
    }
  }
};

export default config;
```

**Step 4: Add Android Platform**
```bash
npx cap add android
```

**Step 5: Build Web App**
```bash
bun run build
```

**Step 6: Sync with Android**
```bash
npx cap sync android
```

---

## NATIVE ANDROID IMPLEMENTATION

### File: android/app/src/main/java/com/studentfocus/app/FocusBlockingPlugin.java

```java
package com.studentfocus.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.app.AppOpsManager;
import android.content.Context;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "FocusBlocking")
public class FocusBlockingPlugin extends Plugin {

    private static final String TAG = "FocusBlocking";

    @PluginMethod
    public void startFocus(PluginCall call) {
        try {
            // CRITICAL: Get ACTUAL totalTime from web app, NO DEFAULT
            int totalTime = call.getInt("totalTime", 0);

            if (totalTime <= 0) {
                Log.e(TAG, "Invalid totalTime received: " + totalTime);
                JSObject ret = new JSObject();
                ret.put("success", false);
                call.resolve(ret);
                return;
            }

            Intent serviceIntent = new Intent(getContext(), FocusService.class);
            serviceIntent.putExtra("totalTime", totalTime);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(serviceIntent);
            } else {
                getContext().startService(serviceIntent);
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);

            Log.d(TAG, "Focus service started with totalTime: " + totalTime + "ms");
        } catch (Exception e) {
            Log.e(TAG, "Error starting focus", e);
            JSObject ret = new JSObject();
            ret.put("success", false);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void stopFocus(PluginCall call) {
        try {
            Intent serviceIntent = new Intent(getContext(), FocusService.class);
            getContext().stopService(serviceIntent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);

            Log.d(TAG, "Focus service stopped");
        } catch (Exception e) {
            Log.e(TAG, "Error stopping focus", e);
            JSObject ret = new JSObject();
            ret.put("success", false);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void updateTime(PluginCall call) {
        try {
            // CRITICAL: Get ACTUAL data from web app
            int timeLeft = call.getInt("timeLeft", 0);
            boolean isRunning = call.getBoolean("isRunning", false);
            int totalTime = call.getInt("totalTime", 0);

            // Update running service with real data
            if (FocusService.getInstance() != null) {
                FocusService.getInstance().updateTimerDisplay(timeLeft, isRunning, totalTime);
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);

            Log.d(TAG, "Time updated: " + timeLeft + "s, running: " + isRunning);
        } catch (Exception e) {
            Log.e(TAG, "Error updating time", e);
            JSObject ret = new JSObject();
            ret.put("success", false);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void checkOverlayPermission(PluginCall call) {
        try {
            boolean hasPermission = Settings.canDrawOverlays(getContext());

            JSObject ret = new JSObject();
            ret.put("hasPermission", hasPermission);
            call.resolve(ret);

            Log.d(TAG, "Overlay permission: " + hasPermission);
        } catch (Exception e) {
            Log.e(TAG, "Error checking overlay permission", e);
            JSObject ret = new JSObject();
            ret.put("hasPermission", false);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getContext().getPackageName()));
            startActivityForResult(call, intent, "overlayPermissionResult");

            call.resolve();
        } catch (Exception e) {
            Log.e(TAG, "Error requesting overlay permission", e);
            call.reject("Failed to request overlay permission");
        }
    }

    @PluginMethod
    public void checkUsageStatsPermission(PluginCall call) {
        try {
            AppOpsManager appOps = (AppOpsManager) getContext()
                    .getSystemService(Context.APP_OPS_SERVICE);

            int mode;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                mode = appOps.unsafeCheckOpNoThrow(
                        AppOpsManager.OPSTR_GET_USAGE_STATS,
                        android.os.Process.myUid(),
                        getContext().getPackageName()
                );
            } else {
                mode = appOps.checkOpNoThrow(
                        AppOpsManager.OPSTR_GET_USAGE_STATS,
                        android.os.Process.myUid(),
                        getContext().getPackageName()
                );
            }

            boolean hasPermission = mode == AppOpsManager.MODE_ALLOWED;

            JSObject ret = new JSObject();
            ret.put("hasPermission", hasPermission);
            call.resolve(ret);

            Log.d(TAG, "Usage stats permission: " + hasPermission);
        } catch (Exception e) {
            Log.e(TAG, "Error checking usage stats permission", e);
            JSObject ret = new JSObject();
            ret.put("hasPermission", false);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void updateBlockedApps(PluginCall call) {
        try {
            // CRITICAL: Get ACTUAL blocked apps from web app
            // The web app sends REAL user-configured apps
            JSArray appsArray = call.getArray("apps");
            
            // Log for debugging
            if (appsArray != null) {
                Log.d(TAG, "Blocked apps updated: " + appsArray.length() + " apps");
            }

            // Pass to service
            if (FocusService.getInstance() != null) {
                FocusService.getInstance().setBlockedAppsList(appsArray);
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);

            Log.d(TAG, "Blocked apps updated in native service");
        } catch (Exception e) {
            Log.e(TAG, "Error updating blocked apps", e);
            JSObject ret = new JSObject();
            ret.put("success", false);
            call.resolve(ret);
        }
    }

    @Override
    protected void handleOnActivityResult(PluginCall call, int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(call, requestCode, resultCode, data);

        if ("overlayPermissionResult".equals(call.getMethodName())) {
            boolean granted = Settings.canDrawOverlays(getContext());
            JSObject ret = new JSObject();
            ret.put("success", granted);
            call.resolve(ret);

            Log.d(TAG, "Overlay permission result: " + granted);
        }
    }
}
```

### File: android/app/src/main/java/com/studentfocus/app/FocusService.java

```java
package com.studentfocus.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.IBinder;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.TextView;
import androidx.core.app.NotificationCompat;
import org.json.JSONArray;
import org.json.JSONException;
import java.util.List;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class FocusService extends Service {
    private static final String TAG = "FocusService";
    private static final String CHANNEL_ID = "FocusChannel";
    private static final int NOTIFICATION_ID = 1;

    private static FocusService instance;

    private WindowManager windowManager;
    private View overlayView;
    private TextView timeLeftTextView;
    private TextView statusTextView;
    private ProgressBar progressBar;
    private Button pauseResumeButton;

    private int timeLeft = 0;
    private int totalTime = 0;
    private boolean isRunning = false;
    private JSONArray blockedApps = new JSONArray();

    private ScheduledExecutorService scheduler;
    private ScheduledFuture<?> scheduledTask;

    public static FocusService getInstance() {
        return instance;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && intent.hasExtra("totalTime")) {
            // CRITICAL: Get ACTUAL totalTime from web app, NO DEFAULT
            totalTime = intent.getIntExtra("totalTime", 0);
            timeLeft = totalTime;
            isRunning = true;

            Log.d(TAG, "Service started with totalTime: " + totalTime + "s");
        }

        startForeground(NOTIFICATION_ID, createNotification());
        showOverlay();
        startTimer();

        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        dismissOverlay();
        stopTimer();
        instance = null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Focus Mode",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Focus mode timer notification");
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }

    private Notification createNotification() {
        Intent notificationIntent = new Intent(this, com.getcapacitor.android.MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                notificationIntent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        // CRITICAL: Display ACTUAL time from web app, no placeholders
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Focus Mode")
                .setContentText(formatTime(timeLeft))
                .setSmallIcon(android.R.drawable.ic_notification)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();
    }

    private String formatTime(int seconds) {
        int minutes = seconds / 60;
        int secs = seconds % 60;
        return String.format("%d:%02d remaining", minutes, secs);
    }

    private void showOverlay() {
        try {
            windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
            LayoutInflater inflater = (LayoutInflater) getSystemService(LAYOUT_INFLATER_SERVICE);

            overlayView = inflater.inflate(getOverlayLayoutId(), null);

            timeLeftTextView = (TextView) overlayView.findViewById(
                    getResources().getIdentifier("time_left", "id", getPackageName())
            );
            statusTextView = (TextView) overlayView.findViewById(
                    getResources().getIdentifier("status", "id", getPackageName())
            );
            progressBar = (ProgressBar) overlayView.findViewById(
                    getResources().getIdentifier("progress_bar", "id", getPackageName())
            );
            pauseResumeButton = (Button) overlayView.findViewById(
                    getResources().getIdentifier("pause_resume", "id", getPackageName())
            );

            if (pauseResumeButton != null) {
                pauseResumeButton.setOnClickListener(v -> toggleTimer());
            }

            // CRITICAL: Initialize with ACTUAL data, no defaults
            updateOverlay();

            WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                    WindowManager.LayoutParams.MATCH_PARENT,
                    WindowManager.LayoutParams.WRAP_CONTENT,
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL |
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                    PixelFormat.TRANSLUCENT
            );
            params.gravity = Gravity.TOP;

            windowManager.addView(overlayView, params);

            Log.d(TAG, "Overlay displayed with timeLeft: " + timeLeft);
        } catch (Exception e) {
            Log.e(TAG, "Error showing overlay", e);
        }
    }

    private void dismissOverlay() {
        try {
            if (windowManager != null && overlayView != null) {
                windowManager.removeView(overlayView);
                overlayView = null;
                windowManager = null;

                Log.d(TAG, "Overlay dismissed");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error dismissing overlay", e);
        }
    }

    private void updateOverlay() {
        // CRITICAL: Display ACTUAL data from web app
        if (timeLeftTextView != null) {
            timeLeftTextView.setText(formatTime(timeLeft));
        }

        if (statusTextView != null) {
            // Status based on ACTUAL running state from web app
            statusTextView.setText(isRunning ? "Active" : "Paused");
        }

        if (progressBar != null) {
            // Calculate progress from ACTUAL values
            int progress = totalTime > 0 ? (int) ((totalTime - timeLeft) * 100.0 / totalTime) : 0;
            progressBar.setProgress(progress);
        }

        if (pauseResumeButton != null) {
            pauseResumeButton.setText(isRunning ? "Pause" : "Resume");
        }
    }

    private void startTimer() {
        if (scheduler != null && !scheduler.isShutdown()) {
            return;
        }

        scheduler = (ScheduledExecutorService) Executors.newSingleThreadScheduledExecutor();
        scheduledTask = scheduler.scheduleAtFixedRate(() -> {
            if (isRunning && timeLeft > 0) {
                timeLeft--;
                updateOverlay();
            } else if (timeLeft == 0) {
                stopTimer();
                runOnUiThread(() -> {
                    dismissOverlay();
                    stopSelf();
                });
            }
        }, 1, 1, TimeUnit.SECONDS);

        Log.d(TAG, "Timer started");
    }

    private void stopTimer() {
        if (scheduledTask != null && !scheduledTask.isCancelled()) {
            scheduledTask.cancel(true);
        }
        if (scheduler != null && !scheduler.isShutdown()) {
            scheduler.shutdown();
        }

        Log.d(TAG, "Timer stopped");
    }

    private void toggleTimer() {
        // CRITICAL: Notify web app of state change
        isRunning = !isRunning;
        updateOverlay();

        // TODO: Implement web bridge callback to notify web app
        // This would require adding a callback method to the bridge
        Log.d(TAG, "Timer toggled to: " + isRunning);
    }

    // Called from plugin with ACTUAL data
    public void updateTimerDisplay(int newTimeLeft, boolean running, int newTotalTime) {
        this.timeLeft = newTimeLeft;
        this.isRunning = running;
        this.totalTime = newTotalTime;

        Log.d(TAG, "Timer display updated: " + newTimeLeft + "s, running: " + running);

        if (overlayView != null) {
            updateOverlay();
        // Restart timer if needed
            if (running && scheduledTask == null) {
                startTimer();
            }
        }
    }

    // Called from plugin with ACTUAL blocked apps
    public void setBlockedAppsList(JSONArray apps) {
        this.blockedApps = apps != null ? apps : new JSONArray();

        Log.d(TAG, "Blocked apps list updated: " + apps.length() + " apps");
    }

    private int getOverlayLayoutId() {
        return getResources().getIdentifier("overlay_timer", "layout", getPackageName());
    }
}
```

### File: android/app/src/main/res/layout/overlay_timer.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:orientation="vertical"
    android:background="#E61E1E1E"
    android:padding="12dp"
    android:elevation="8dp">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="center_vertical"
        android:padding="8dp"
        android:background="#3D2A2A2A"
        android:layout_margin="6dp">

        <!-- CRITICAL: Initial empty, populated with ACTUAL data -->
        <TextView
            android:id="@+id/time_left"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text=""
            android:textSize="24sp"
            android:textColor="#E6E6E6"
            android:fontFamily="sans-serif-medium" />

        <!-- CRITICAL: Initial empty, populated with ACTUAL status -->
        <TextView
            android:id="@+id/status"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text=""
            android:textSize="14sp"
            android:textColor="#6366F1"
            android:layout_marginStart="12dp" />

        <View
            android:layout_width="0dp"
            android:layout_height="1dp"
            android:layout_weight="1" />

        <!-- CRITICAL: Initial empty, populated with ACTUAL button text -->
        <Button
            android:id="@+id/pause_resume"
            android:layout_width="wrap_content"
            android:layout_height="32dp"
            android:text=""
            android:textSize="12sp"
            android:background="#383838"
            android:textColor="#E6E6E6"
            android:minWidth="80dp" />
    </LinearLayout>

    <!-- CRITICAL: Initial 0, updated with ACTUAL progress -->
    <ProgressBar
        android:id="@+id/progress_bar"
        android:layout_width="match_parent"
        android:layout_height="4dp"
        android:progress="0"
        android:max="100"
        android:progressTint="#6366F1"
        style="?android:attr/progressBarStyleHorizontal" />
</LinearLayout>
```

### File: android/app/src/main/AndroidManifest.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.studentfocus.app">

    <!-- CRITICAL: All required permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.PACKAGE_USAGE_STATS" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/AppTheme">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:screenOrientation="portrait">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- CRITICAL: Foreground service with overlay -->
        <service
            android:name=".FocusService"
            android:exported="false"
            android:foregroundServiceType="specialUse">
            <property
                android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
                android:value="focus_timer" />
        </service>
    </application>
</manifest>
```

### File: android/app/src/main/res/values/styles.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
        <item name="colorPrimary">#6366F1</item>  <!-- electric-blue -->
        <item name="colorPrimaryDark">#1E1E1E</item>  <!-- charcoal-deep -->
        <item name="colorAccent">#6366F1</item>  <!-- electric-blue -->
        <item name="android:windowBackground">#1E1E1E</item>  <!-- charcoal-deep -->
        <item name="android:statusBarColor">#1E1E1E</item>  <!-- charcoal-deep -->
        <item name="android:navigationBarColor">#1E1E1E</item>  <!-- charcoal-deep -->
    </style>

    <style name="AppTheme.NoActionBarLaunch" parent="AppTheme">
        <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>
        <item name="android:windowTranslucentStatus">true</item>
        <item name="android:windowTranslucentNavigation">true</item>
    </style>
</resources>
```

---

## CRITICAL IMPLEMENTATION DETAILS

### Data Flow Architecture

1. **User Opens App**
   - App loads Home Screen
   - Makes API call to `/api/schedule?date={today}`
   - Makes API call to `/api/analytics`
   - Displays real data or empty states

2. **User Views Schedule**
   - Loads today's sessions from API
   - Shows real sessions with completion status
   - User can add/edit/delete sessions

3. **User Starts Focus from Schedule**
   - User clicks "Start" on a session
   - Session object passed to FocusScreen
   - Subject displays from `selectedSession?.subject`
   - Timer uses duration from session

4. **User Starts Free Focus**
   - User clicks "Start Free Focus" (no session)
   - FocusScreen opens without subject display
   - User selects duration (preset or custom)

5. **Focus Mode Activated**
   - Web app calls `nativeBridge.startFocus(totalTime * 1000)`
   - Native service starts with ACTUAL totalTime
   - Foreground service created
   - Overlay appears at top of screen
   - Notification shows with timer

6. **Timer Running**
   - Web app counts down every second
   - Calls `nativeBridge.updateTime(timeLeft, isRunning, totalTime)` each second
   - Native overlay updates with ACTUAL time
   - Progress bar updates with ACTUAL percentage

7. **Focus Session Completed**
   - Timer reaches 0
   - Native service stops
   - Overlay dismissed
   - FocusSession created in database with real duration

8. **Session Marked Complete in Schedule**
   - User marks session as done
   - PATCH to `/api/schedule/{id}`
   - Creates FocusSession in database
   - Updates DailyStats with ACTUAL duration

9. **User Views Analytics**
   - Loads all data from `/api/analytics`
  - Charts display real calculated data
  - Stats show ACTUAL totals from database
  - Empty states when no data

10. **User Views Profile**
   - Loads from `/api/profile`
  - Shows real stats from database
  - User can edit name and bio
  - Changes saved to database

### Zero Sample Data Policy

**Absolutely NO hardcoded values anywhere:**
- No default subjects (e.g., "Advanced Mathematics")
- No default times (e.g., "25 minutes", "75m today")
- No default stats (e.g., "3 sessions", "7 days streak")
- No default schedule items
- No default analytics values (e.g., "32.3 hours", "28 sessions")

**All data must come from:**
- Database queries
- API responses
- User input/actions
- Calculations from real data

---

## BUILD AND DEPLOYMENT

### Build Commands

**Step 1: Build Web Application**
```bash
bun run build
```
Verify:
- `.next` directory exists
- No build errors
- All static assets included

**Step 2: Sync with Capacitor**
```bash
npx cap sync android
```
Verify:
- Assets copied to Android project
- Config applied correctly

**Step 3: Open Android Studio**
```bash
npx cap open android
```

**Step 4: Build Release APK**
1. In Android Studio: Build > Generate Signed Bundle / APK
2. Select APK
3. Create or use existing keystore
4. Build release
5. APK location: `android/app/build/outputs/apk/release/`

### Build Verification Checklist

Before considering build complete, verify:

**Compilation:**
- [ ] No compilation errors
- [ ] No build warnings
- [ ] All dependencies resolved
- [ ] ProGuard rules applied (if using release build)

**Functionality:**
- [ ] App installs successfully
- [ ] App launches without crashing
- [ ] All 6 screens accessible
- [ ] Navigation works correctly
- [ ] WebView loads web content
- [ ] Native bridge methods work
- [ ] Timer functions correctly
- [ ] Overlay appears/disappears correctly
- [ ] Permissions requested properly

**UI Fidelity:**
- [ ] Colors match web version exactly
- [ ] Fonts match exactly
- [ ] Layouts match exactly
- [ ] Animations are smooth
- [ ] Glassmorphism effects visible
- [ ] Dark/Light theme works
- [ ] Responsive on all screen sizes

**Features:**
- [ ] Focus timer works
- [ ] Time presets work
- [ ] Custom time input works
- [ ] Ambient sounds play
- [ ] Settings toggles work
- [ ] Schedule management works
- [ ] Profile editing works
- [ ] Analytics display correctly
- [ ] All data loads from database
- [ ] No sample data anywhere

**Native Features:**
- [ ] Overlay permission requested
- [ ] Usage stats permission requested
- [ ] Overlay appears when focus starts
- [ ] Overlay updates in real-time
- [ ] Overlay dismissible
- [ ] Foreground service runs
- [ ] Notification shows when active
- [ ] App blocking configured (can be enhanced)

---

## TROUBLESHOOTING

### Common Issues and Solutions

**Issue 1: Build Fails with "No such module"**
- Solution: Run `bun install` to install dependencies
- Solution: Clear `.next` directory and rebuild
- Solution: Run `bun run build` again

**Issue 2: Overlay Doesn't Appear**
- Solution: Check SYSTEM_ALERT_WINDOW permission is granted
- Solution: Verify service is started as foreground service
- Solution: Check log for errors in FocusService

**Issue 3: Timer Doesn't Update**
- Solution: Verify nativeBridge.updateTime() is called from web app
- Solution: Check FocusService.getInstance() is not null
- Solution: Check updateTimerDisplay() is being called

**Issue 4: App Crashes on Launch**
- Solution: Check AndroidManifest.xml has all permissions
- Solution: Verify MainActivity.java exists
- Solution: Check log for stack trace

**Issue 5: WebView Doesn't Load**
- Solution: Verify `.next` directory exists
- Solution: Check `webDir` in capacitor.config.ts
- Solution: Run `npx cap sync android` again

**Issue 6: Database Errors**
- Solution: Run `bun run db:push` to sync schema
- Solution: Check prisma/schema.prisma has no syntax errors
- Solution: Verify db file exists

**Issue 7: API 404/500 Errors**
- Solution: Check API route files exist
- Solution: Verify import paths are correct
- Solution: Check for TypeScript errors

---

## QUALITY STANDARDS

### Code Quality
- All code must follow Android best practices
- Proper error handling with try-catch blocks
- Logging for debugging and monitoring
- Clean code structure with proper separation of concerns
- No magic numbers or hardcoded values
- Type safety where possible

### Performance
- Smooth animations (60fps minimum)
- Fast startup time (< 3 seconds)
- Efficient memory usage
- No memory leaks
- Minimal battery drain
- Quick response to user actions

### User Experience
- Intuitive navigation flow
- Clear visual feedback for all actions
- Loading states for async operations
- Error messages are helpful and actionable
- Consistent styling throughout
- Accessibility considerations

### Security
- Proper permission handling
- Secure data storage
- Input validation on all forms
- No sensitive data logging

---

## DELIVERABLES

### Required Files
1. **Release APK** (signed)
2. **Android Studio project** (complete)
3. **Source code** (all native Java files)
4. **Configuration files** (AndroidManifest, styles, etc.)
5. **Capacitor config** (capacitor.config.ts)
6. **Build instructions** (step-by-step)
7. **Testing documentation** (what to test and how)

### Build Specifications
- **App Name**: StudentFocus
- **Package**: com.studentfocus.app
- **Version**: 1.0.0
- **Minimum SDK**: 26 (Android 8.0)
- **Target SDK**: 34 (Android 14)
- **Architecture**: arm64-v8a (or appropriate for target)
- **Build Type**: Release (signed)

### Signing
- Create or use existing keystore
- Follow Android signing best practices
- Ensure keystore password is stored securely
- Use same signing key for all updates

---

## FINAL VERIFICATION

Before declaring build complete, verify:

### Critical Success Criteria
- [ ] UI matches web version 100% (exact colors, fonts, layouts, animations)
- [ ] All screens work correctly and navigate properly
- [ ] Overlay feature fully functional with real-time updates
- [ ] Native bridge methods work correctly
- [ ] All permissions handled properly
- [ ] No compilation errors or warnings
- [ ] No runtime crashes
- [ ] Performance is acceptable (smooth, fast, responsive)
- [ ] All features work as designed
- [ ] Build generates valid, installable APK
- [ ] No sample data anywhere (all from real database)
- [ ] Empty states handled professionally (show "No sessions", "0h", etc.)

### Data Integrity
- [ ] All timer values from user selection (no defaults)
- [ ] All statistics calculated from real database
- [ ] All schedule items from user input
- [ ] All profile data from database
- [ ] All analytics from real FocusSession records

### Code Quality
- [ ] Clean, maintainable code structure
- [ ] Proper error handling throughout
- [ ] Comprehensive logging for debugging
- [ ] Type-safe where possible
- [ ] Follows Android development best practices

---

## SUCCESS METRICS

The build is considered successful when:

1. **Functionality Complete**: Every feature works as specified
2. **UI Fidelity Achieved**: Native app looks identical to web version
3. **Zero Errors**: Compilation and runtime both error-free
4. **Performance Standards**: Smooth, responsive, efficient
5. **Production Ready**: Suitable for app store distribution
6. **Data Integrity**: All data from real sources, no samples

---

## IMPORTANT NOTES

### Do NOT Modify
- **DO NOT** modify Next.js codebase (use WebView to preserve it)
- **DO NOT** change any colors, fonts, or styling
- **DO NOT** add or remove screens
- **DO NOT** alter navigation flow
- **DO NOT** use any sample data

### Must Implement
- **MUST** implement all native bridge methods exactly as specified
- **MUST** handle all Android permissions properly
- **MUST** implement foreground service for focus timer
- **MUST** implement overlay with real-time updates
- **MUST** support app blocking (can be enhanced)

### Critical Path
1. Install Capacitor
2. Configure project
3. Implement native bridge plugin
4. Implement FocusService with overlay
5. Create Android layouts and resources
6. Configure AndroidManifest with permissions
7. Build web app
8. Sync with Capacitor
9. Test thoroughly
10. Build release APK

---

## CONCLUSION

This is a production-ready Next.js 16 student productivity application with:
- ✅ Complete focus timer functionality
- ✅ Schedule management
- ✅ Real-time analytics
- ✅ Profile management
- ✅ Settings with theme toggle
- ✅ Native bridge for Android integration
- ✅ Zero sample data (all from database)
- ✅ Professional UI with glassmorphism design
- ✅ Ready for native Android APK conversion

Your task is to convert this to a native Android APK using Capacitor while preserving 100% of the UI/UX and implementing the native bridge for focus timer overlay and app blocking features.

**REMEMBER**: The goal is to create a native Android app that looks and behaves EXACTLY like the web version, with no compromises on quality or functionality.

---

**END OF COMPLETE PRODUCTION PROMPT**
