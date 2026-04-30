import type { Store } from "@flux/store";
import type { Item } from "@flux/shared";

export interface ListInput {
  folderId?: string | null;
  limit?: number;
}

export async function listItems(store: Store, input: ListInput = {}): Promise<Item[]> {
  const items = await store.items.findAll(
    input.folderId !== undefined ? { folderId: input.folderId } : {}
  );
  const limit = input.limit ?? items.length;
  return items.slice(0, limit);
}

export function formatItemRow(item: Item): string {
  const title = item.metadata?.title ?? item.content.slice(0, 40);
  return `${item.created_at}  ${item.type.padEnd(10)}  ${item.id}  ${title}`;
}

export function formatItemList(items: Item[]): string {
  if (items.length === 0) return "(no items)";
  return items.map(formatItemRow).join("\n");
}
