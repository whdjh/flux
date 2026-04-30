#!/usr/bin/env node
import { Command } from "commander";
import { ITEM_TYPES, type ItemType } from "@flux/shared";
import { capture } from "./commands/capture";
import { list } from "./commands/list";

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
    await capture({
      type: opts.type as ItemType,
      content,
      url: opts.url,
      title: opts.title,
      folderId: opts.folder ?? null,
    });
  });

program
  .command("list")
  .description("아이템 목록 (최신순)")
  .option("--folder <folderId>", "특정 폴더만")
  .option("-n, --limit <count>", "개수 제한", (v) => parseInt(v, 10))
  .action(async (opts) => {
    await list({
      folderId: opts.folder,
      limit: opts.limit,
    });
  });

program.parseAsync(process.argv).catch((err) => {
  process.stderr.write(`error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
