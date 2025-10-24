"use client";

interface UserHeaderProps {
  user: any;
  loading: boolean;
}

export default function UserHeader({ user, loading }: UserHeaderProps) {
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

  if (!user) {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur">
        <p className="text-zinc-400">Unable to load profile information</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur">
      <div className="flex items-center gap-6">
        {/* Profile Picture */}
        <div className="relative">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || user.username || "Profile"}
              className="h-20 w-20 rounded-full object-cover border-2 border-violet-500/20"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-violet-500/20 flex items-center justify-center border-2 border-violet-500/20">
              <span className="text-2xl font-semibold text-violet-400">
                {(user.name || user.username || "U")[0].toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {user.name || user.username || "Unknown User"}
          </h1>
          <p className="text-zinc-400 mt-1">
            @{user.username || "username"}
          </p>
          {user.bio ? (
            <p className="text-zinc-300 mt-2 max-w-md">
              {user.bio}
            </p>
          ) : (
            <p className="text-zinc-500 mt-2 italic">
              No bio available
            </p>
          )}
        </div>

        {/* Stats (placeholder for future implementation) */}
        <div className="hidden md:flex gap-8 text-center">
          <div>
            <div className="text-2xl font-semibold text-violet-400">
              {user.albumsCount || 0}
            </div>
            <div className="text-sm text-zinc-400">Albums</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-violet-400">
              {user.reviewsCount || 0}
            </div>
            <div className="text-sm text-zinc-400">Reviews</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-violet-400">
              {user.followersCount || 0}
            </div>
            <div className="text-sm text-zinc-400">Followers</div>
          </div>
        </div>
      </div>
    </div>
  );
}
