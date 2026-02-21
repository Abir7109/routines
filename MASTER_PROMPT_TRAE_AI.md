# Master Prompt: Convert Next.js 16 Student Productivity App to Native Android APK

## Project Overview

Convert a fully functional **Next.js 16 + React 19** student productivity web application into a **production-ready native Android APK** using Capacitor. The app has **6 complete screens** and must preserve **100% UI/UX fidelity** with zero modifications to the web version's appearance or behavior.

---

## CRITICAL REQUIREMENTS

### 🚨 Non-Negotiable Rules

1. **ZERO UI MODIFICATION** - The native APK must look and behave **exactly** like the web version at localhost:3000
2. **ALL FEATURES WORKING** - Every feature, button, and interaction must function identically
3. **NO SAMPLE DATA** - All data must come from real user activity via API routes
4. **NATIVE INTEGRATIONS** - Implement overlay permission, usage stats, foreground service
5. **NO BUILD ERRORS** - APK must compile and run without any errors, white screens, or crashes
6. **NEXT.JS 16 BUG FIX** - Address the Rust worker thread issue (Error 11)

---

## Technical Stack

### Web Framework (DO NOT CHANGE)
- **Next.js 16.1.3** with App Router (Mandatory)
- **React 19** with TypeScript 5
- **Tailwind CSS 4** with custom OKLCH color system
- **shadcn/ui** components (New York style)
- **Prisma ORM** with SQLite database
- **Zustand** for state management

### Native Technologies (Use These)
- **Capacitor 6.x** for Android wrapper
- **Android Gradle Plugin 8.x**
- **Target SDK**: 34 (Android 14)
- **Min SDK**: 24 (Android 7.0)
- **Kotlin** for native Android code

---

## Application Architecture

### 6 Screens to Convert

1. **Home Screen** (`src/components/screens/home-screen.tsx`)
   - Today's schedule overview
   - Quick access to Focus
   - Progress tracking (weekly hours, sessions, streaks)
   - **API Dependency**: `/api/analytics` for real-time stats

2. **Focus Screen** (`src/components/screens/focus-screen.tsx`)
   - Full-screen immersive timer (25 min default)
   - Play/Pause/Complete controls
   - Subject display (optional from schedule)
   - **NATIVE FEATURE**: Overlay timer when app is backgrounded
   - **NATIVE FEATURE**: Foreground service to keep timer running

3. **Schedule Screen** (`src/components/screens/schedule-screen.tsx`)
   - Daily schedule management
   - Add/Edit/Delete sessions
   - **API Dependency**: `/api/schedule` (GET, POST, PATCH, DELETE)

4. **Profile Screen** (`src/components/screens/profile-screen.tsx`)
   - User profile display and edit
   - Total sessions and focus time
   - **API Dependency**: `/api/profile` (GET, PATCH)

5. **Analytics Screen** (`src/components/screens/analytics-screen.tsx`)
   - Weekly, monthly, yearly analytics
   - Charts and graphs
   - Productivity insights
   - **API Dependency**: `/api/analytics`

6. **Settings Screen** (`src/components/screens/settings-screen.tsx`)
   - App preferences
   - Timer duration settings
   - **NATIVE FEATURE**: Permission requests (Overlay, Usage Stats)
   - **NATIVE FEATURE**: App blocking configuration

---

## Native Android Features Required

### 1. Focus Timer Overlay (CRITICAL)

**Purpose**: Display timer on screen when user leaves the app or uses blocked apps

**Requirements**:
- Request `SYSTEM_ALERT_WINDOW` permission
- Create overlay service that shows countdown timer
- Overlay must be dismissible by user
- Display: Subject name + Time remaining (MM:SS format)
- Position: Top-center of screen
- Style: Semi-transparent dark background, white text

**Implementation**:
```kotlin
// Android/app/src/main/java/com/yourapp/TimerOverlayService.kt
class TimerOverlayService : Service() {
    private lateinit var windowManager: WindowManager
    private lateinit var overlayView: View
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Create and show overlay
        // Update timer every second from web app state
        return START_NOT_STICKY
    }
    
    fun updateTimer(subject: String, secondsRemaining: Int) {
        // Update overlay UI via Capacitor bridge
    }
    
    fun hideOverlay() {
        // Remove overlay
    }
}
```

**Bridge Communication**:
```typescript
// Capacitor Plugin Interface
interface TimerOverlayPlugin {
  requestPermission(): Promise<{ granted: boolean }>;
  showOverlay(options: { subject: string; seconds: number }): Promise<void>;
  hideOverlay(): Promise<void>;
  updateTimer(options: { seconds: number }): Promise<void>;
}
```

