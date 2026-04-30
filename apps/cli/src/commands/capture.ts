import type { ItemType } from "@flux/shared";
import { openCli } from "../db";

export interface CaptureOptions {
  type: ItemType;
  content: string;
  url?: string;
  title?: string;
  folderId?: string | null;
}

export async function capture(options: CaptureOptions): Promise<void> {
  const { store, adapter } = await openCli();
  try {
    const item = await store.items.insert({
      type: options.type,
      content: options.content,
      metadata:
        options.url || options.title
          ? { url: options.url, title: options.title }
          : undefined,
      folder_id: options.folderId ?? null,
    });
    process.stdout.write(`captured ${item.id} (${item.type})\n`);
  } finally {
    adapter.close();
  }
}
