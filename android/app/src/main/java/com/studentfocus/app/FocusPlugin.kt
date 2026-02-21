package com.studentfocus.app

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import org.json.JSONException
import org.json.JSONObject
import java.util.ArrayList
import java.util.HashSet

@CapacitorPlugin(name = "FocusMode")
class FocusPlugin : Plugin() {

    @PluginMethod
    fun startFocusSession(call: PluginCall) {
        val duration = call.getInt("duration", 25 * 60)!!
        val subject = call.getString("subject", "Focus")
        val distractionBlocking = call.getBoolean("distractionBlocking", false)!!

        val intent = Intent(context, FocusTimerService::class.java)
        intent.action = "START_TIMER"
        intent.putExtra("duration", duration)
        intent.putExtra("subject", subject)
        intent.putExtra("distractionBlocking", distractionBlocking)
        context.startService(intent)

        call.resolve()
    }

    @PluginMethod
    fun stopFocusSession(call: PluginCall) {
        val intent = Intent(context, FocusTimerService::class.java)
        intent.action = "STOP_TIMER"
        context.startService(intent)
        call.resolve()
    }

    @PluginMethod
    fun checkFocusPermissions(call: PluginCall) {
        try {
            val ret = JSObject()
            val overlay = Settings.canDrawOverlays(context)
            
            val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as android.app.AppOpsManager
            val mode = appOps.checkOpNoThrow(android.app.AppOpsManager.OPSTR_GET_USAGE_STATS, 
                android.os.Process.myUid(), context.packageName)
            val usageStats = mode == android.app.AppOpsManager.MODE_ALLOWED
            
            ret.put("overlay", overlay)
            ret.put("usageStats", usageStats)
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to check permissions: " + e.message)
        }
    }

    @PluginMethod
    fun requestOverlayPermission(call: PluginCall) {
        try {
            if (!Settings.canDrawOverlays(context)) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + context.packageName)
                )
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
            }
            call.resolve()
        } catch (e: Exception) {
            call.reject("Failed to request overlay permission: " + e.message)
        }
    }

    @PluginMethod
    fun requestUsagePermission(call: PluginCall) {
        try {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
            call.resolve()
        } catch (e: Exception) {
            call.reject("Failed to request usage permission: " + e.message)
        }
    }

    @PluginMethod
    fun updateBlockedApps(call: PluginCall) {
        val apps = call.getArray("apps")
        if (apps == null) {
            call.reject("No apps provided")
            return
        }

        val packageNames = ArrayList<String>()
        try {
            for (i in 0 until apps.length()) {
                val app = apps.getJSONObject(i)
                packageNames.add(app.getString("packageName"))
            }
        } catch (e: JSONException) {
            call.reject("Invalid app data", e)
            return
        }

        // Save to SharedPreferences
        val prefs = context.getSharedPreferences("FocusPrefs", Context.MODE_PRIVATE)
        val editor = prefs.edit()
        editor.putStringSet("blocked_packages", HashSet(packageNames))
        editor.apply()

        // If service is running, notify it
        val intent = Intent(context, AppBlockerService::class.java)
        intent.action = "UPDATE_APPS"
        intent.putStringArrayListExtra("blocked_apps", packageNames)
        context.startService(intent)

        call.resolve()
    }
}
