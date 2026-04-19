import { z } from "zod";

export const FolderSchema = z.object({
  id: z.string().min(1),
  user_id: z.string().min(1),
  name: z.string().min(1),
  parent_id: z.string().nullable(),
});
export type Folder = z.infer<typeof FolderSchema>;

export const CreateFolderSchema = z.object({
  name: z.string().min(1),
  parent_id: z.string().nullable().optional(),
});
export type CreateFolder = z.infer<typeof CreateFolderSchema>;

export const UpdateFolderSchema = z
  .object({
    name: z.string().min(1).optional(),
    parent_id: z.string().nullable().optional(),
  })
  .refine(
    (data) => data.name !== undefined || data.parent_id !== undefined,
    { message: "at least one field must be provided" }
  );
export type UpdateFolder = z.infer<typeof UpdateFolderSchema>;
