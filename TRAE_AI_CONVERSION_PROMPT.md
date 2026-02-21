# PRODUCTION PROMPT: Convert Next.js Web App to Native Android APK

## CRITICAL INSTRUCTIONS - READ FIRST

### ABSOLUTE REQUIREMENTS
1. **DO NOT** modify the UI/UX in any way - use WebView to preserve exact appearance
2. **DO NOT** change colors, fonts, layouts, spacing, or animations
3. **DO NOT** add/remove any features or screens
4. **DO NOT** change the navigation flow or user experience
5. **MUST** implement the overlay feature for focus timer
6. **MUST** implement app blocking functionality
7. **MUST** ensure all native bridge methods work perfectly
8. **DO NOT** use any hardcoded default/sample values - all data must come from the web app
9. **DO NOT** include placeholder text - all UI elements must display real data
10. **MUST** wire data calculation properly from actual user activity

### DATA FLOW ARCHITECTURE

#### Critical: Real Data Only
All timer values, status text, and display data MUST come from the web application. NO hardcoded defaults.

**Data Flow:**
1. Web app calculates timer duration (based on user selection from presets or custom input)
2. Web app calls `startFocus()` with ACTUAL totalTime in milliseconds
3. Native service receives ACTUAL time, starts timer
4. Web app calls `updateTime()` every second with ACTUAL remaining time
5. Native overlay displays ACTUAL time and status from web app
6. Web app controls pause/resume state, passes to native via updateTime()

**NO DEFAULT VALUES ALLOWED:**
- No default totalTime (e.g., 1500000)
- No default time display (e.g., "25:00")
- No default status text (e.g., "Focus Active", "Paused")
- No placeholder values in layouts
- All values must be populated dynamically from web app data

### NATIVE BRIDGE INTERFACE

The web app defines this interface in `src/lib/native-bridge.ts`. You MUST implement Android side to match EXACTLY.

```typescript
interface Window {
  FocusBlocking: {
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
}
```

## PROJECT SPECIFICATIONS

### Technology Stack
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Components**: Radix UI (shadcn/ui)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **State Management**: React hooks

### App Screens
1. **Home Screen** - Schedule overview, quick actions
2. **Focus Screen** - Timer with ACTUAL user-selected duration, presets, distraction blocking, ambient sounds
3. **Schedule Screen** - Session management with REAL session data
4. **Profile Screen** - User profile with REAL user data
5. **Analytics Screen** - Statistics calculated from ACTUAL user sessions
6. **Settings Screen** - App-wide settings and preferences

### Key Features to Preserve
- Circular focus timer with ACTUAL duration based on user selection
- Quick time presets: 5, 10, 15, 20, 25, 30, 45, 60 minutes (ACTUAL user selection)
- Custom time input via dialog (ACTUAL user input)
- Distraction blocking toggle (actual toggle state from web app)
- Ambient sound selector with 8 actual sound options
- Profile management (REAL user name, email, bio)
- Dark/Light theme toggle (actual state from web app)
- Focus status bar overlay with ACTUAL timer data
- Bottom navigation with 6 tabs

## RECOMMENDED APPROACH: Capacitor

### Why Capacitor
- Preserves existing web UI perfectly via WebView
- Excellent native bridge support for real data exchange
- Minimal code changes required
- Proven for wrapping Next.js apps
- Easy to maintain and update

### Required Capacitor Plugins
- `@capacitor/android`
- `@capacitor/core`
- `@capacitor/cli`
- Custom plugin for FocusBlocking (native bridge)

## STEP-BY-STEP IMPLEMENTATION

### Phase 1: Project Setup

**Step 1.1: Install Capacitor**
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npm install -D @capacitor/assets
```

**Step 1.2: Initialize Capacitor**
```bash
npx cap init StudentFocus com.studentfocus.app --web-dir=.next
```

**Step 1.3: Configure capacitor.config.ts**
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
      backgroundColor: '#1E1E1E',
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;
```

