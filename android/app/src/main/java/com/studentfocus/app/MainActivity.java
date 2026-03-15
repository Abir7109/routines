package com.studentfocus.app;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FocusPlugin.class);
        super.onCreate(savedInstanceState);
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        // Stop focus services when app is destroyed (e.g., cleared from recent apps)
        stopFocusServices();
    }
    
    private void stopFocusServices() {
        try {
            // Stop the timer service
            Intent timerIntent = new Intent(this, FocusTimerService.class);
            timerIntent.setAction("STOP_TIMER");
            startService(timerIntent);
            
            // Stop the app blocker service
            Intent blockerIntent = new Intent(this, AppBlockerService.class);
            blockerIntent.setAction("STOP_SERVICE");
            startService(blockerIntent);
            
            // Stop the overlay service
            Intent overlayIntent = new Intent(this, TimerOverlayService.class);
            overlayIntent.setAction("STOP_SERVICE");
            startService(overlayIntent);
            
            // Cancel any notifications
            android.app.NotificationManager notificationManager = 
                (android.app.NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                notificationManager.cancelAll();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
