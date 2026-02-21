# Native APK Conversion Guide - Distraction Blocking Feature

## Overview
This document provides complete instructions for converting the web app to a native Android APK with a fully functional distraction blocking feature. The distraction blocking feature prevents users from accessing distracting apps (social media, etc.) while focus mode is active.

## Critical Requirements

### DO NOT CHANGE THE UI
- **All UI components must remain exactly as they are**
- **No changes to visual design, colors, layouts, or styling**
- **Only add native functionality behind the scenes**

### Current UI Components (Must Preserve)
1. **Focus Timer** (`src/components/ui/focus-timer.tsx`)
   - Circular progress ring (220px size, 92px radius)
   - Time display in center
   - Electric blue accent color: `oklch(0.6 0.2 250)`
   - Glassmorphism effects

2. **Focus Screen** (`src/components/screens/focus-screen.tsx`)
   - Timer controls (Start/Pause, Reset)
   - Quick time selection (5, 10, 15, 20, 25, 30, 45, 60 min)
   - Custom time dialog
   - Ambient sound selector
   - Distraction blocking section with Switch
   - Blocked apps grid (Instagram, Twitter, TikTok, YouTube)

3. **Color Scheme (MUST NOT CHANGE)**
   - Background: Dark theme
   - Primary accent: `oklch(0.6 0.2 250)` (Electric Blue)
   - Secondary: Various gradients (purple, cyan, green)
   - All other colors from existing design

---

## Part 1: Android Manifest Permissions

### Required Permissions (Add to AndroidManifest.xml)

```xml
<!-- System Overlay Permission - Critical for drawing over other apps -->
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />

<!-- Usage Stats Permission - Required to detect app switches -->
<uses-permission android:name="android.permission.PACKAGE_USAGE_STATS"
    tools:ignore="ProtectedPermissions" />

<!-- Foreground Service Permission - Required to keep focus mode running -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />

<!-- Wake Lock - Keep device awake during focus mode -->
<uses-permission android:name="android.permission.WAKE_LOCK" />

<!-- Boot Completed - Auto-start blocking service on device boot -->
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

<!-- Internet Permission - Already exists, but ensuring it's present -->
<uses-permission android:name="android.permission.INTERNET" />
```

### Special Uses Declaration (Android 14+)

```xml
<application>
    <service
        android:name=".FocusBlockingService"
        android:foregroundServiceType="specialUse"
        android:exported="false">
        <property
            android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
            android:value="distraction_blocking" />
    </service>
</application>
```

---

## Part 2: Distraction Blocking Overlay UI

### Native Overlay Design
When a user tries to open a blocked app during focus mode, display this overlay:

