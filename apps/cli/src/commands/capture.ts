import type { Store } from "@flux/store";
import type { Item, ItemType } from "@flux/shared";

export interface CaptureInput {
  type: ItemType;
  content: string;
  url?: string;
  title?: string;
  folderId?: string | null;
}

export async function capture(store: Store, input: CaptureInput): Promise<Item> {
  return store.items.insert({
    type: input.type,
    content: input.content,
    metadata:
      input.url || input.title
        ? { url: input.url, title: input.title }
        : undefined,
    folder_id: input.folderId ?? null,
  });
}

export function formatCaptured(item: Item): string {
  return `captured ${item.id} (${item.type})`;
}
