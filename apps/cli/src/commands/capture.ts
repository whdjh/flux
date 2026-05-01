import type { Command } from "commander";
import type { Store } from "@flux/store";
import { ITEM_TYPES, type Item, type ItemType } from "@flux/shared";
import type { CliContext } from "../db";

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

export function register(
  program: Command,
  openCli: () => Promise<CliContext>
): void {
  program
    .command("capture")
    .description("아이템 수집")
    .argument("<content>", "본문 (텍스트, URL, 또는 경로)")
    .option(
      "-t, --type <type>",
      `아이템 타입 (${ITEM_TYPES.join("|")})`,
      "text"
    )
    .option("-u, --url <url>", "원본 URL")
    .option("--title <title>", "제목")
    .option("--folder <folderId>", "대상 폴더 ID")
    .action(async (content: string, opts) => {
      if (!ITEM_TYPES.includes(opts.type as ItemType)) {
        process.stderr.write(
          `unknown type: ${opts.type} (allowed: ${ITEM_TYPES.join(", ")})\n`
        );
        process.exit(1);
      }
      const ctx = await openCli();
      try {
        const item = await capture(ctx.store, {
          type: opts.type as ItemType,
          content,
          url: opts.url,
          title: opts.title,
          folderId: opts.folder ?? null,
        });
        process.stdout.write(formatCaptured(item) + "\n");
      } finally {
        ctx.adapter.close();
      }
    });
}