**Layout Structure:**
```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:gravity="center"
    android:background="@color/overlay_background">

    <!-- Icon -->
    <ImageView
        android:id="@+id/blockingIcon"
        android:layout_width="120dp"
        android:layout_height="120dp"
        android:layout_marginBottom="24dp"
        android:src="@drawable/ic_blocked_app"
        android:tint="@color/electric_blue" />

    <!-- Time Left Display -->
    <TextView
        android:id="@+id/timeLeftText"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="25:00"
        android:textSize="48sp"
        android:textColor="@color/soft_white"
        android:fontFamily="sans-serif-medium"
        android:layout_marginBottom="12dp" />

    <!-- Subtitle -->
    <TextView
        android:id="@+id/timeLeftLabel"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Focus session in progress"
        android:textSize="16sp"
        android:textColor="@color/soft_gray"
        android:layout_marginBottom="32dp" />

    <!-- Motivational Quote -->
    <TextView
        android:id="@+id/quoteText"
        android:layout_width="320dp"
        android:layout_height="wrap_content"
        android:text="The secret of getting ahead is getting started."
        android:textSize="20sp"
        android:textColor="@color/electric_blue"
        android:textAlignment="center"
        android:fontFamily="sans-serif-light"
        android:layout_marginBottom="8dp" />

    <!-- Quote Author -->
    <TextView
        android:id="@+id/quoteAuthor"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="- Mark Twain"
        android:textSize="14sp"
        android:textColor="@color/soft_gray"
        android:layout_marginBottom="40dp" />

    <!-- Action Buttons -->
    <LinearLayout
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="center">

        <!-- Back to Focus App Button -->
        <Button
            android:id="@+id/backToFocusButton"
            android:layout_width="180dp"
            android:layout_height="56dp"
            android:layout_marginEnd="12dp"
            android:text="Return to Focus"
            android:textSize="16sp"
            android:textColor="@color/charcoal_deep"
            android:background="@drawable/primary_button_background" />

        <!-- End Session Button (Warning) -->
        <Button
            android:id="@+id/endSessionButton"
            android:layout_width="140dp"
            android:layout_height="56dp"
            android:text="End Focus"
            android:textSize="14sp"
            android:textColor="@color/soft_white"
            android:background="@drawable/warning_button_background" />
    </LinearLayout>

    <!-- Warning Text -->
    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="This app is blocked during your focus session"
        android:textSize="14sp"
        android:textColor="@color/soft_gray"
        android:alpha="0.6"
        android:layout_marginTop="32dp" />
</LinearLayout>
```

### Color Values (colors.xml)
```xml
<resources>
    <color name="overlay_background">#E6111116</color> <!-- Dark with transparency -->
    <color name="electric_blue">#3B82F6</color>
    <color name="soft_white">#F5F5F5</color>
    <color name="soft_gray">#A0A0A0</color>
    <color name="charcoal_deep">#1A1A1A</color>
</resources>
```

### Button Backgrounds

**Primary Button (drawable/primary_button_background.xml):**
```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="#3B82F6" />
    <corners android:radius="16dp" />
</shape>
```

**Warning Button (drawable/warning_button_background.xml):**
```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="#E6111116" />
    <corners android:radius="16dp" />
    <stroke android:width="1dp" android:color="#333333" />
</shape>
```

---

## Part 3: Motivational Quotes

### Quotes Array (quotes.xml or in code)
```kotlin
val motivationalQuotes = listOf(
    Quote("The secret of getting ahead is getting started.", "Mark Twain"),
    Quote("It's not that I'm so smart, it's just that I stay with problems longer.", "Albert Einstein"),
    Quote("Success is the sum of small efforts repeated day in and day out.", "Robert Collier"),
    Quote("The only way to do great work is to love what you do.", "Steve Jobs"),
    Quote("Don't watch the clock; do what it does. Keep going.", "Sam Levenson"),
    Quote("Focus is the key to success.", "Unknown"),
    Quote("Discipline is the bridge between goals and accomplishment.", "Jim Rohn"),
    Quote("The future depends on what you do today.", "Mahatma Gandhi"),
    Quote("Motivation is what gets you started. Habit is what keeps you going.", "Jim Ryun"),
    Quote("Your time is limited, don't waste it living someone else's life.", "Steve Jobs"),
    Quote("Believe you can and you're halfway there.", "Theodore Roosevelt"),
    Quote("The harder you work for something, the greater you'll feel when you achieve it.", "Unknown"),
    Quote("Dream big and dare to fail.", "Norman Vaughan"),
    Quote("Action is the foundational key to all success.", "Pablo Picasso"),
    Quote("Success doesn't come from what you do occasionally. It comes from what you do consistently.", "Marie Forleo")
)

data class Quote(val text: String, val author: String)
```

---

## Part 4: Android Service Implementation

