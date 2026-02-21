"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { clientDb } from "@/lib/client-db";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Mail, Camera, Check, Edit2, Lock } from "lucide-react";

interface UserProfile {
  id?: string;
  name: string | null;
  email: string;
  bio?: string | null;
  avatar?: string | null;
}

interface ProfileScreenProps {
  className?: string;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ className }) => {
  const [profile, setProfile] = React.useState<UserProfile>({
    email: "",
    name: null,
    bio: null,
    avatar: null,
  });
  const [loading, setLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);

  type SaveStatus = "idle" | "saving" | "success" | "error";
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");

  // Stats from actual database
  const [totalSessions, setTotalSessions] = React.useState(0);
  const [totalFocusTime, setTotalFocusTime] = React.useState(0);

  // Load profile and stats from API
  React.useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const data = await clientDb.getProfile();

      setProfile({
        id: data.id,
        name: data.name || null,
        email: data.email || "",
        bio: data.bio || null,
        avatar: data.avatar || null,
      });
      setTotalSessions(data.totalSessions || 0);
      setTotalFocusTime(data.totalFocusTime || 0);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveStatus("saving");

    try {
      await clientDb.updateProfile({
        name: profile.name,
        bio: profile.bio,
      });

      setSaveStatus("success");
      setIsEditing(false);
      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setSaveStatus("error");
      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    loadProfileData(); // Reload original data
  };

  // Format focus time
  const formatFocusTime = (seconds: number): string => {
    if (seconds === 0) return "0h";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours === 0) return `${mins}m`;
    return mins > 0 ? `${hours}.${Math.round(mins / 6)}h` : `${hours}h`;
  };

  if (loading) {
    return (
      <div className={cn("min-h-screen pb-32 px-4 pt-6 flex items-center justify-center", className)}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-electric-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-body text-soft-gray">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen pb-32 px-4 pt-6", className)}>
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-title text-soft-white">Profile</h1>
        <p className="text-body text-soft-gray mt-2">
          Manage your profile information
        </p>
      </header>

      {/* Profile Card */}
      <GlassCard className="p-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative group">
            <div
              className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center",
                "bg-gradient-to-br from-electric-blue/20 to-electric-blue/30",
                "border-2 border-electric-blue/50",
                "overflow-hidden"
              )}
            >
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name || "User"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-electric-blue" />
              )}
            </div>

            {/* Camera Icon - Hover to upload */}
            <button
              className={cn(
                "absolute -bottom-1 -right-1 w-8 h-8 rounded-full",
                "bg-electric-blue text-soft-white",
                "flex items-center justify-center",
                "opacity-0 group-hover:opacity-100 transition-opacity",
                "hover:scale-110 active:scale-95 transition-transform"
              )}
              onClick={() => {
                // TODO: Implement file picker for avatar upload
                console.log("Upload avatar");
              }}
              aria-label="Upload avatar"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-5">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-body text-soft-white">
              Name
            </Label>
            <Input
              id="name"
              value={profile.name || ""}
              onChange={(e) => setProfile({ ...profile, name: e.target.value || null })}
              disabled={!isEditing}
              placeholder="Enter your name"
              className={cn(
                "w-full",
                !isEditing && "bg-transparent border-transparent cursor-default"
              )}
            />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-body text-soft-white">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              disabled
              placeholder="Enter your email"
              className={cn(
                "w-full",
                "bg-charcoal-light/30 border-transparent cursor-not-allowed"
              )}
            />
          </div>

          {/* Bio Field */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-body text-soft-white">
              Bio (Optional)
            </Label>
            <textarea
              id="bio"
              value={profile.bio || ""}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value || null })}
              disabled={!isEditing}
              placeholder="Tell us about yourself"
              rows={3}
              maxLength={200}
              className={cn(
                "w-full px-4 py-2 rounded-lg",
                "bg-charcoal-mid/50 border-charcoal-light/50",
                "text-soft-white placeholder:text-soft-gray",
                "focus:outline-none focus:border-electric-blue/50 transition-all",
                "resize-none",
                !isEditing && "bg-transparent border-transparent cursor-default"
              )}
            />
            <div className="text-right text-[10px] text-soft-gray/60">
              {profile.bio?.length || 0}/200
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-charcoal-light/30">
          {!isEditing ? (
            <>
              {/* Edit Button */}
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-charcoal-mid/50 hover:bg-charcoal-mid/70"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </>
          ) : (
            <>
              {/* Cancel Button */}
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={saveStatus === "saving"}
              >
                Cancel
              </Button>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={saveStatus === "saving"}
                className={cn(
                  "min-w-[100px]",
                  saveStatus === "saving" && "opacity-70 cursor-not-allowed"
                )}
              >
                {saveStatus === "saving" ? (
                  <span className="flex items-center gap-2">
                    <span>Saving...</span>
                  </span>
                ) : saveStatus === "success" ? (
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>Saved!</span>
                  </span>
                ) : saveStatus === "error" ? (
                  <span className="text-red-400">
                    Failed
                  </span>
                ) : (
                  <span>Save Changes</span>
                )}
              </Button>
            </>
          )}
        </div>
      </GlassCard>

      {/* Account Settings */}
      <div className="mt-6 space-y-4">
        <h2 className="text-heading text-soft-white mb-4 px-2 uppercase tracking-wider">
          Account Settings
        </h2>

        {/* Change Password */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted-green/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-muted-green" />
              </div>
              <div>
                <h3 className="text-body text-soft-white">Change Password</h3>
                <p className="text-body-small text-soft-gray">
                  Update your password
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="text-sm"
              onClick={() => {
                // TODO: Implement password change
                console.log("Change password");
              }}
            >
              Change
            </Button>
          </div>
        </GlassCard>

        {/* Account Stats - Real Data */}
        <div className="grid grid-cols-2 gap-4">
          <GlassCard className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-electric-blue mb-1">
                {totalSessions}
              </div>
              <div className="text-body-small text-soft-gray">
                Focus Sessions
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-muted-green mb-1">
                {formatFocusTime(totalFocusTime)}
              </div>
              <div className="text-body-small text-soft-gray">
                Total Focus Time
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export { ProfileScreen };
