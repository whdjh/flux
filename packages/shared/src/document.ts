import { z } from "zod";

export const DocumentSchema = z.object({
  id: z.string().min(1),
  user_id: z.string().min(1),
  title: z.string(),
  crdt_doc: z.instanceof(Uint8Array),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
  folder_id: z.string().nullable(),
});
export type Document = z.infer<typeof DocumentSchema>;

export const CreateDocumentSchema = z.object({
  title: z.string().optional(),
  crdt_doc: z.instanceof(Uint8Array).optional(),
  folder_id: z.string().nullable().optional(),
});
export type CreateDocument = z.infer<typeof CreateDocumentSchema>;

export const UpdateDocumentSchema = z
  .object({
    title: z.string().optional(),
    crdt_doc: z.instanceof(Uint8Array).optional(),
    folder_id: z.string().nullable().optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.crdt_doc !== undefined ||
      data.folder_id !== undefined,
    { message: "at least one field must be provided" }
  );
export type UpdateDocument = z.infer<typeof UpdateDocumentSchema>;