### FocusBlockingService.kt
```kotlin
import android.app.*
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.TextView
import android.widget.Button
import android.content.pm.PackageManager
import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import java.util.*

class FocusBlockingService : Service() {
    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var currentQuoteIndex = 0

    // Blocked app package names
    private val blockedApps = listOf(
        "com.instagram.android",
        "com.twitter.android",
        "com.zhiliaoapp.musically", // TikTok
        "com.google.android.youtube"
    )

    companion object {
        const val ACTION_START_FOCUS = "com.yourapp.ACTION_START_FOCUS"
        const val ACTION_STOP_FOCUS = "com.yourapp.ACTION_STOP_FOCUS"
        const val ACTION_UPDATE_TIME = "com.yourapp.ACTION_UPDATE_TIME"
        const val EXTRA_TIME_LEFT = "time_left"
        const val EXTRA_TOTAL_TIME = "total_time"
        const val EXTRA_IS_RUNNING = "is_running"

        private var focusEndTime: Long = 0
        private var isFocusActive = false
        private var currentTimeLeft = 0

        fun getIsFocusActive(): Boolean = isFocusActive
        fun getTimeLeft(): Int = currentTimeLeft
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_FOCUS -> {
                val totalTime = intent.getLongExtra(EXTRA_TOTAL_TIME, 25 * 60 * 1000)
                focusEndTime = System.currentTimeMillis() + totalTime
                isFocusActive = true
                startForeground(NOTIFICATION_ID, createNotification())
                startAppMonitoring()
            }
            ACTION_STOP_FOCUS -> {
                isFocusActive = false
                removeOverlay()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
            ACTION_UPDATE_TIME -> {
                currentTimeLeft = intent.getIntExtra(EXTRA_TIME_LEFT, 0)
                isFocusActive = intent.getBooleanExtra(EXTRA_IS_RUNNING, false)

                if (!isFocusActive) {
                    stopFocus()
                } else {
                    updateOverlayTime(currentTimeLeft)
                }
            }
        }
        return START_STICKY
    }

    private fun createNotification(): Notification {
        val channelId = "focus_blocking_channel"
        val channelName = "Focus Blocking Service"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                channelName,
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Blocks distracting apps during focus mode"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }

        return NotificationCompat.Builder(this, channelId)
            .setContentTitle("Focus Mode Active")
            .setContentText("Blocking distracting apps")
            .setSmallIcon(R.drawable.ic_focus)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()
    }

    private fun startAppMonitoring() {
        val timer = Timer()
        timer.scheduleAtFixedRate(object : TimerTask() {
            override fun run() {
                if (!isFocusActive) {
                    timer.cancel()
                    return
                }

                checkCurrentApp()
            }
        }, 0, 500) // Check every 500ms
    }

    private fun checkCurrentApp() {
        val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val endTime = System.currentTimeMillis()
        val startTime = endTime - 1000

        val usageStatsList = usageStatsManager.queryUsageStats(
            UsageStatsManager.INTERVAL_DAILY,
            startTime,
            endTime
        )

        var currentApp: String? = null
        var lastUsedTime = 0L

        for (stats in usageStatsList) {
            if (stats.lastTimeUsed > lastUsedTime) {
                lastUsedTime = stats.lastTimeUsed
                currentApp = stats.packageName
            }
        }

        if (currentApp != null && blockedApps.contains(currentApp)) {
            showOverlay()
        } else {
            removeOverlay()
        }
    }

    private fun showOverlay() {
        if (overlayView != null) return

        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager

        overlayView = LayoutInflater.from(this).inflate(R.layout.blocking_overlay, null)

        val layoutParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                @Suppress("DEPRECATION")
                WindowManager.LayoutParams.TYPE_PHONE
            },
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        )

        layoutParams.gravity = Gravity.CENTER

        windowManager?.addView(overlayView, layoutParams)

        // Set content
        updateOverlayContent()

        // Button listeners
        overlayView?.findViewById<Button>(R.id.backToFocusButton)?.setOnClickListener {
            removeOverlay()
            // Return to main app
            val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
            launchIntent?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            startActivity(launchIntent)
        }

        overlayView?.findViewById<Button>(R.id.endSessionButton)?.setOnClickListener {
            // Send event to web app to stop focus
            stopFocus()
        }
    }

    private fun updateOverlayContent() {
        val quote = motivationalQuotes[currentQuoteIndex]
        currentQuoteIndex = (currentQuoteIndex + 1) % motivationalQuotes.size

        overlayView?.findViewById<TextView>(R.id.quoteText)?.text = quote.text
        overlayView?.findViewById<TextView>(R.id.quoteAuthor)?.text = "- ${quote.author}"
        updateOverlayTime(currentTimeLeft)
    }

    private fun updateOverlayTime(seconds: Int) {
        val minutes = seconds / 60
        val secs = seconds % 60
        val timeString = String.format(Locale.getDefault(), "%02d:%02d", minutes, secs)
        overlayView?.findViewById<TextView>(R.id.timeLeftText)?.text = timeString
    }

    private fun removeOverlay() {
        if (overlayView != null && windowManager != null) {
            windowManager?.removeView(overlayView)
            overlayView = null
        }
    }

    private fun stopFocus() {
        isFocusActive = false
        removeOverlay()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    override fun onDestroy() {
        removeOverlay()
        super.onDestroy()
    }

    companion object {
        private const val NOTIFICATION_ID = 1001
    }
}
```

