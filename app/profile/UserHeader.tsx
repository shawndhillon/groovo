"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface UserHeaderProps {
  user: any;
  loading: boolean;
}

export default function UserHeader({ user, loading }: UserHeaderProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localUser, setLocalUser] = useState(user);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
      setLocalUser(data.user); // update local user immediately
      setIsEditing(false);
      setSaving(false);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur">
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
      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur">
        <p className="text-zinc-400">Unable to load profile information</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur">

      {/* Top block: photo + user info + edit buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        {/* Profile Picture */}
        <div className="relative">
          {user.image ? (
            <img
              src={localUser.image}
              alt={localUser.name || localUser.username || "Profile"}
              className="h-20 w-20 rounded-full object-cover border-2 border-violet-500/20"
            />
          ) : (
            <div className="h-30 w-30 rounded-full bg-violet-500/20 flex items-center justify-center border-2 border-violet-500/20">
              <span className="text-4xl font-semibold text-violet-400">
                {(localUser.name || localUser.username || "U")[0].toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1">
          {!isEditing ? (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">
                {localUser.name || localUser.username || "Unknown User"}
              </h1>
              <p className="text-zinc-400 mt-1">@{localUser.username}</p>
              {localUser.bio ? (
                <p className="text-zinc-300 mt-2 max-w-md">{localUser.bio}</p>
              ) : (
                <p className="text-zinc-500 mt-2 italic">No bio available</p>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-3 max-w-md mt-1">
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
                className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Your bio"
                className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                rows={3}
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>
          )}
        </div>

        {/* Stats section — always visible under the top block */}
        <div className="mt-6 flex gap-8 text-center justify-center sm:justify-start">
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

      {/* Edit Buttons */}
      <div className="flex flex-col items-start gap-2 mt-4 ml-auto text-right">
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-lg border border-zinc-700 px-3 py-1 text-sm text-white hover:bg-zinc-800 transition"
          >
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg border border-zinc-700 px-3 py-1 text-sm text-white bg-green-600 hover:bg-green-500 transition"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="rounded-lg border border-zinc-700 px-3 py-1 text-sm text-white hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
