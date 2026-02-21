# Android Build Guide

This guide documents the process of converting the StudentFocus Next.js web application into a native Android APK using Capacitor.

## Prerequisites

Before building the Android app, ensure you have the following installed:

1.  **Node.js** (LTS version recommended)
2.  **Java Development Kit (JDK)** - Version 17 or higher is required for the Android build tools.
3.  **Android Studio** - Required for the Android SDK and build tools.
    -   Ensure the **Android SDK Command-line Tools** are installed via SDK Manager.
4.  **Capacitor CLI** (installed as a project dependency).

## Project Configuration

### 1. Next.js Configuration (`next.config.ts`)

To wrap a Next.js app with Capacitor, it must be exported as a static site. We configured `next.config.ts` as follows:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // Critical: Exports the app as static HTML/CSS/JS
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Note: Image optimization components (next/image) often need unoptimized: true
  // or a custom loader in static exports.
};

export default nextConfig;
```

### 2. Capacitor Configuration (`capacitor.config.json`)

This file connects the web build to the native container.

```json
{
  "appId": "com.studentfocus.app",
  "appName": "StudentFocus",
  "webDir": "out",  // Critical: Must match the Next.js export output directory
  "server": {
    "cleartext": true,
    "allowNavigation": ["*"],
    "androidScheme": "https"
  },
  "android": {
    "buildOptions": {
      "signingType": "apksigner"
    }
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#1E1E1E"
    }
  }
}
```

## Build Process

Follow these steps to generate a new APK.

### Step 1: Build Web Assets

First, compile the Next.js application into static assets.

```bash
npm run build
```

This command runs `next build`, which generates the static files in the `out/` directory.

### Step 2: Sync with Capacitor

Copy the updated web assets and any plugin changes to the Android native project.

```bash
npx cap sync
```

This command:
1.  Copies the contents of `out/` to `android/app/src/main/assets/public/`.
2.  Updates native plugins.

### Step 3: Build the APK

You can build the APK using the command line or Android Studio.

**Option A: Command Line (Fastest)**

Navigate to the android directory and run the Gradle wrapper:

```powershell
cd android
.\gradlew assembleDebug
```

**Option B: Android Studio**

1.  Open the `android/` directory in Android Studio.
2.  Wait for Gradle sync to complete.
3.  Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

## Output Location

Upon a successful build, the debug APK is located at:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

## Troubleshooting

-   **"Could not find the web assets directory"**: Ensure `webDir` in `capacitor.config.json` is set to `out` (for Next.js static exports) and that you have run `npm run build` at least once.
-   **Gradle Errors**: Ensure your `JAVA_HOME` environment variable points to a valid JDK 17+ installation.
-   **Navigation Bar Issues on Mobile**: Mobile styling often requires specific adjustments (like `safe-area-inset-bottom`). We used fixed positioning and increased touch targets in `src/components/navigation/bottom-nav.tsx` to ensure a native-like feel.