---

## Part 5: Web-to-Native Bridge

### Capacitor Plugin (for Communication)
Create a custom Capacitor plugin to communicate between web app and native code.

**File: FocusBlockingPlugin.java**
```java
package com.yourapp.plugins;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import android.content.Intent;

@CapacitorPlugin(name = "FocusBlocking")
public class FocusBlockingPlugin extends Plugin {

    @PluginMethod
    public void startFocus(PluginCall call) {
        long totalTime = call.getLong("totalTime", 25 * 60 * 1000);

        Intent serviceIntent = new Intent(getActivity(), FocusBlockingService.class);
        serviceIntent.setAction(FocusBlockingService.ACTION_START_FOCUS);
        serviceIntent.putExtra(FocusBlockingService.EXTRA_TOTAL_TIME, totalTime);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getActivity().startForegroundService(serviceIntent);
        } else {
            getActivity().startService(serviceIntent);
        }

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void stopFocus(PluginCall call) {
        Intent serviceIntent = new Intent(getActivity(), FocusBlockingService.class);
        serviceIntent.setAction(FocusBlockingService.ACTION_STOP_FOCUS);
        getActivity().startService(serviceIntent);

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void updateTime(PluginCall call) {
        int timeLeft = call.getInt("timeLeft", 0);
        boolean isRunning = call.getBoolean("isRunning", false);
        long totalTime = call.getLong("totalTime", 25 * 60 * 1000);

        Intent serviceIntent = new Intent(getActivity(), FocusBlockingService.class);
        serviceIntent.setAction(FocusBlockingService.ACTION_UPDATE_TIME);
        serviceIntent.putExtra(FocusBlockingService.EXTRA_TIME_LEFT, timeLeft);
        serviceIntent.putExtra(FocusBlockingService.EXTRA_IS_RUNNING, isRunning);

        getActivity().startService(serviceIntent);

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void checkOverlayPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            boolean hasPermission = Settings.canDrawOverlays(getActivity());

            JSObject ret = new JSObject();
            ret.put("hasPermission", hasPermission);
            call.resolve(ret);
        } else {
            JSObject ret = new JSObject();
            ret.put("hasPermission", true);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent intent = new Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + getActivity().getPackageName())
            );
            getActivity().startActivityForResult(intent, 1000);
        }

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void checkUsageStatsPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            AppOpsManager appOps = (AppOpsManager) getActivity()
                .getSystemService(Context.APP_OPS_SERVICE);
            int mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                getActivity().getPackageName()
            );

            JSObject ret = new JSObject();
            ret.put("hasPermission", mode == AppOpsManager.MODE_ALLOWED);
            call.resolve(ret);
        } else {
            JSObject ret = new JSObject();
            ret.put("hasPermission", true);
            call.resolve(ret);
        }
    }
}
```

