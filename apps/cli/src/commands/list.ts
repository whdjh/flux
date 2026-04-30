import { openCli } from "../db";

export interface ListOptions {
  folderId?: string | null;
  limit?: number;
}

export async function list(options: ListOptions = {}): Promise<void> {
  const { store, adapter } = await openCli();
  try {
    const items = await store.items.findAll(
      options.folderId !== undefined ? { folderId: options.folderId } : {}
    );
    const limit = options.limit ?? items.length;
    if (items.length === 0) {
      process.stdout.write("(no items)\n");
      return;
    }
    for (const item of items.slice(0, limit)) {
      const title = item.metadata?.title ?? item.content.slice(0, 40);
      process.stdout.write(
        `${item.created_at}  ${item.type.padEnd(10)}  ${item.id}  ${title}\n`
      );
    }
  } finally {
    adapter.close();
  }
}
