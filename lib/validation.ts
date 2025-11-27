import { z } from "zod";

export const PageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const ReviewCreateSchema = z.object({
  albumId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  body: z.string().min(1).max(1000),
  album: z
    .object({
      name: z.string(),
      artists: z.array(z.object({ id: z.string().optional().default(""), name: z.string() })).default([]),
      images: z.array(
        z.object({
          url: z.string().url(),
          width: z.number().int(),
          height: z.number().int(),
        })
      ).default([]),
    })
    .nullable()
    .optional(),
});

export const ReviewEditSchema = z.object({
  rating: ReviewCreateSchema.shape.rating.optional(),
  body: z.string().trim().min(1).max(5000).optional(),
});

export const CommentCreateSchema = z.object({
  body: z.string().trim().min(1).max(4000),
  parentId: z.string().optional(), // for threaded replies
});

export const CommentEditSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export const LikeTargetSchema = z.object({
  targetType: z.enum(["review", "comment"]),
  targetId: z.string().min(1),
  action: z.enum(["like", "unlike"]),
});

export const FavoritesTop5ItemSchema = z.object({
  rank: z.number().int().min(1).max(5),
  albumId: z.string().min(1),
});

// Allow 0–5 so users can clear favorites if they want
export const FavoritesTop5PayloadSchema = z.object({
  favorites: z
    .array(FavoritesTop5ItemSchema)
    .max(5)
    .refine(arr => new Set(arr.map(x => x.rank)).size === arr.length, "Ranks must be unique")
    .refine(arr => new Set(arr.map(x => x.albumId)).size === arr.length, "Duplicate albums are not allowed"),
});

export const FollowToggleSchema = z.object({
  targetUserId: z.string().trim().min(1),
  action: z.enum(["follow", "unfollow"]),
});
