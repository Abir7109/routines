# Quick Conversion Reference for Native APK

## 🚀 TL;DR - What the AI Needs to Do

### 1. DO NOT CHANGE ANY UI
- **ALL UI components must remain exactly as they are**
- **No changes to colors, layouts, styling, or design**
- **Only add native functionality behind the scenes**

### 2. File Locations & Changes

#### New Files to Create (Native Android)
```
android/app/src/main/java/com/yourapp/
  ├── FocusBlockingService.kt           # Main blocking service
  └── plugins/
      └── FocusBlockingPlugin.java      # Capacitor plugin for web<->native

android/app/src/main/res/
  ├── layout/
  │   └── blocking_overlay.xml          # Overlay UI for blocked apps
  ├── drawable/
  │   ├── primary_button_background.xml
  │   └── warning_button_background.xml
  └── values/
      └── colors.xml                    # Add overlay colors
```

#### Existing Files to Modify
```
1. android/app/src/main/AndroidManifest.xml
   - Add permissions (see ANDROID_MANIFEST_TEMPLATE.xml)
   - Add service declaration
   - DO NOT modify anything else

2. Register plugin in capacitor.plugins.json
   - Add FocusBlocking plugin registration
```

### 3. Required Android Permissions

```xml
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
<use-permission android:name="android.permission.PACKAGE_USAGE_STATS" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<use-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
<use-permission android:name="android.permission.WAKE_LOCK" />
```

### 4. Blocked Apps Package Names

```
com.instagram.android    # Instagram
com.twitter.android       # Twitter
com.zhiliaoapp.musically  # TikTok
com.google.android.youtube # YouTube
```

### 5. Web App Integration Points

The web app is already set up with:
- ✅ Native bridge interface (`src/lib/native-bridge.ts`)
- ✅ Integration in Focus Screen (`src/components/screens/focus-screen.tsx`)
- ✅ Permission checking and requesting
- ✅ Time updates to native service
- ✅ Blocked apps configuration

**You just need to implement the native side.**

### 6. Core Native Service Functionality

The `FocusBlockingService.kt` must:

1. **Start when web app calls `startFocus`**
   - Accept totalTime parameter
   - Start as foreground service
   - Show persistent notification

2. **Monitor app switches every 500ms**
   - Use UsageStatsManager to check current app
   - Compare with blocked apps list

3. **Show overlay when blocked app detected**
   - Use TYPE_APPLICATION_OVERLAY
   - Display time remaining
   - Show motivational quote
   - Add "Return to Focus" and "End Focus" buttons

4. **Handle button clicks**
   - "Return to Focus": Return to main app
   - "End Focus": Stop focus mode and close overlay

5. **Update when web app calls `updateTime`**
   - Update overlay time display
   - Sync with web app timer

6. **Stop when web app calls `stopFocus`**
   - Remove overlay
   - Stop foreground service
   - Clean up resources

### 7. Motivational Quotes

Display these quotes (rotate randomly):
```
"The secret of getting ahead is getting started." - Mark Twain
"It's not that I'm so smart, it's just that I stay with problems longer." - Albert Einstein
"Success is the sum of small efforts repeated day in and day out." - Robert Collier
"The only way to do great work is to love what you do." - Steve Jobs
"Don't watch the clock; do what it does. Keep going." - Sam Levenson
"Focus is the key to success." - Unknown
"Discipline is the bridge between goals and accomplishment." - Jim Rohn
"The future depends on what you do today." - Mahatma Gandhi
"Motivation is what gets you started. Habit is what keeps you going." - Jim Ryun
"Your time is limited, don't waste it living someone else's life." - Steve Jobs
"Believe you can and you're halfway there." - Theodore Roosevelt
"The harder you work for something, the greater you'll feel when you achieve it." - Unknown
"Dream big and dare to fail." - Norman Vaughan
"Action is the foundational key to all success." - Pablo Picasso
"Success doesn't come from what you do occasionally. It comes from what you do consistently." - Marie Forleo
```

### 8. Overlay Design Specifications

**Layout:** Centered vertical layout
- Icon (120dp) - Blue shield/block icon
- Time left (48sp) - "25:00" format
- Subtitle (16sp) - "Focus session in progress"
- Quote (20sp) - Motivational text, blue color
- Author (14sp) - Gray color
- Buttons (180dp x 56dp) - Side by side
- Warning text (14sp) - At bottom

**Colors:**
- Background: `#E6111116` (Dark with 90% opacity)
- Electric Blue: `#3B82F6` (Primary accent)
- Soft White: `#F5F5F5` (Text)
- Soft Gray: `#A0A0A0` (Secondary text)
- Charcoal Deep: `#1A1A1A` (Dark)

