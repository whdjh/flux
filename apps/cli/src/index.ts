#!/usr/bin/env node
import { Command } from "commander";
import { ITEM_TYPES, type ItemType } from "@flux/shared";
import { openCli } from "./db";
import { capture, formatCaptured } from "./commands/capture";
import { listItems, formatItemList } from "./commands/list";
import {
  createFolder,
  listFolders,
  moveItem,
  formatFolderTree,
} from "./commands/folder";

const program = new Command();

program
  .name("flux")
  .description("Flux CLI — UI 없이 핵심 루프(수집·정리·메모·검색·동기화) 검증")
  .version("0.0.0");

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

const folderCmd = program
  .command("folder")
  .description("폴더 관리 (create / ls / mv)");

folderCmd
  .command("create")
  .description("폴더 생성")
  .argument("<name>", "폴더 이름")
  .option("--parent <id>", "부모 폴더 ID (없으면 루트)")
  .action(async (name: string, opts) => {
    const ctx = await openCli();
    try {
      const folder = await createFolder(ctx.store, {
        name,
        parentId: opts.parent,
      });
      process.stdout.write(`created ${folder.id}  ${folder.name}\n`);
    } finally {
      ctx.adapter.close();
    }
  });

folderCmd
  .command("ls")
  .description("폴더 트리 출력")
  .action(async () => {
    const ctx = await openCli();
    try {
      const tree = await listFolders(ctx.store);
      process.stdout.write(formatFolderTree(tree) + "\n");
    } finally {
      ctx.adapter.close();
    }
  });

folderCmd
  .command("mv")
  .description("아이템을 폴더로 이동 (또는 inbox로)")
  .argument("<itemId>", "아이템 ID")
  .argument("[folderId]", "대상 폴더 ID (생략하면 inbox)")
  .action(async (itemId: string, folderId: string | undefined) => {
    const ctx = await openCli();
    try {
      const target = folderId ?? null;
      const moved = await moveItem(ctx.store, itemId, target);
      if (!moved) {
        process.stderr.write(`item not found: ${itemId}\n`);
        process.exit(1);
      }
      process.stdout.write(
        `moved ${moved.id} → ${moved.folder_id ?? "(inbox)"}\n`
      );
    } finally {
      ctx.adapter.close();
    }
  });

program.parseAsync(process.argv).catch((err) => {
  process.stderr.write(`error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
