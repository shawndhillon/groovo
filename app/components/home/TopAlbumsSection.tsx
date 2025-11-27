"use client";

import { useTopAlbumsWeek } from "@/app/hooks/useTopAlbumsWeek";
import NewReleasesGrid from "./NewReleasesGrid";

export default function TopAlbumsSection() {
  const { albums, isLoading, isError } = useTopAlbumsWeek();

  return (
    <section className="mx-auto max-w-7xl px-6 py-6">
      <h1 className="mb-4 text-2xl font-semibold">Top Albums This Week</h1>

      {isError ? (
        <p className="text-sm text-red-400">Could not load top albums.</p>
      ) : (
        <NewReleasesGrid albums={albums} loading={isLoading} />
      )}
    </section>
  );
}