**Step 1.4: Add Android Platform**
```bash
npx cap add android
```

**Step 1.5: Generate App Assets**
```bash
npx cap assets android
```

### Phase 2: Build Next.js for Production

**Step 2.1: Build the Web App**
```bash
bun run build
```

**Step 2.2: Verify Build Output**
- Ensure `.next` directory exists
- Check for build errors
- Verify all static assets are included

**Step 2.3: Sync with Capacitor**
```bash
npx cap sync android
```

### Phase 3: Implement Native Bridge

**IMPORTANT:** The web app sends REAL data through these methods. You MUST implement Android side to receive and process actual data.

**File: android/app/src/main/java/com/studentfocus/app/FocusBlockingPlugin.java**

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
            // CRITICAL: Get ACTUAL blocked apps list from web app
            // The web app sends REAL user-configured apps
            if (FocusService.getInstance() != null) {
                FocusService.getInstance().setBlockedAppsList(call.getArray("apps"));
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);

            Log.d(TAG, "Blocked apps updated");
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
        }
    }
}
```

### Phase 4: Implement Foreground Service

**IMPORTANT:** This service displays REAL data from the web app, NO hardcoded values.

**File: android/app/src/main/java/com/studentfocus/app/FocusService.java**

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
import java.util.concurrent.Executors;
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
            // CRITICAL: Get ACTUAL totalTime from web app, NO DEFAULTS
            totalTime = intent.getIntExtra("totalTime", 0) / 1000; // Convert to seconds
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

        // CRITICAL: Display ACTUAL time, no placeholders
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Focus Mode")
                .setContentText(formatTime(timeLeft))
                .setSmallIcon(android.R.drawable.ic_dialog_info)
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

            timeLeftTextView = overlayView.findViewById(getResources().getIdentifier("time_left", "id", getPackageName()));
            statusTextView = overlayView.findViewById(getResources().getIdentifier("status", "id", getPackageName()));
            progressBar = overlayView.findViewById(getResources().getIdentifier("progress_bar", "id", getPackageName()));
            pauseResumeButton = overlayView.findViewById(getResources().getIdentifier("pause_resume", "id", getPackageName()));

            if (pauseResumeButton != null) {
                pauseResumeButton.setOnClickListener(v -> toggleTimer());
            }

            // CRITICAL: Initialize with ACTUAL data, no placeholders
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

            Log.d(TAG, "Overlay displayed with timeLeft: " + timeLeft + "s");
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
            int progress = totalTime > 0 ? (int) ((totalTime - timeLeft) * 100 / totalTime) : 0;
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

        scheduler = Executors.newSingleThreadScheduledExecutor();
        scheduledTask = scheduler.scheduleAtFixedRate(() -> {
            if (isRunning && timeLeft > 0) {
                timeLeft--;
                runOnUiThread(this::updateOverlay);
            } else if (timeLeft == 0) {
                stopTimer();
                runOnUiThread(() -> {
                    dismissOverlay();
                    stopSelf();
                });
            }
        }, 1, 1, TimeUnit.SECONDS);
    }

    private void stopTimer() {
        if (scheduledTask != null && !scheduledTask.isCancelled()) {
            scheduledTask.cancel(true);
        }
        if (scheduler != null && !scheduler.isShutdown()) {
            scheduler.shutdown();
        }
    }

    private void toggleTimer() {
        // CRITICAL: Notify web app of state change
        isRunning = !isRunning;
        updateOverlay();
    }

    // CRITICAL: Called by web app to update with ACTUAL data
    public void updateTimerDisplay(int newTimeLeft, boolean running, int newTotalTime) {
        this.timeLeft = newTimeLeft;
        this.isRunning = running;
        this.totalTime = newTotalTime;

        Log.d(TAG, "Timer display updated: " + newTimeLeft + "s, running: " + running);

        if (overlayView != null) {
            updateOverlay();
        }
    }

    // CRITICAL: Receive ACTUAL blocked apps from web app
    public void setBlockedAppsList(JSONArray apps) {
        this.blockedApps = apps;
        Log.d(TAG, "Blocked apps list updated: " + apps.length() + " apps");
    }

    private int getOverlayLayoutId() {
        return getResources().getIdentifier("overlay_timer", "layout", getPackageName());
    }
}
```

