package com.studentfocus.app

import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.TextView

class AppBlockerService : Service() {

    private val handler = Handler(Looper.getMainLooper())
    private var blockedApps = listOf(
        "com.instagram.android",
        "com.facebook.katana",
        "com.zhiliaoapp.musically", // TikTok
        "com.twitter.android",
        "com.snapchat.android",
        "com.google.android.youtube",
        "com.reddit.frontpage",
        "com.linkedin.android",
        "com.pinterest",
        "tv.twitch.android"
    )
    private var isRunning = false
    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var isOverlayShowing = false

    private val checkRunnable = object : Runnable {
        override fun run() {
            if (!isRunning) return
            checkCurrentApp()
            handler.postDelayed(this, 500) // Check every 500ms for faster response
        }
    }

    override fun onBind(intent: Intent): IBinder? {
        return null
    }

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent != null) {
            if (intent.action == "START_BLOCKING" || intent.action == "UPDATE_APPS") {
                val apps = intent.getStringArrayListExtra("blocked_apps")
                if (apps != null) {
                    blockedApps = apps
                } else {
                    loadBlockedAppsFromPrefs()
                }
                
                if (intent.action == "START_BLOCKING") {
                    if (!isRunning) {
                        isRunning = true
                        handler.post(checkRunnable)
                    }
                }
            } else if (intent.action == "STOP_BLOCKING") {
                isRunning = false
                handler.removeCallbacks(checkRunnable)
                hideOverlay()
                stopSelf()
            }
        }
        return START_STICKY
    }

    private fun loadBlockedAppsFromPrefs() {
        val prefs = getSharedPreferences("FocusPrefs", Context.MODE_PRIVATE)
        val savedApps = prefs.getStringSet("blocked_packages", null)
        if (savedApps != null) {
            blockedApps = savedApps.toList()
        }
    }

    private fun checkCurrentApp() {
        val usm = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val time = System.currentTimeMillis()
        val events = usm.queryEvents(time - 1000 * 5, time)
        val event = UsageEvents.Event()
        
        var currentPkg: String? = null
        
        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            if (event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                currentPkg = event.packageName
            }
        }

        if (currentPkg != null) {
            if (currentPkg == packageName || isLauncher(currentPkg)) {
                hideOverlay()
                return
            }

            if (blockedApps.contains(currentPkg)) {
                showOverlay()
            } else {
                hideOverlay()
            }
        }
    }

    private fun isLauncher(packageName: String): Boolean {
        val intent = Intent(Intent.ACTION_MAIN)
        intent.addCategory(Intent.CATEGORY_HOME)
        val resolveInfo = packageManager.resolveActivity(intent, 0)
        return resolveInfo?.activityInfo?.packageName == packageName
    }

    private fun showOverlay() {
        if (isOverlayShowing) return
        
        if (overlayView == null) {
            createOverlayView()
        }

        try {
            val params = WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                else
                    WindowManager.LayoutParams.TYPE_PHONE,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                        WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                        WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT
            )
            params.gravity = Gravity.CENTER
            
            // Make it cover status bar
            params.systemUiVisibility = View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE

            windowManager?.addView(overlayView, params)
            isOverlayShowing = true
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun hideOverlay() {
        if (!isOverlayShowing || overlayView == null) return

        try {
            windowManager?.removeView(overlayView)
            isOverlayShowing = false
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun createOverlayView() {
        val frame = FrameLayout(this)
        frame.setBackgroundColor(Color.BLACK)
        
        val message = TextView(this)
        message.text = "FOCUS MODE ON\n\nGet back to your goals!"
        message.setTextColor(Color.WHITE)
        message.textSize = 24f
        message.gravity = Gravity.CENTER
        message.typeface = android.graphics.Typeface.DEFAULT_BOLD
        
        val layoutParams = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT
        )
        layoutParams.gravity = Gravity.CENTER
        frame.addView(message, layoutParams)
        
        overlayView = frame
    }

    override fun onDestroy() {
        super.onDestroy()
        hideOverlay()
    }
}