### 2. Foreground Service (CRITICAL)

**Purpose**: Keep focus timer running even when app is in background

**Requirements**:
- Display persistent notification
- Show "Focus Timer: MM:SS - [Subject]"
- "Stop" button to end session
- Survive app being swiped away

**Implementation**:
```kotlin
// Android/app/src/main/java/com/yourapp/FocusTimerService.kt
class FocusTimerService : Service() {
    private val CHANNEL_ID = "focus_timer_channel"
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        createNotificationChannel()
        startForeground(1, createNotification())
        return START_NOT_STICKY
    }
    
    private fun createNotification(): Notification {
        // Show timer countdown in notification
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Focus Timer")
            .setContentText("25:00 - Mathematics")
            .setOngoing(true)
            .build()
    }
    
    fun updateNotification(seconds: Int, subject: String?) {
        // Update notification text
    }
}
```

### 3. App Blocking (CRITICAL)

**Purpose**: Block distracting apps during focus sessions

**Requirements**:
- Request `PACKAGE_USAGE_STATS` permission
- Monitor app usage in background
- Show overlay when blocked app is opened
- Return to focus app or allow user to end session

**Implementation**:
```kotlin
// Android/app/src/main/java/com/yourapp/AppBlockerService.kt
class AppBlockerService : Service() {
    private lateinit var usageStatsManager: UsageStatsManager
    private val blockedApps = mutableSetOf<String>()
    private var focusSessionActive = false
    
    fun startBlocking(appPackages: List<String>) {
        blockedApps.addAll(appPackages)
        focusSessionActive = true
        // Start monitoring
    }
    
    fun stopBlocking() {
        blockedApps.clear()
        focusSessionActive = false
    }
    
    private fun checkForegroundApp() {
        // If blocked app is in foreground, show overlay
        // Provide "Return to Focus" or "End Session" options
    }
}
```

**Bridge Communication**:
```typescript
// Capacitor Plugin Interface
interface AppBlockerPlugin {
  requestUsageStatsPermission(): Promise<{ granted: boolean }>;
  getInstalledApps(): Promise<{ apps: Array<{ packageName: string; label: string }> }>;
  startBlocking(options: { apps: string[] }): Promise<void>;
  stopBlocking(): Promise<void>;
}
```

### 4. Native Permission Handler

**Implementation**:
```kotlin
// Android/app/src/main/java/com/yourapp/PermissionHelper.kt
class PermissionHelper {
    fun requestOverlayPermission(activity: Activity): Boolean {
        return Settings.canDrawOverlays(activity)
    }
    
    fun requestUsageStatsPermission(activity: Activity): Boolean {
        val appOps = activity.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = appOps.checkOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            android.os.Process.myUid(),
            activity.packageName
        )
        return mode == AppOpsManager.MODE_ALLOWED
    }
}
```

---

## Capacitor Configuration

### Required Plugins

```json
// capacitor.config.ts
{
  "appId": "com.studentproductivity.app",
  "appName": "Student Productivity",
  "webDir": "dist",
  "android": {
    "buildOptions": {
      "keystorePath": "release.keystore",
      "keystoreAlias": "release",
      "keystoreAliasPassword": "your-password",
      "keystorePassword": "your-password"
    }
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 0,
      "launchAutoHide": false
    },
    "StatusBar": {
      "style": "DARK"
    },
    "Keyboard": {
      "resize": "body"
    }
  }
}
```

### Build Configuration

```gradle
// android/app/build.gradle

android {
    compileSdkVersion 34
    buildToolsVersion "34.0.0"
    
    defaultConfig {
        applicationId "com.studentproductivity.app"
        minSdkVersion 24
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
    
    kotlinOptions {
        jvmTarget = '17'
    }
    
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## API Communication Preservation

### Critical: All API Routes Must Work

The app depends on these API routes - ensure Capacitor handles them correctly:

1. `GET /api/schedule?date={date}` - Load schedule
2. `POST /api/schedule` - Create session
3. `PATCH /api/schedule/{id}` - Update session
4. `DELETE /api/schedule/{id}` - Delete session
5. `GET /api/profile` - Load user stats
6. `PATCH /api/profile` - Update profile
7. `GET /api/analytics` - Load analytics data
8. `POST /api/focus-sessions` - Save completed focus session

### Capacitor Configuration for API

```typescript
// capacitor.config.ts - Ensure proper handling
{
  "server": {
    "cleartext": true,
    "allowNavigation": ["*"]
  },
  "android": {
    "webContentsDebuggingEnabled": false
  }
}
```

### Web View Configuration

```kotlin
// Android/app/src/main/java/com/yourapp/MainActivity.kt

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Enable file access for local assets
        registerPlugin(WebViewPlugin.class);
        
        // Configure WebView settings
        WebView webView = this.getBridge().getWebView();
        WebSettings settings = webView.getSettings();
        
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setJavaScriptEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
    }
}
```

---

## Next.js 16 Build Bug Fix (CRITICAL)

### Problem: Rust Worker Thread Crash

Next.js 16.1.3 has a known bug causing:
```
OS can't spawn worker thread: Resource temporarily unavailable (os error 11)
```

This results in white screen and broken APK.

### Solution 1: Optimize Build Configuration

```json
// next.config.ts
{
  "experimental": {
    "workerThreads": false,
    "cpus": 1
  },
  "output": "standalone"
}
```

### Solution 2: Static Export

```json
// next.config.ts
{
  "output": "export",
  "images": {
    "unoptimized": true
  }
}
```

### Solution 3: Use Vercel Build API

Use alternative build process that doesn't trigger the bug:
```bash
# Build with memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Solution 4: Downgrade to Next.js 15

