import { z } from "zod";

export const PageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const ReviewCreateSchema = z.object({
  albumId: z.string().min(1), 
  rating: z.number().refine(n => n >= 1 && n <= 5 && Number.isInteger(n * 2), {
    message: "Rating must be 1–5 in 0.5 steps",
  }),
  body: z.string().trim().min(1).max(5000),
  album: z.object({
    name: z.string(),
    artists: z.array(z.string()),
    image: z.string().url().optional(),
  }).partial().optional(),
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