---

## Part 6: Web App Integration

### TypeScript Interface for Native Plugin
```typescript
// File: src/lib/native-bridge.ts

declare global {
  interface Window {
    FocusBlocking?: {
      startFocus: (options: { totalTime: number }) => Promise<{ success: boolean }>;
      stopFocus: () => Promise<{ success: boolean }>;
      updateTime: (options: {
        timeLeft: number;
        isRunning: boolean;
        totalTime: number;
      }) => Promise<{ success: boolean }>;
      checkOverlayPermission: () => Promise<{ hasPermission: boolean }>;
      requestOverlayPermission: () => Promise<{ success: boolean }>;
      checkUsageStatsPermission: () => Promise<{ hasPermission: boolean }>;
    };
}

export interface NativeBridge {
  startFocus: (totalTimeMs: number) => Promise<boolean>;
  stopFocus: () => Promise<boolean>;
  updateTime: (timeLeft: number, isRunning: boolean, totalTime: number) => Promise<boolean>;
  checkPermissions: () => Promise<{
    overlay: boolean;
    usageStats: boolean;
  }>;
  requestPermissions: () => Promise<boolean>;
}

export const nativeBridge: NativeBridge = {
  startFocus: async (totalTimeMs: number) => {
    try {
      const result = await window.FocusBlocking?.startFocus({ totalTime: totalTimeMs });
      return result?.success ?? false;
    } catch (error) {
      console.error('Failed to start native focus:', error);
      return false;
    }
  },

  stopFocus: async () => {
    try {
      const result = await window.FocusBlocking?.stopFocus();
      return result?.success ?? false;
    } catch (error) {
      console.error('Failed to stop native focus:', error);
      return false;
    }
  },

  updateTime: async (timeLeft: number, isRunning: boolean, totalTime: number) => {
    try {
      const result = await window.FocusBlocking?.updateTime({
        timeLeft,
        isRunning,
        totalTime
      });
      return result?.success ?? false;
    } catch (error) {
      console.error('Failed to update native time:', error);
      return false;
    }
  },

  checkPermissions: async () => {
    try {
      const [overlay, usageStats] = await Promise.all([
        window.FocusBlocking?.checkOverlayPermission(),
        window.FocusBlocking?.checkUsageStatsPermission()
      ]);
      return {
        overlay: overlay?.hasPermission ?? false,
        usageStats: usageStats?.hasPermission ?? false
      };
    } catch (error) {
      console.error('Failed to check permissions:', error);
      return { overlay: false, usageStats: false };
    }
  },

  requestPermissions: async () => {
    try {
      await window.FocusBlocking?.requestOverlayPermission();
      return true;
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return false;
    }
  }
};
```

### Update Focus Screen to Use Native Bridge
Modify `/home/z/my-project/src/components/screens/focus-screen.tsx`:

```typescript
// Add this near the top of the file
import { nativeBridge } from '@/lib/native-bridge';

// In the FocusScreen component, add this effect:

React.useEffect(() => {
  let interval: NodeJS.Timeout | null = null;

  if (isRunning && timeLeft > 0) {
    // Update native service every second
    nativeBridge.updateTime(timeLeft, isRunning, totalTime);

    interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        // Update native service
        nativeBridge.updateTime(newTime, true, totalTime);
        return newTime;
      });
    }, 1000);
  } else if (timeLeft === 0) {
    setIsRunning(false);
    // Stop native service
    nativeBridge.stopFocus();
  }

  return () => {
    if (interval) clearInterval(interval);
  };
}, [isRunning, timeLeft, totalTime]);

// Update handleToggleTimer function:

const handleToggleTimer = async () => {
  const newRunningState = !isRunning;

  if (newRunningState) {
    // Check and request permissions
    const permissions = await nativeBridge.checkPermissions();

    if (!permissions.overlay || !permissions.usageStats) {
      await nativeBridge.requestPermissions();
    }

    // Start native focus service
    await nativeBridge.startFocus(totalTime * 1000); // Convert to milliseconds
  } else {
    // Stop native focus service
    await nativeBridge.stopFocus();
  }

  setIsRunning(newRunningState);
};

// Update handleResetTimer function:

const handleResetTimer = async () => {
  setIsRunning(false);
  setTimeLeft(totalTime);
  // Stop native focus service
  await nativeBridge.stopFocus();
};
```