If bug cannot be fixed, downgrade to stable version:
```bash
npm install next@15.1.0 react@18 react-dom@18
```

**NOTE**: Only downgrade if absolutely necessary. Try solutions 1-3 first.

---

## Data Flow Architecture

### Web App → Native Bridge

```
User Action (Web App)
    ↓
Capacitor Plugin Call
    ↓
Native Android Service
    ↓
System Permission/API
    ↓
Result Returned to Web
    ↓
Update React State
```

### Example: Start Focus Session

```typescript
// Focus Screen - Web App
const handleStart = async () => {
  // Save session to database
  await fetch('/api/focus-sessions', {
    method: 'POST',
    body: JSON.stringify({ subject, duration })
  });
  
  // Start foreground service
  await FocusTimerPlugin.startForeground({
    duration: 25 * 60,
    subject: currentSubject
  });
  
  // Show overlay permission if needed
  const overlayGranted = await TimerOverlayPlugin.requestPermission();
  if (overlayGranted) {
    await TimerOverlayPlugin.showOverlay({
      subject: currentSubject || 'Focus Session',
      seconds: 25 * 60
    });
  }
  
  // Start app blocking
  await AppBlockerPlugin.startBlocking({ apps: blockedApps });
};
```

### Example: Timer Update

```typescript
// Focus Screen - Update Timer
useEffect(() => {
  const interval = setInterval(() => {
    if (timer > 0) {
      setTimer(timer - 1);
      
      // Update native overlay
      TimerOverlayPlugin.updateTimer({ seconds: timer - 1 });
      
      // Update foreground notification
      FocusTimerPlugin.updateNotification({
        seconds: timer - 1,
        subject: currentSubject
      });
    } else {
      // Session complete
      handleComplete();
    }
  }, 1000);
  
  return () => clearInterval(interval);
}, [timer]);
```

---

## Build Process Steps

### Step 1: Prepare Next.js Build

```bash
# Install dependencies
npm install

# Fix Next.js 16 bug
# Add to next.config.ts:
# experimental.workerThreads = false
# output = "standalone"

# Build for production
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Step 2: Sync with Capacitor

```bash
# Initialize Capacitor (if not done)
npx cap init "Student Productivity" "com.studentproductivity.app"

# Add Android platform
npx cap add android

# Sync assets
npx cap sync android
```

### Step 3: Implement Native Features

1. Create `TimerOverlayService.kt`
2. Create `FocusTimerService.kt`
3. Create `AppBlockerService.kt`
4. Create `PermissionHelper.kt`
5. Implement Capacitor plugins

### Step 4: Update Android Manifest

```xml
<!-- Android/app/src/main/AndroidManifest.xml -->

<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
<uses-permission android:name="android.permission.PACKAGE_USAGE_STATS" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.WAKE_LOCK" />

<application>
    <service
        android:name=".TimerOverlayService"
        android:enabled="true"
        android:exported="false" />
    
    <service
        android:name=".FocusTimerService"
        android:enabled="true"
        android:exported="false"
        android:foregroundServiceType="specialUse">
        <property
            android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
            android:value="Focus timer with overlay" />
    </service>
    
    <service
        android:name=".AppBlockerService"
        android:enabled="true"
        android:exported="false" />
</application>
```

### Step 5: Build APK

```bash
# Open Android Studio (recommended)
npx cap open android

# Or build via command line
cd android
./gradlew assembleDebug
./gradlew assembleRelease
```

### Step 6: Test on Device

```bash
# Install debug APK
adb install -r app/build/outputs/apk/debug/app-debug.apk

