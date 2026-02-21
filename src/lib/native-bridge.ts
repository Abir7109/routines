import { registerPlugin } from '@capacitor/core';

export interface FocusPlugin {
  startFocusSession(options: { duration: number; subject: string; distractionBlocking: boolean }): Promise<void>;
  stopFocusSession(): Promise<void>;
  checkFocusPermissions(): Promise<{ overlay: boolean; usageStats: boolean }>;
  requestOverlayPermission(): Promise<void>;
  requestUsagePermission(): Promise<void>;
  updateBlockedApps(options: { apps: Array<{ id: string; packageName: string }> }): Promise<void>;
}

const FocusMode = registerPlugin<FocusPlugin>('FocusMode');

const isNativeAvailable = () => {
  if (typeof window === 'undefined') return false;
  // Check if running in Capacitor
  return !!(window as any).Capacitor?.isNativePlatform();
};

export const nativeBridge = {
  startFocus: async (totalTimeMs: number, distractionBlocking: boolean = true): Promise<boolean> => {
    try {
      await FocusMode.startFocusSession({ 
        duration: Math.floor(totalTimeMs / 1000), 
        subject: "Focus",
        distractionBlocking
      });
      return true;
    } catch (error) {
      console.error('Failed to start native focus:', error);
      return false;
    }
  },

  updateBlockedApps: async (apps: Array<{ id: string; packageName: string }>): Promise<boolean> => {
    try {
      await FocusMode.updateBlockedApps({ apps });
      return true;
    } catch (error) {
      console.error('Failed to update blocked apps:', error);
      return false;
    }
  },

  stopFocus: async (): Promise<boolean> => {
    try {
      await FocusMode.stopFocusSession();
      return true;
    } catch (error) {
      console.error('Failed to stop native focus:', error);
      return false;
    }
  },

  updateTime: async (timeLeft: number, isRunning: boolean, totalTime: number): Promise<boolean> => {
    // Native service handles its own timer, so we don't need to push updates constantly
    // But we might want to sync state if needed. For now, no-op.
    return true;
  },

  checkPermissions: async () => {
    if (!isNativeAvailable()) return { overlay: true, usageStats: true };
    try {
      const result = await FocusMode.checkFocusPermissions();
      return result;
    } catch (e) {
      console.error("Error checking permissions:", e);
      return { overlay: false, usageStats: false };
    }
  },

  requestPermissions: async (): Promise<boolean> => {
    try {
      // Check permissions first to avoid unnecessary requests or double requests
      const perms = await FocusMode.checkFocusPermissions();
      
      if (!perms.overlay) {
        await FocusMode.requestOverlayPermission();
        // Return false to indicate we are not ready yet (user needs to grant permission)
        return false;
      }
      
      if (!perms.usageStats) {
        await FocusMode.requestUsagePermission();
        // Return false to indicate we are not ready yet
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return false;
    }
  },

  isNativeAvailable
};