### Phase 5: Create Overlay Layout

**IMPORTANT:** NO hardcoded text or values. All populated dynamically from actual data.

**File: android/app/src/main/res/layout/overlay_timer.xml**

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

        <!-- CRITICAL: Initial empty, populated with ACTUAL time from service -->
        <TextView
            android:id="@+id/time_left"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text=""
            android:textSize="24sp"
            android:textColor="#E6E6E6"
            android:fontFamily="sans-serif-medium"
            android:layout_marginEnd="12dp"/>

        <!-- CRITICAL: Initial empty, populated with ACTUAL status from service -->
        <TextView
            android:id="@+id/status"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text=""
            android:textSize="14sp"
            android:textColor="#6366F1"
            android:layout_marginEnd="12dp"/>

        <View
            android:layout_width="0dp"
            android:layout_height="1dp"
            android:layout_weight="1"/>

        <!-- CRITICAL: Initial empty, populated with ACTUAL button text from service -->
        <Button
            android:id="@+id/pause_resume"
            android:layout_width="wrap_content"
            android:layout_height="32dp"
            android:text=""
            android:textSize="12sp"
            android:background="#383838"
            android:textColor="#E6E6E6"
            android:minWidth="80dp"/>
    </LinearLayout>

    <!-- CRITICAL: Initial 0, updated with ACTUAL progress from service -->
    <ProgressBar
        android:id="@+id/progress_bar"
        android:layout_width="match_parent"
        android:layout_height="4dp"
        android:progress="0"
        android:max="100"
        android:progressTint="#6366F1"
        style="?android:attr/progressBarStyleHorizontal"/>
</LinearLayout>
```

### Phase 6: Configure Android Manifest

**File: android/app/src/main/AndroidManifest.xml**

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.studentfocus.app">

    <!-- Required Permissions -->
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

### Phase 7: Configure App Styles

**File: android/app/src/main/res/values/styles.xml**

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
        <item name="colorPrimary">#6366F1</item>
        <item name="colorPrimaryDark">#1E1E1E</item>
        <item name="colorAccent">#6366F1</item>
        <item name="android:windowBackground">#1E1E1E</item>
        <item name="android:statusBarColor">#1E1E1E</item>
        <item name="android:navigationBarColor">#1E1E1E</item>
    </style>

    <style name="AppTheme.NoActionBarLaunch" parent="AppTheme">
        <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>
        <item name="android:windowTranslucentStatus">true</item>
        <item name="android:windowTranslucentNavigation">true</item>
    </style>
</resources>
```

### Phase 8: Build APK

**Step 8.1: Build Web App**
```bash
bun run build
```

**Step 8.2: Sync with Android**
```bash
npx cap sync android
```

**Step 8.3: Open Android Studio**
```bash
npx cap open android
```

**Step 8.4: Build Release APK in Android Studio**
1. Build > Generate Signed Bundle / APK
2. Select APK
3. Create or use existing keystore
4. Build release
5. APK location: `android/app/build/outputs/apk/release/`

## DATA CALCULATION FLOW

### Web App Side (Already Implemented)

The web app in `src/app/page.tsx` and `src/components/screens/focus-screen.tsx`:

1. **User selects duration** (preset or custom)
2. **Web app calculates totalTime** in seconds:
   ```typescript
   // Preset selection (e.g., 25 minutes)
   const totalTime = 25 * 60; // 1500 seconds
   ```

3. **Web app starts timer**:
   ```typescript
   setFocusIsRunning(true);
   setFocusTimeLeft(totalTime);
   ```

