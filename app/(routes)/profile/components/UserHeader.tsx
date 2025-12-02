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

  // Form data used for editing name + bio
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
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        {/* Avatar */}
        <div>
          {localUser.image ? (
            <img
              src={localUser.image}
              alt={localUser.name || localUser.username || "Profile"}
              className="h-20 w-20 rounded-full object-cover border-2 border-violet-500/20"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-violet-500/20 flex items-center justify-center border-2 border-violet-500/20">
              <span className="text-4xl font-semibold text-violet-400">
                {(localUser.name || localUser.username || "U")[0].toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* User information */}
        <div className="flex-1">
          {/* Non-edit mode */}
          {!isSelf || !isEditing ? (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">
                {localUser.name || localUser.username || "Unknown User"}
              </h1>
              {localUser.username && (
                <p className="text-zinc-400 mt-1">@{localUser.username}</p>
              )}
              <p className="text-zinc-300 mt-2 max-w-md">
                {localUser.bio || (
                  <span className="italic text-zinc-500">
                    No bio available
                  </span>
                )}
              </p>
            </>
          ) : (
            /** Edit mode UI */
            <div className="flex flex-col gap-3 max-w-md mt-1">
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
              />

              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
              />

              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 flex gap-8 text-center">
          <div>
            <div className="text-2xl font-semibold text-violet-400">
              {localUser.albumsCount || 0}
            </div>
            <div className="text-sm text-zinc-400">Albums</div>
          </div>

          <div>
            <div className="text-2xl font-semibold text-violet-400">
              {localUser.reviewsCount || 0}
            </div>
            <div className="text-sm text-zinc-400">Reviews</div>
          </div>

          <div>
            <div className="text-2xl font-semibold text-violet-400">
              {localUser.followersCount || 0}
            </div>
            <div className="text-sm text-zinc-400">Followers</div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end mt-4 gap-2">
        {isSelf ? (
          /* Self view: Edit + Save UI */
          !isEditing ? (
            <>
              <ShareButton
                url={`/profile/user/${localUser._id ?? localUser.id}`}
                label="Share Profile"
                size="sm"
              />
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-lg border border-zinc-700 px-3 py-1 text-sm text-white hover:bg-zinc-800"
              >
                Edit
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg px-3 py-1 text-sm bg-green-600 hover:bg-green-500"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="rounded-lg border border-zinc-700 px-3 py-1 text-sm hover:bg-zinc-800"
              >
                Cancel
              </button>
            </>
          )
        ) : (
          /* Public view: Share + Follow */
          <>
            <ShareButton
              url={`/profile/user/${localUser.id}`}
              label="Share Profile"
              size="sm"
            />
            <FollowButton
              targetUserId={localUser.id}
              initialFollowing={localUser.viewer?.youFollow}
              initialFollowersCount={localUser.followersCount}
            />
          </>
        )}
      </div>
    </div>
  );
}
