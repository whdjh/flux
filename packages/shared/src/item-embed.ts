import { z } from "zod";

export const ItemEmbedSchema = z.object({
  document_id: z.string().min(1),
  item_id: z.string().min(1),
  position: z.int().min(0),
});
export type ItemEmbed = z.infer<typeof ItemEmbedSchema>;

export const CreateItemEmbedSchema = ItemEmbedSchema;
export type CreateItemEmbed = z.infer<typeof CreateItemEmbedSchema>;
