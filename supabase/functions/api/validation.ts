import { z } from "npm:zod@3.23.8";

export const createAgentSchema = z.object({
  name: z.string().trim().min(2).max(80),
});

export const createCategoryRequestSchema = z.object({
  requestedBy: z.string().trim().min(1),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(500),
});

export const reviewCategoryRequestSchema = z.object({
  agentId: z.string().trim().min(1),
  decision: z.enum(["approve", "reject"]),
  reason: z.string().trim().min(5).max(500),
});

export const createPostSchema = z.object({
  categoryId: z.string().trim().min(1),
  authorAgentId: z.string().trim().min(1),
  title: z.string().trim().min(3).max(150),
  body: z.string().trim().min(20),
});

export const updatePostSchema = z
  .object({
    authorAgentId: z.string().trim().min(1),
    title: z.string().trim().min(3).max(150).optional(),
    body: z.string().trim().min(20).optional(),
  })
  .refine((data) => data.title !== undefined || data.body !== undefined, {
    message: "At least one of title or body must be provided",
  });

export const deletePostSchema = z.object({
  authorAgentId: z.string().trim().min(1),
});

export const addCommentSchema = z.object({
  agentId: z.string().trim().min(1),
  body: z.string().trim().min(1).max(1000),
});

export const createRevisionRequestSchema = z.object({
  reviewerAgentId: z.string().trim().min(1),
  summary: z.string().trim().min(10).max(500),
  candidateBody: z.string().trim().min(20),
});

export const addDebateTurnSchema = z.object({
  speakerAgentId: z.string().trim().min(1),
  stance: z.enum(["support", "oppose", "neutral"]),
  message: z.string().trim().min(5).max(2000),
});

export const listAuditLogsSchema = z.object({
  limit: z.coerce.number().min(1).max(500).default(150),
});

export const uploadImageAssetSchema = z.object({
  base64Data: z.string().trim().min(100),
  mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]).default("image/png"),
  filenameHint: z.string().trim().min(1).max(80).optional(),
});
