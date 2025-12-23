/**
 * Purpose:
 *   Interactive profile header component that displays and edits basic user info.
 *
 * Scope:
 *   - Used on the profile page (/profile) and user profile pages (/profile/user/[id])
 *   - Supports both "self" mode (owner viewing their own page) and external view
 *
 * Role:
 *   - Display avatar, name, username, bio, and profile statistics
 *   - Allow owners (isSelf=true) to edit their name + bio inline
 *   - Save edits via /api/profile/update
 *   - Show Share Profile + Follow buttons for non-owners
 *   - Handle loading, update syncing, and optimistic UI states
 *
 * Deps:
 *   - next/image OR img tag (current implementation uses <img>)
 *   - ShareButton for copying profile link
 *   - FollowButton for following/unfollowing other users
 *   - /api/profile/update for editing user metadata
 *
 * Notes:
 *   - `localUser` keeps UI in sync with server updates while preventing flicker
 *   - Edit state only applies to the owner view
 *   - Username is read-only and should not be editable here
 */

"use client";

import { useState, useEffect } from "react";
import ShareButton from "@/app/components/ShareButton";
import FollowButton from "@/app/components/FollowButton";

interface UserHeaderProps {
  user: any; // Should consider creating a dedicated type later
  loading: boolean;
  isSelf: boolean; // Whether the viewer is the profile owner
}

export default function UserHeader({ user, loading, isSelf }: UserHeaderProps) {
  // Local UI state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local representation of the user (kept in sync with parent)
  const [localUser, setLocalUser] = useState(user);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
  });

  /**
   * Sync updates from parent
   * (e.g., when profile refreshes after saving or navigating)
   */
  useEffect(() => {
    if (user) {
      setLocalUser((prev: any) => ({ ...prev, ...user }));
      setFormData({
        name: user?.name || "",
        bio: user?.bio || "",
      });
    }
  }, [user]);

  /** Updates form input fields */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setFormData({ ...formData, [e.target.name]: e.target.value });

  /**
   * Save updated profile
   * PUT /api/profile/update
   */
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const res = await fetch("/api/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      const data = await res.json();

      // Update local user UI
      setLocalUser((prev: any) => ({
        ...prev,
        ...data.user,
      }));

      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-8">
        <div className="animate-pulse">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-zinc-700" />
            <div className="space-y-3">
              <div className="h-6 w-48 bg-zinc-700 rounded" />
              <div className="h-4 w-32 bg-zinc-700 rounded" />
              <div className="h-4 w-64 bg-zinc-700 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!localUser) {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-8">
        <p className="text-zinc-400">Unable to load profile information</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6 bg-zinc-900/60 border border-white/10 shadow-xl">
      {/* TOP SECTION — AVATAR + NAME/BIO */}
      <div className="flex gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {localUser.image ? (
            <img
              src={localUser.image}
              alt="Profile"
              className="h-24 w-24 rounded-full object-cover border-2 border-violet-500/30"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
              <span className="text-3xl text-violet-300 font-bold">
                {(localUser.name || localUser.username || "U")[0]}
              </span>
            </div>
          )}
        </div>

        {/* Name, Username, Bio */}
        <div className="flex-1 flex flex-col justify-center">
          {!isSelf || !isEditing ? (
            <>
              <h1 className="text-xl font-semibold tracking-tight">
                {localUser.name || "Unknown User"}
              </h1>
              <p className="text-zinc-400">@{localUser.username}</p>

              <p className="text-zinc-300 mt-2 max-w-sm">
                {localUser.bio || (
                  <span className="italic text-zinc-500">No bio available</span>
                )}
              </p>
            </>
          ) : (
            <div className="flex flex-col gap-3 max-w-sm mt-1">
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="rounded bg-zinc-800 border border-zinc-700 p-2"
              />
              <textarea
                name="bio"
                value={formData.bio}
                rows={3}
                onChange={handleChange}
                className="rounded bg-zinc-800 border border-zinc-700 p-2"
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>
          )}
        </div>
      </div>

      {/* STATS — Instagram style row */}
      <div className="flex justify-around text-center mt-6">
        <div>
          <p className="text-2xl font-semibold text-violet-400">
            {localUser.albumsCount || 0}
          </p>
          <p className="text-zinc-400 text-sm">Albums</p>
        </div>

        <div>
          <p className="text-2xl font-semibold text-violet-400">
            {localUser.reviewsCount || 0}
          </p>
          <p className="text-zinc-400 text-sm">Reviews</p>
        </div>

        <div>
          <p className="text-2xl font-semibold text-violet-400">
            {localUser.followersCount || 0}
          </p>
          <p className="text-zinc-400 text-sm">Followers</p>
        </div>
      </div>

      {/* ACTION BUTTONS — Instagram style */}
      <div className="mt-6 flex gap-3">
        {isSelf ? (
          !isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 rounded-lg border border-zinc-700 py-2 text-sm font-medium text-white bg-zinc-800 hover:bg-zinc-700"
              >
                Edit Profile
              </button>
               <ShareButton
                url={`/profile/user/${localUser._id ?? localUser.id}`}
                label="Share Profile"
                size="sm"
              />
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-medium hover:bg-green-500"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 rounded-lg border border-zinc-700 py-2 text-sm font-medium hover:bg-zinc-800"
              >
                Cancel
              </button>
            </>
          )
        ) : (
          <>
            <FollowButton
              targetUserId={localUser.id}
              initialFollowing={localUser.viewer?.youFollow}
              initialFollowersCount={localUser.followersCount}
            />

            <ShareButton
              url={`/profile/user/${localUser.id}`}
              label="Share"
              size="sm"
            />
          </>
        )}
      </div>
    </div>
  );
}
