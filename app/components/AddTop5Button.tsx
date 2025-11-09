"use client";

import { useState } from "react";

type FavItem = { rank: number; albumId: string };

async function getCurrentFavorites(): Promise<FavItem[]> {
  const res = await fetch("/api/profile/top5", { cache: "no-store" });
  if (!res.ok) throw new Error(`GET favorites failed: ${res.status}`);
  const json = await res.json().catch(() => ({ items: [] }));
  return Array.isArray(json.items)
    ? json.items.map((x: any) => ({ rank: x.rank, albumId: x.albumId }))
    : [];
}

async function putFavorites(favorites: FavItem[]) {
  const res = await fetch("/api/profile/top5", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ favorites }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.error || `PUT favorites failed: ${res.status}`);
  }
}

export default function AddFavoriteButton({
  albumId,
  className = "",
  label = "Add to Top 5",
}: {
  albumId: string;
  className?: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    setBusy(true);
    setError(null);
    try {
      const current = await getCurrentFavorites();

      // Already present? Just mark as added and exit
      if (current.some((f) => f.albumId === albumId)) {
        setAdded(true);
        setBusy(false);
        window.dispatchEvent(new CustomEvent("top5:updated"));
        return;
      }

      // Enforce max 5
      if (current.length >= 5) {
        throw new Error("Top 5 is full. Remove one before adding another.");
      }

      // Determine next rank (1..5) based on current length
      const nextRank = current.length + 1;
      const updated: FavItem[] = [...current, { rank: nextRank, albumId }];

      await putFavorites(updated);
      setAdded(true);
      window.dispatchEvent(new CustomEvent("favorites:updated"));
    } catch (e: any) {
      setError(e.message || "Failed to add favorite");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      <button
        onClick={onClick}
        disabled={busy || added}
        className={`rounded-lg px-3 py-1 text-sm font-medium transition
          ${added ? "bg-green-600 text-white" : "bg-violet-600 hover:bg-violet-700 text-white"}
          disabled:opacity-60`}
        aria-disabled={busy || added}
      >
        {busy ? "Adding…" : added ? "Added ✓" : label}
      </button>
      {error && <span className="mt-1 text-xs text-red-300">{error}</span>}
    </div>
  );
}