---

## Part 7: Permission Request UI (Optional Enhancement)

### Permission Request Dialog
Add this in the Focus Screen to guide users:

```typescript
// Add state
const [showPermissionDialog, setShowPermissionDialog] = React.useState(false);

// Add this check in useEffect
React.useEffect(() => {
  const checkPermissions = async () => {
    const permissions = await nativeBridge.checkPermissions();
    if (!permissions.overlay || !permissions.usageStats) {
      setShowPermissionDialog(true);
    }
  };
  checkPermissions();
}, []);

// Add the permission dialog JSX
{showPermissionDialog && (
  <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
    <DialogOverlay className="backdrop-blur-sm bg-charcoal-deep/60" />
    <DialogContent className="p-0 bg-transparent border-none shadow-2xl max-w-[340px]">
      <div className="glass-card rounded-2xl overflow-hidden border border-charcoal-light/50">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-electric-blue/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-electric-blue" />
            </div>
            <div>
              <h3 className="text-heading text-soft-white">Permissions Required</h3>
              <p className="text-body-small text-soft-gray">
                Enable distraction blocking
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-5">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-electric-blue/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                <span className="text-xs text-electric-blue">1</span>
              </div>
              <p className="text-body-small text-soft-gray">
                Display over other apps permission
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-electric-blue/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                <span className="text-xs text-electric-blue">2</span>
              </div>
              <p className="text-body-small text-soft-gray">
                Usage access permission
              </p>
            </div>
          </div>

          <button
            onClick={async () => {
              await nativeBridge.requestPermissions();
              setShowPermissionDialog(false);
            }}
            className="w-full px-4 py-3 rounded-lg font-medium transition-all"
            style={{
              background: "linear-gradient(135deg, oklch(0.6 0.2 250) 0%, oklch(0.65 0.22 250) 100%)",
              boxShadow: "0 4px 20px oklch(0.6 0.2 250 / 25%)",
            }}
          >
            Grant Permissions
          </button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
)}
```

---

## Part 8: Capacitor Configuration

### capacitor.config.json
```json
{
  "appId": "com.yourapp.focusproductivity",
  "appName": "Focus Productivity",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "plugins": {
    "FocusBlocking": {
      "enable": true
    }
  },
  "android": {
    "buildOptions": {
      "keystorePath": "path/to/keystore.jks",
      "keystorePassword": "password",
      "keystoreAlias": "alias",
      "keystoreAliasPassword": "alias-password"
    }
  }
}
```

---

## Part 9: Blocked Apps Configuration

### Dynamic App Blocking
The blocked apps can be configured dynamically from the web app:

```typescript
// Add to FocusScreen component
const blockedApps = [
  { id: "instagram", name: "Instagram", icon: <Instagram className="w-5 h-5" />, packageName: "com.instagram.android" },
  { id: "twitter", name: "Twitter", icon: <Twitter className="w-5 h-5" />, packageName: "com.twitter.android" },
  { id: "tiktok", name: "TikTok", icon: <Music className="w-5 h-5" />, packageName: "com.zhiliaoapp.musically" },
  { id: "youtube", name: "YouTube", icon: <Youtube className="w-5 h-5" />, packageName: "com.google.android.youtube" },
];

// Function to update blocked apps in native code
const updateBlockedApps = async (apps: typeof blockedApps) => {
  // This would call a method to update the blocked apps list in the native service
  // Implementation depends on the native plugin setup
};
```

