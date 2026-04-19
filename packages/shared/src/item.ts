import { z } from "zod";

export const ITEM_TYPES = [
  "text",
  "image",
  "link",
  "video",
  "screenshot",
  "clipboard",
] as const;

export const ItemTypeSchema = z.enum(ITEM_TYPES);
export type ItemType = z.infer<typeof ItemTypeSchema>;

export const ItemMetadataSchema = z
  .object({
    url: z.string().optional(),
    title: z.string().optional(),
    favicon: z.string().optional(),
    source_app: z.string().optional(),
  })
  .partial();
export type ItemMetadata = z.infer<typeof ItemMetadataSchema>;

export const ItemAiSchema = z.object({
  summary: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});
export type ItemAi = z.infer<typeof ItemAiSchema>;

export const ItemSchema = z.object({
  id: z.string().min(1),
  user_id: z.string().min(1),
  type: ItemTypeSchema,
  content: z.string(),
  metadata: ItemMetadataSchema.optional(),
  ai: ItemAiSchema.optional(),
  created_at: z.iso.datetime(),
  sync_file: z.boolean().default(false),
  folder_id: z.string().nullable().optional(),
});
export type Item = z.infer<typeof ItemSchema>;

export const CreateItemSchema = z.object({
  type: ItemTypeSchema,
  content: z.string(),
  metadata: ItemMetadataSchema.optional(),
  ai: ItemAiSchema.optional(),
  sync_file: z.boolean().default(false),
  folder_id: z.string().nullable().optional(),
});
/** 입력 타입: sync_file은 선택(기본 false), 파싱 후 결과에는 포함됨 */
export type CreateItem = z.input<typeof CreateItemSchema>;
export type CreateItemParsed = z.output<typeof CreateItemSchema>;