# Test all features:
# 1. Navigation between all 6 screens
# 2. Create/delete schedule items
# 3. Start/stop focus timer
# 4. Verify overlay appears
# 5. Verify app blocking works
# 6. Check analytics update
# 7. Test profile editing
```

---

## Quality Assurance Checklist

### ✅ UI/UX Verification
- [ ] All 6 screens render correctly
- [ ] Colors match web version (OKLCH color system)
- [ ] Fonts are consistent
- [ ] Tailwind CSS responsive design works
- [ ] No layout shifts or broken elements
- [ ] shadcn/ui components render properly

### ✅ Functionality Verification
- [ ] Home screen shows real analytics data
- [ ] Focus timer works with play/pause/complete
- [ ] Schedule items can be created/edited/deleted
- [ ] Profile can be updated
- [ ] Analytics charts display correctly
- [ ] Settings save preferences

### ✅ Native Features Verification
- [ ] Overlay permission requested and granted
- [ ] Timer overlay appears when app is backgrounded
- [ ] Foreground notification shows countdown
- [ ] App blocking blocks specified apps
- [ ] All permissions work without crashes

### ✅ API Communication Verification
- [ ] All API routes respond correctly
- [ ] Data persists to database
- [ ] Real-time updates work
- [ ] No CORS or network errors
- [ ] Offline handling graceful

### ✅ Performance Verification
- [ ] APK installs without errors
- [ ] App launches under 3 seconds
- [ ] No lag or stuttering
- [ ] Memory usage reasonable (< 200MB)
- [ ] Battery drain minimal

### ✅ Build Verification
- [ ] No build errors or warnings
- [ ] No white screen on launch
- [ ] APK size reasonable (< 30MB)
- [ ] No missing assets or broken icons
- [ ] Signs correctly for release

---

## Known Issues and Solutions

### Issue 1: White Screen on Launch
**Cause**: Next.js 16 worker thread crash
**Solution**: Disable worker threads in `next.config.ts`

### Issue 2: Overlay Not Showing
**Cause**: Permission not granted
**Solution**: Guide user to Settings → Apps → Draw over other apps

### Issue 3: Timer Stops in Background
**Cause**: Foreground service not running
**Solution**: Ensure notification channel created and service started

### Issue 4: App Blocking Not Working
**Cause**: Usage stats permission not granted
**Solution**: Guide user to Settings → Apps → Special app access → Usage access

### Issue 5: API Routes Failing
**Cause**: Capacitor not routing properly
**Solution**: Check `capacitor.config.ts` server settings

---

## Deliverables

### Required APK Package

1. **Debug APK**: For testing and validation
   - File: `app-debug.apk`
   - Size: < 50MB
   - Must install and run without errors

2. **Release APK**: For distribution
   - File: `app-release.apk`
   - Signed with release keystore
   - Production ready

### Required Documentation

1. **Build Instructions**: Step-by-step build process
2. **Native Features Guide**: How overlay, blocking, permissions work
3. **API Integration Notes**: How web APIs communicate with native code
4. **Known Limitations**: Any features not fully implemented
5. **Troubleshooting Guide**: Common issues and solutions

### Required Source Code

1. **Android Native Code**: All Kotlin files
2. **Capacitor Plugins**: Custom plugin implementations
3. **Manifest Files**: AndroidManifest.xml configuration
4. **Build Scripts**: Gradle configurations

---

## Final Notes

### Success Criteria

The APK conversion is successful when:
1. ✅ All 6 screens look **exactly** like the web version
2. ✅ All features work **without any modification**
3. ✅ Focus timer overlay appears during sessions
4. ✅ App blocking prevents distracting apps
5. ✅ All API routes function correctly
6. ✅ No build errors, crashes, or white screens
7. ✅ App is production-ready for distribution

### What NOT to Do

❌ Do NOT modify any Tailwind CSS classes or styling
❌ Do NOT change the UI layout or component structure
❌ Do NOT remove or add any features
❌ Do NOT add sample or hardcoded data
❌ Do NOT break existing API routes
❌ Do NOT ignore the Next.js 16 worker thread bug

### What MUST Be Done

✅ Preserve 100% UI/UX from web version
✅ Implement native overlay timer
✅ Implement foreground service
✅ Implement app blocking
✅ Fix Next.js 16 build bug
✅ Ensure all API routes work
✅ Create production-ready APK
✅ Provide comprehensive documentation

---

## Contact and Support

If any issues arise during conversion:
1. Check the web version at `localhost:3000` for expected behavior
2. Review API route responses
3. Verify database connection
4. Test native permissions individually
5. Check Android Studio logs for errors

**Success Goal**: Create a native Android APK that is indistinguishable from the web app in terms of functionality and appearance, with added native features for focus management.