4. **Web app calls native bridge**:
   ```typescript
   nativeBridge.startFocus(totalTime * 1000); // Send milliseconds
   ```

5. **Web app updates timer every second**:
   ```typescript
   // In useEffect interval
   const newTime = timeLeftRef.current - 1;
   setFocusTimeLeft(newTime);
   nativeBridge.updateTime(newTime, true, totalTime);
   ```

6. **Web app tracks session data** for analytics:
   ```typescript
   // Record completed session
   const session = {
     id: Date.now(),
     subject: currentSubject,
     duration: totalTime - timeLeft,
     completed: timeLeft === 0
   };
   ```

### Native Side (You Must Implement)

The native code must:

1. **Receive ACTUAL totalTime** from web app via `startFocus()`
2. **Display ACTUAL time** in overlay (no defaults)
3. **Receive ACTUAL updates** from web app via `updateTime()` every second
4. **Display ACTUAL status** (Active/Paused) from web app
5. **Calculate progress percentage** from ACTUAL time values:
   ```java
   int progress = (totalTime - timeLeft) * 100 / totalTime;
   ```

6. **Block ACTUAL apps** configured by user in web app

### Analytics Data Calculation

The Analytics screen displays REAL data from user sessions:

- **Total Focus Time**: Sum of all completed session durations
- **Focus Sessions**: Count of all completed sessions
- **Daily Stats**: Sessions completed today
- **Weekly Stats**: Sessions completed this week
- **Progress Charts**: Graph of focus time over time

**IMPORTANT:** The web app's `src/components/screens/analytics-screen.tsx` calculates these from REAL session data stored in the database. Do NOT modify the calculation logic.

## ERROR PREVENTION

### Critical: No Sample Data Allowed

**DO NOT include ANY of these:**
- ❌ Default totalTime values (e.g., 1500000 for 25 minutes)
- ❌ Default time display text (e.g., "25:00")
- ❌ Default status text (e.g., "Focus Active", "Paused")
- ❌ Default progress values (e.g., progress="0" in XML)
- ❌ Placeholder text in layouts (e.g., android:text="--:--")
- ❌ Mock user data
- ❌ Sample sessions
- ❌ Fake statistics

**DO include these:**
- ✅ Empty strings or 0 for initial values that will be populated
- ✅ Proper handling of null/zero values with error checking
- ✅ Data validation (e.g., check if totalTime > 0 before starting service)
- ✅ Real-time updates from web app
- ✅ Proper logging of actual values received

### Common Mistakes to Avoid

1. **Hardcoding default values**
   - ❌ `int totalTime = intent.getIntExtra("totalTime", 1500000);`
   - ✅ `int totalTime = intent.getIntExtra("totalTime", 0);` AND check if valid

2. **Displaying placeholder text**
   - ❌ `android:text="25:00"` in XML layout
   - ✅ `android:text=""` in XML, populate from service

3. **Using sample user data**
   - ❌ Mock user profile data
   - ✅ Load actual user data from web app state

4. **Calculating fake statistics**
   - ❌ Hardcoded session counts or times
   - ✅ Calculate from REAL sessions in database

5. **Ignoring web app data**
   - ❌ Native timer runs independently of web app
   - ✅ Native displays ACTUAL data from web app

## TESTING CHECKLIST

### Data Flow Testing

#### Timer Data
- [ ] When user selects 5-minute preset, totalTime is 300 seconds
- [ ] When user selects 25-minute preset, totalTime is 1500 seconds
- [ ] When user enters custom 1h 30m, totalTime is 5400 seconds
- [ ] Overlay displays ACTUAL time from web app
- [ ] Time updates every second with ACTUAL value
- [ ] Progress bar shows ACTUAL percentage
- [ ] When time reaches 0, service stops correctly

