import { z } from "zod";

export const SessionCreatedBySchema = z.enum(["user", "ai"]);
export type SessionCreatedBy = z.infer<typeof SessionCreatedBySchema>;

export const SessionSchema = z.object({
  id: z.string().min(1),
  user_id: z.string().min(1),
  name: z.string().min(1),
  started_at: z.iso.datetime(),
  ended_at: z.iso.datetime().nullable(),
  created_by: SessionCreatedBySchema,
});
export type Session = z.infer<typeof SessionSchema>;

export const CreateSessionSchema = z.object({
  name: z.string().min(1),
  started_at: z.iso.datetime().optional(),
  created_by: SessionCreatedBySchema.default("user"),
});
export type CreateSession = z.infer<typeof CreateSessionSchema>;

export const CloseSessionSchema = z.object({
  id: z.string().min(1),
  ended_at: z.iso.datetime().optional(),
});
export type CloseSession = z.infer<typeof CloseSessionSchema>;
