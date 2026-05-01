import type { Command } from "commander";
import type { Store } from "@flux/store";
import type { Item } from "@flux/shared";
import type { CliContext } from "../db";

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

export function register(
  program: Command,
  openCli: () => Promise<CliContext>
): void {
  program
    .command("list")
    .description("아이템 목록 (최신순)")
    .option("--folder <folderId>", "특정 폴더만 (값 없이는 inbox=null)")
    .option("--inbox", "folder_id가 null인 아이템만")
    .option("-n, --limit <count>", "개수 제한", (v) => parseInt(v, 10))
    .action(async (opts) => {
      const ctx = await openCli();
      try {
        const folderId = opts.inbox ? null : opts.folder;
        const items = await listItems(ctx.store, {
          folderId,
          limit: opts.limit,
        });
        process.stdout.write(formatItemList(items) + "\n");
      } finally {
        ctx.adapter.close();
      }
    });
}
