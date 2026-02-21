package com.studentfocus.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.CountDownTimer
import android.os.IBinder
import androidx.core.app.NotificationCompat

class FocusTimerService : Service() {

    private var timer: CountDownTimer? = null
    private val CHANNEL_ID = "FocusTimerChannel"
    private val NOTIFICATION_ID = 1

    override fun onBind(intent: Intent): IBinder? {
        return null
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent != null) {
            val action = intent.action
            if (action == "START_TIMER") {
                val duration = intent.getIntExtra("duration", 25 * 60)
                val subject = intent.getStringExtra("subject") ?: "Focus"
                val blocking = intent.getBooleanExtra("distractionBlocking", false)
                startTimer(duration, subject, blocking)
            } else if (action == "STOP_TIMER") {
                stopTimer()
            }
        }
        return START_STICKY
    }

    private fun startTimer(durationSeconds: Int, subject: String, blocking: Boolean) {
        startForeground(NOTIFICATION_ID, createNotification(subject, durationSeconds, durationSeconds))
        
        timer?.cancel()
        timer = object : CountDownTimer(durationSeconds * 1000L, 1000) {
            override fun onTick(millisUntilFinished: Long) {
                val secondsLeft = (millisUntilFinished / 1000).toInt()
                updateNotification(subject, secondsLeft, durationSeconds)
                
                // Send broadcast to update UI or Overlay
                val broadcast = Intent("UPDATE_TIMER")
                broadcast.putExtra("seconds", secondsLeft)
                sendBroadcast(broadcast)

                // Update overlay service
                val overlayIntent = Intent(this@FocusTimerService, TimerOverlayService::class.java)
                overlayIntent.action = "UPDATE_TIMER"
                overlayIntent.putExtra("seconds", secondsLeft)
                startService(overlayIntent)
            }

            override fun onFinish() {
                stopTimer()
                // Notify finished
            }
        }.start()

        // Start overlay
        val overlayIntent = Intent(this, TimerOverlayService::class.java)
        overlayIntent.action = "SHOW_OVERLAY"
        overlayIntent.putExtra("subject", subject)
        overlayIntent.putExtra("seconds", durationSeconds)
        startService(overlayIntent)

        // Start App Blocker if enabled
        if (blocking) {
             val blockerIntent = Intent(this, AppBlockerService::class.java)
             blockerIntent.action = "START_BLOCKING"
             startService(blockerIntent)
        }
    }

    private fun stopTimer() {
        timer?.cancel()
        timer = null
        stopForeground(true)
        stopSelf()
        
        // Stop overlay
        val overlayIntent = Intent(this, TimerOverlayService::class.java)
        overlayIntent.action = "HIDE_OVERLAY"
        startService(overlayIntent)

        // Stop App Blocker
        val blockerIntent = Intent(this, AppBlockerService::class.java)
        blockerIntent.action = "STOP_BLOCKING"
        startService(blockerIntent)
    }

    private fun createNotification(subject: String, secondsLeft: Int, totalSeconds: Int): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this, 0, Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Focusing on $subject")
            .setContentText("Time remaining: ${formatTime(secondsLeft)}")
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentIntent(pendingIntent)
            .setOnlyAlertOnce(true)
            .setProgress(totalSeconds, totalSeconds - secondsLeft, false)
            .build()
    }

    private fun updateNotification(subject: String, secondsLeft: Int, totalSeconds: Int) {
        val notification = createNotification(subject, secondsLeft, totalSeconds)
        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(NOTIFICATION_ID, notification)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Focus Timer",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }
    
    private fun formatTime(seconds: Int): String {
        val m = seconds / 60
        val s = seconds % 60
        return String.format("%02d:%02d", m, s)
    }
}