### 9. Web-to-Native Bridge Interface

The web app will call these methods via Capacitor plugin:

```typescript
// Start focus mode
FocusBlocking.startFocus({ totalTime: 1500000 }); // ms

// Stop focus mode
FocusBlocking.stopFocus();

// Update time (called every second)
FocusBlocking.updateTime({
  timeLeft: 1500,     // seconds
  isRunning: true,
  totalTime: 1500
});

// Check permissions
FocusBlocking.checkOverlayPermission() -> { hasPermission: boolean }
FocusBlocking.checkUsageStatsPermission() -> { hasPermission: boolean }

// Request permissions
FocusBlocking.requestOverlayPermission() -> { success: boolean }

// Update blocked apps list
FocusBlocking.updateBlockedApps([
  { id: "instagram", packageName: "com.instagram.android" },
  // ... other apps
])
```

### 10. Testing Checklist

- [ ] App installs and opens without issues
- [ ] All existing UI is preserved exactly
- [ ] Focus timer works correctly
- [ ] All existing features work (quick time, custom time, ambient sound, etc.)
- [ ] Distraction blocking toggle works
- [ ] When focus starts, native service starts
- [ ] Notification shows "Focus Mode Active"
- [ ] Permission requests work correctly
- [ ] When opening blocked app during focus, overlay appears
- [ ] Overlay shows correct time remaining
- [ ] Overlay shows motivational quote
- [ ] "Return to Focus" button returns to main app
- [ ] "End Focus" button stops focus mode
- [ ] When focus ends, overlay disappears
- [ ] App works on Android 8+ (API 26+)
- [ ] No UI changes or visual differences from web version

### 11. Critical Constraints

✅ **DO:**
- Implement native service exactly as specified
- Add required permissions to AndroidManifest.xml
- Create overlay with specified design
- Implement motivational quotes rotation
- Communicate between web and native via bridge
- Test thoroughly on Android device

❌ **DO NOT:**
- Change any UI components (colors, layouts, styling)
- Modify any React components except native bridge calls
- Change the existing design system or color palette
- Remove or alter any existing features
- Change timer design or behavior
- Modify animations or transitions
- Touch any styling in src/components/

### 12. Build Commands

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android

# Initialize
npx cap init

# Add Android platform
npx cap add android

# Sync code to native
npm run build
npx cap sync android

# Open Android Studio for building
npx cap open android
# Then: Build > Build Bundle(s) / APK(s) > Build APK(s)

# Release build (in Android Studio)
# Build > Generate Signed Bundle / APK
```

### 13. Emergency Rollback

If anything breaks:

1. Revert all changes to `src/components/` (except native bridge integration)
2. Ensure native bridge calls are wrapped in try-catch
3. The web app must continue to work without native features
4. Native features should be optional, not required

### 14. Key Files Reference

| File | Purpose | Status |
|------|---------|--------|
| `NATIVE_CONVERSION_GUIDE.md` | Complete detailed guide | ✅ Complete |
| `ANDROID_MANIFEST_TEMPLATE.xml` | Android manifest with permissions | ✅ Complete |
| `src/lib/native-bridge.ts` | Web-to-native bridge interface | ✅ Complete |
| `src/components/screens/focus-screen.tsx` | Integrated with native bridge | ✅ Complete |

### 15. Communication Flow

```
User clicks Start Button
  ↓
Web App: handleToggleTimer()
  ↓
Native Bridge: checkPermissions()
  ↓
Native Bridge: requestPermissions() (if needed)
  ↓
Native Bridge: startFocus(totalTime)
  ↓
FocusBlockingService: onStartCommand(ACTION_START_FOCUS)
  ↓
Service: startForeground(), create notification
  ↓
Service: startAppMonitoring() (check every 500ms)
  ↓
User opens Instagram
  ↓
Service: checkCurrentApp() → detects Instagram
  ↓
Service: showOverlay()
  ↓
Overlay: Display blocking screen with time & quote
  ↓
Web App: updateTime() every second
  ↓
Service: updateOverlayTime()
  ↓
User clicks "End Focus"
  ↓
Overlay: send stopFocus() event
  ↓
Service: stopSelf(), removeOverlay()
  ↓
Web App: stop timer, update UI
```

---

## 🎯 Final Reminders

1. **UI IS SACRED** - Do not touch any styling, colors, or layouts
2. **Native Only** - Only add Android code, no web UI changes
3. **Permissions First** - Make sure all permissions are requested properly
4. **Thorough Testing** - Test every scenario before finalizing
5. **Rollback Ready** - Keep web app working without native features

Good luck! 🚀
