"use client";

import { useEffect, useState } from "react";
import UserHeader from "@/app/profile/UserHeader";
import SavedAlbumsGrid from "@/app/profile/SavedAlbumsGrid";

// Mock data for frontend demonstration
const mockUserProfile = {
  id: "123",
  username: "musicenjoyer34247",
  email: "music@example.com",
  name: "chris",
  image: null,
  bio: "I love music.",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date(),
  albumsCount: 24,
  reviewsCount: 18,
  followersCount: 156
};

const mockSavedAlbums = [
  {
    id: "1",
    name: "Random Access Memories",
    artists: [{ id: "1", name: "Daft Punk" }],
    images: [{ url: "https://i.scdn.co/image/ab67616d00001e029b9b36b0e22870b9f542d937", height: 640, width: 640 }],
    releaseDate: "2013-05-17",
    genres: ["Electronic", "Dance"],
    savedAt: new Date("2024-01-15"),
    review: {
      rating: 5,
      reviewText: "Great album.",
      createdAt: new Date("2024-01-15")
    }
  },
  {
    id: "2",
    name: "In Rainbows",
    artists: [{ id: "2", name: "Radiohead" }],
    images: [{ url: "https://i.scdn.co/image/ab67616d00001e02de3c04b5fc750b68899b20a9", height: 640, width: 640 }],
    releaseDate: "2007-10-10",
    genres: ["Alternative Rock", "Experimental"],
    savedAt: new Date("2024-01-10"),
    review: {
      rating: 4,
      reviewText: "Beautiful album.TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST",
      createdAt: new Date("2024-01-10")
    }
  },
  {
    id: "3",
    name: "Blonde",
    artists: [{ id: "3", name: "Frank Ocean" }],
    images: [{ url: "https://i.scdn.co/image/ab67616d0000b273c5649add07ed3720be9d5526", height: 640, width: 640 }],
    releaseDate: "2016-08-20",
    genres: ["R&B", "Alternative R&B"],
    savedAt: new Date("2024-01-05"),
    review: null
  },
  {
    id: "4",
    name: "good kid, m.A.A.d city",
    artists: [{ id: "4", name: "Kendrick Lamar" }],
    images: [{ url: "https://i.scdn.co/image/ab67616d0000b273d58e537cea05c2156792c53d", height: 640, width: 640 }],
    releaseDate: "2012-10-22",
    genres: ["Hip Hop", "Jazz Rap"],
    savedAt: new Date("2024-01-01"),
    review: {
      rating: 5,
      reviewText: "Goated album.",
      createdAt: new Date("2024-01-01")
    }
  },
  {
    id: "5",
    name: "6 Kiss",
    artists: [{ id: "5", name: "Lil B" }],
    images: [{ url: "https://i.scdn.co/image/ab67616d0000b273bcba1e014ae2257ebce7d2b6", height: 640, width: 640 }],
    releaseDate: "2009-12-22",
    genres: ["Hip Hop", "Rap"],
    savedAt: new Date("2024-01-20"),
    review: {
      rating: 3,
      reviewText: "Powerful album.",
      createdAt: new Date("2024-01-20")
    }
  },
  {
    id: "6",
    name: "Currents",
    artists: [{ id: "6", name: "Tame Impala" }],
    images: [{ url: "https://i.scdn.co/image/ab67616d00001e029e1cfc756886ac782e363d79", height: 640, width: 640 }],
    releaseDate: "2015-07-17",
    genres: ["Psychedelic Pop", "Indie"],
    savedAt: new Date("2024-01-25"),
    review: null
  }
];

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [savedAlbums, setSavedAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setUserProfile(mockUserProfile);
      setSavedAlbums(mockSavedAlbums);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black text-white">
      {/* Header with brand */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-violet-500" />
          <span className="text-lg font-semibold tracking-tight">Groovo</span>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-6 pb-12">
        {/* User Profile Header */}
        <UserHeader 
          user={userProfile} 
          loading={loading}
        />

        {/* Saved Albums Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Saved Albums & Reviews</h2>
          <SavedAlbumsGrid 
            albums={savedAlbums}
            loading={loading}
            error={null}
          />
        </div>
      </div>
    </main>
  );
}
