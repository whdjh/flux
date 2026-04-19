import { z } from "zod";
import { ItemSchema } from "../item";
import { FolderSchema } from "../folder";

export const WsCrdtDeltaSchema = z.object({
  type: z.literal("crdt_delta"),
  doc_id: z.string().min(1),
  delta: z.instanceof(Uint8Array),
});

export const WsItemCreatedSchema = z.object({
  type: z.literal("item_created"),
  item: ItemSchema,
});

export const WsItemDeletedSchema = z.object({
  type: z.literal("item_deleted"),
  item_id: z.string().min(1),
});

export const WsFolderUpdatedSchema = z.object({
  type: z.literal("folder_updated"),
  folder: FolderSchema,
});

export const WsMessageSchema = z.discriminatedUnion("type", [
  WsCrdtDeltaSchema,
  WsItemCreatedSchema,
  WsItemDeletedSchema,
  WsFolderUpdatedSchema,
]);
export type WsMessage = z.infer<typeof WsMessageSchema>;

export type WsMessageType = WsMessage["type"];
