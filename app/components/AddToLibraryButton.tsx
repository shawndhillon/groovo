// app/components/AddToLibraryButton.tsx
"use client";

import { useMemo, useTransition } from "react";
import { useLibrary, type LibraryAlbum } from "@/app/hooks/useLibrary";

// If you don't use lucide-react, replace icons with text like "+" / "✓"
const Icon = {
  Plus: (props: any) => <span {...props}>＋</span>,
  Check: (props: any) => <span {...props}>✓</span>,
  Spinner: (props: any) => <span {...props} className="animate-pulse">•</span>,
};

type Props = {
  album: LibraryAlbum;
  variant?: "icon" | "pill";
  className?: string;
};

export default function AddToLibraryButton({
  album,
  variant = "pill",
  className,
}: Props) {
  const { isSaved, add, remove } = useLibrary();
  const saved = useMemo(() => isSaved(album.id), [isSaved, album.id]);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () =>
    startTransition(() => {
      if (saved) remove(album.id);
      else add(album);
    });

  if (variant === "icon") {
    return (
      <button
        aria-label={saved ? "Remove from library" : "Add to library"}
        onClick={handleToggle}
        disabled={isPending}
        className={`h-9 w-9 rounded-full border border-neutral-700 hover:bg-neutral-800 grid place-items-center disabled:opacity-60 ${className ?? ""}`}
      >
        {isPending ? (
          <Icon.Spinner />
        ) : saved ? (
          <Icon.Check className="text-sm" />
        ) : (
          <Icon.Plus className="text-sm" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center rounded-2xl border text-sm px-3 py-1.5 transition-all disabled:opacity-60 ${
        saved
          ? "bg-green-600/90 border-green-700 hover:bg-green-600"
          : "bg-neutral-800/70 border-neutral-700 hover:bg-neutral-800"
      } ${className ?? ""}`}
    >
      {isPending ? (
        <Icon.Spinner className="mr-2" />
      ) : saved ? (
        <Icon.Check className="mr-2" />
      ) : (
        <Icon.Plus className="mr-2" />
      )}
      {saved ? "Added to your Library!" : "Add to Library"}
    </button>
  );
}