---

## Part 10: Build Instructions for AI

### Step-by-Step Conversion Process

1. **DO NOT Modify Any UI Components**
   - Keep all components in `src/components/` exactly as they are
   - Do not change colors, layouts, styling, or visual design
   - Only add native functionality

2. **Set Up Capacitor Project**
   ```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init
   npm install @capacitor/android
   npx cap add android
   ```

3. **Add Custom Plugin**
   - Create native plugin files in `android/app/src/main/java/com/yourapp/plugins/`
   - Copy the `FocusBlockingPlugin.java` code
   - Register plugin in capacitor.plugins.json

4. **Implement FocusBlockingService**
   - Create `FocusBlockingService.kt` in `android/app/src/main/java/com/yourapp/`
   - Implement the complete service as specified
   - Create overlay layout in `android/app/src/main/res/layout/blocking_overlay.xml`
   - Add color values to `colors.xml`

5. **Update AndroidManifest.xml**
   - Add all required permissions as specified
   - Add service declaration with foregroundServiceType
   - Do NOT modify any other parts of the manifest

6. **Add Native Bridge to Web App**
   - Create `src/lib/native-bridge.ts` with the interface and implementation
   - Update `src/components/screens/focus-screen.tsx` to use native bridge
   - Add permission request dialog (optional)

7. **Test Permissions**
   - Ensure overlay permission works
   - Ensure usage stats permission works
   - Test focus mode start/stop
   - Test overlay display when opening blocked apps

8. **Build APK**
   ```bash
   npm run build
   npx cap sync android
   npx cap open android
   # Then in Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)
   ```

---

## Part 11: Critical Constraints Summary

### ✅ DO:
- Implement native service exactly as specified
- Add required permissions to AndroidManifest.xml
- Create overlay with the specified design
- Implement motivational quotes rotation
- Communicate between web and native via the bridge
- Test thoroughly on Android device

### ❌ DO NOT:
- Change any UI components (colors, layouts, styling)
- Modify any React components except for adding native bridge calls
- Change the existing design system or color palette
- Remove or alter any existing features
- Change the timer design or behavior
- Modify any animations or transitions

---

## Part 12: Testing Checklist

Before finalizing, ensure all these work:

- [ ] App installs and opens successfully
- [ ] All existing UI is preserved exactly
- [ ] Focus timer works correctly
- [ ] Quick time selection works
- [ ] Custom time dialog works
- [ ] Ambient sound selection works
- [ ] Distraction blocking toggle works
- [ ] When focus mode starts, native service starts
- [ ] Permission requests work correctly
- [ ] When opening a blocked app during focus, overlay appears
- [ ] Overlay shows correct time left
- [ ] Overlay shows motivational quote
- [ ] "Return to Focus" button returns to the app
- [ ] "End Focus" button stops focus mode
- [ ] When focus ends, overlay disappears
- [ ] Blocked apps can be configured
- [ ] App works on Android 8+ (API 26+)
- [ ] Foreground service notification appears
- [ ] No UI changes or visual differences from web version

---

## Part 13: Emergency Rollback

If anything breaks the UI or causes issues:

1. Revert all changes to `src/components/` except native bridge integration
2. Ensure native bridge calls are properly wrapped in try-catch
3. Add feature flag to disable native features if needed
4. The web app should continue to work without native features

---

## Conclusion

This guide provides everything needed to convert the web app to a native Android APK with a fully functional distraction blocking feature. The key principle is:

**KEEP THE UI EXACTLY THE SAME - ONLY ADD NATIVE FUNCTIONALITY BEHIND THE SCENES**

All UI components, colors, layouts, and visual design must be preserved. The only additions should be:
- Native service for blocking
- Overlay for blocking screen
- Permissions in manifest
- Bridge between web and native

Follow this guide carefully, and the conversion will be successful without any UI changes.