#### Status Data
- [ ] When timer running, status displays "Active"
- [ ] When timer paused, status displays "Paused"
- [ ] Pause/Resume button text reflects ACTUAL state
- [ ] Web app pause/resume syncs with native overlay

#### User Data
- [ ] Profile displays ACTUAL user name from web app
- [ ] Profile displays ACTUAL user email from web app
- [ ] Profile displays ACTUAL user bio from web app
- [ ] Profile saves ACTUAL changes to database

#### Analytics Data
- [ ] Total focus time calculated from REAL sessions
- [ ] Session count from REAL completed sessions
- [ ] Charts display ACTUAL user data
- [ ] No mock/sample statistics anywhere

#### Blocked Apps Data
- [ ] User-configured apps are sent to native
- [ ] Native blocks ACTUAL user-selected apps
- [ ] Blocking list updates when user changes it

### UI Testing
- [ ] All 6 screens display correctly with real data
- [ ] Colors match web version exactly
- [ ] Glassmorphism effects render properly
- [ ] No placeholder text visible anywhere
- [ ] Animations are smooth (60fps)

### Feature Testing
- [ ] Focus timer starts with ACTUAL user-selected duration
- [ ] Time presets work correctly with ACTUAL values
- [ ] Custom time input works with ACTUAL user input
- [ ] Overlay appears when focus starts with ACTUAL time
- [ ] Overlay updates with ACTUAL time from web app
- [ ] Overlay shows ACTUAL status from web app
- [ ] Ambient sounds play with ACTUAL user selection
- [ ] Profile editing updates ACTUAL user data
- [ ] Settings toggles reflect ACTUAL state
- [ ] Navigation between screens works

### Native Bridge Testing
- [ ] startFocus() receives ACTUAL totalTime from web
- [ ] stopFocus() stops service correctly
- [ ] updateTime() updates overlay with ACTUAL data
- [ ] All parameters passed correctly
- [ ] Return values correct

### Permissions Testing
- [ ] Permissions requested when needed
- [ ] Permissions checked correctly
- [ ] App works without permissions (web-only mode)

## DELIVERABLES

### Required Files
1. Release APK (signed)
2. Android Studio project
3. Complete source code
4. Build instructions
5. Testing documentation

### Quality Standards
- No compilation errors or warnings
- No runtime crashes
- All features functional
- UI matches web version exactly
- Smooth performance
- Proper error handling
- **NO SAMPLE DATA ANYWHERE**
- **All displays show ACTUAL user data**

### Metadata
- App Name: StudentFocus
- Package: com.studentfocus.app
- Version: 1.0.0
- Min SDK: 26
- Target SDK: 34

## FINAL VERIFICATION

### Critical Success Criteria
1. [ ] UI matches web version 100%
2. [ ] All screens work correctly
3. [ ] Overlay feature functional
4. [ ] App blocking functional
5. [ ] No bugs or crashes
6. [ ] Performance acceptable
7. [ ] All permissions handled
8. [ ] Build generates valid APK
9. [ ] **NO SAMPLE DATA ANYWHERE**
10. [ ] **All displays show ACTUAL user data**
11. [ ] **Timer uses ACTUAL user-selected duration**
12. [ ] **Analytics calculate from REAL sessions**

### Data Verification
- [ ] All timer values from ACTUAL user selection
- [ ] All status text from ACTUAL app state
- [ ] All user data from ACTUAL user profile
- [ ] All statistics from REAL user sessions
- [ ] All blocked apps from ACTUAL user configuration
- [ ] No hardcoded defaults anywhere

---

**END OF PRODUCTION PROMPT**

Follow these instructions exactly. Do not deviate from specifications. Ensure all native bridge methods work perfectly. Do not modify web app UI or UX in any way. Use WebView to preserve exact appearance and functionality of existing Next.js application. **CRITICAL: All data must come from ACTUAL user activity - NO SAMPLE DATA, NO DEFAULT VALUES, NO PLACEHOLDERS.**
