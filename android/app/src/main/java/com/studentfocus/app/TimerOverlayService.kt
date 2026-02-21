package com.studentfocus.app

import android.app.Service
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView

class TimerOverlayService : Service() {

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null

    override fun onBind(intent: Intent): IBinder? {
        return null
    }

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent != null) {
            val action = intent.action
            if (action == "SHOW_OVERLAY") {
                val subject = intent.getStringExtra("subject") ?: "Focus"
                val seconds = intent.getIntExtra("seconds", 0)
                showOverlay(subject, seconds)
            } else if (action == "UPDATE_TIMER") {
                val seconds = intent.getIntExtra("seconds", 0)
                updateTimer(seconds)
            } else if (action == "HIDE_OVERLAY") {
                hideOverlay()
            }
        }
        return START_NOT_STICKY
    }

    private fun showOverlay(subject: String, seconds: Int) {
        if (overlayView != null) {
            // Update existing
            val subjectView = overlayView!!.findViewById<TextView>(R.id.overlay_subject)
            subjectView.text = subject
            updateTimer(seconds)
            return
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            else
                WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        )

        params.gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
        params.y = 100

        overlayView = LayoutInflater.from(this).inflate(R.layout.overlay_view, null)

        val subjectView = overlayView!!.findViewById<TextView>(R.id.overlay_subject)
        val timerView = overlayView!!.findViewById<TextView>(R.id.overlay_timer)
        val closeBtn = overlayView!!.findViewById<Button>(R.id.overlay_close)

        subjectView.text = subject
        timerView.text = formatTime(seconds)
        
        closeBtn.setOnClickListener {
            hideOverlay()
        }

        windowManager?.addView(overlayView, params)
    }

    private fun updateTimer(seconds: Int) {
        if (overlayView != null) {
            val timerView = overlayView!!.findViewById<TextView>(R.id.overlay_timer)
            timerView.text = formatTime(seconds)
        }
    }

    private fun hideOverlay() {
        if (overlayView != null) {
            try {
                windowManager?.removeView(overlayView)
            } catch (e: Exception) {
                e.printStackTrace()
            }
            overlayView = null
        }
    }
    
    private fun formatTime(seconds: Int): String {
        val m = seconds / 60
        val s = seconds % 60
        return String.format("%02d:%02d", m, s)
    }

    override fun onDestroy() {
        super.onDestroy()
        hideOverlay()
    }
}