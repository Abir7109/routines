# MANUAL CAPACITOR SETUP GUIDE

## Issue
Permission denied when running npx cap init. This is likely a sandbox limitation.

## Solution 1: Manual Setup

### Step 1: Verify capacitor.config.json

File should contain:
```json
{
  "appId": "com.studentfocus.app",
  "capacitorVersion": "6.0.0",
  "appName": "New App",
  "webDir": ".next",
  "bundledWebRuntime": false,
  "npmClient": "npm",
  "server": {
    "androidScheme": "https",
    "cleartext": false,
    "plugins": {
      "SplashScreen": {
        "launchShowDuration": 2000,
        "launchAutoHide": true,
        "backgroundColor": "#1E1E1E",
        "splashFullScreen": platform
      }
    }
  }
}
```

### Step 2: Add Android Platform

Create manually:
```bash
npx cap add android
```

Or manually create folder structure:
```
/home/z/my-project/android/
  ├── app/
  │   ├── src/
  │   │   └── main/
  │   │       ├── AndroidManifest.xml
  │   │       └── MainActivity.java
  │   ├── res/
  │   │   ├── layout/
  │   │   │   └── values/
  │   └── build.gradle
```

### Step 3: Add Native Plugin Code

Copy the native Java code from `/home/z/my-project/TRAE_AI_NATIVE_CONVERSION_PROMPT.md` to:
- `/android/app/src/main/java/com/studentfocus/app/FocusBlockingPlugin.java`
- `/android/app/src/main/java/com/studentfocus/app/FocusService.java`
- `/android/app/src/main/res/layout/overlay_timer.xml`
- `/android/app/src/main/res/values/styles.xml`
- `/android/app/src/main/AndroidManifest.xml`

### Step 4: Sync and Build

```bash
npx cap sync android
npx cap open android
```

---

## ALTERNATIVE: Use Ionic Start

If Capacitor setup continues to fail, use Ionic CLI which has better Capacitor integration:

```bash
npm install -g @ionic/cli
npx ionic start
```

Then in Ionic CLI:
- Add Android platform
- Add native plugin (copy code from prompt)
- Sync and build

---

## TEST BUILD FIRST

Before attempting production build, test:

### 1. Development Build
```bash
bun run dev
```

Open http://localhost:3000 in browser and verify:
- [ ] All screens load
- [ ] Colors are correct
- [ ] No console errors
- [ ] Features work

### 2. Fix Any Issues Found

If you see errors in console or broken UI, document them and fix before proceeding.

---

## KNOWN BUILD ISSUES

### Next.js 16 Build Worker Crashing
**Error**: `OS can't spawn worker thread: Resource temporarily unavailable`

**Immediate Workarounds**:
```bash
# Try 1: Disable workers
NEXT_PRIVATE_SKIP_BUILD=true bun run build

# Try 2: Use development build
bun run dev

# Try 3: Use older Next.js
npm install next@14.2.18
# Build with old version
npm run build
```

### White Screen on APK Launch
**Causes**:
- WebView not loading web content
- Build output missing or incorrect

**Solutions**:
- Verify `.next/standalone` exists and has files
- Check `index.html` exists in build output
- Ensure `package.json` has correct scripts
- Test in development mode first with Capacitor

### UI Broken in APK
**Causes**:
- CSS not loading correctly
- Tailwind not bundled properly
- React components not rendering

**Solutions**:
- Use dev mode with Capacitor for testing
- Ensure Tailwind is configured correctly
- Check all imports in components
- Test on actual Android device/emulator

---

## RECOMMENDED APPROACH

Given the build issues, consider:

### Option 1: Use Development Mode
1. Keep development server running
2. Use Capacitor with live reload
3. Test changes immediately in Android Studio
4. No production build needed until everything works

### Option 2: Use Expo (More Stable)
```bash
npx create-expo-app studentfocus
cd studentfocus
```
Expo has better build system and more stable native integration.

### Option 3: Wait for Next.js Fix
Wait for Next.js 16.1.4 or later which may fix build worker issue.

---

## CURRENT STATUS

✅ **Capacitor packages installed**
✅ **capacitor.config.json created**
✅ **Build fix guide created**
✅ **Manual setup guide created**
⚠️  **Capacitor init failing due to permissions**
✅ **Build issue identified (Next.js 16 worker crash)**

**Next Steps**:
1. Try manual Android folder creation
2. Or use Ionic CLI as alternative
3. Or use dev mode with Capacitor
4. Wait for Next.js build fix

---

**IMPORTANT**: Do NOT attempt production build until:
1. Development mode works with Capacitor
2. Build worker issue is resolved
3. All UI tests pass

This will save you time and frustration!
