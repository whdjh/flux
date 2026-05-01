#!/usr/bin/env node
import { Command } from "commander";
import { openCli } from "./db";
import { register as registerCapture } from "./commands/capture";
import { register as registerList } from "./commands/list";
import { register as registerFolder } from "./commands/folder";
import { register as registerDocs } from "./commands/docs";

const program = new Command()
  .name("flux")
  .description("Flux CLI — UI 없이 핵심 루프(수집·정리·메모·검색·동기화) 검증")
  .version("0.0.0");

registerCapture(program, openCli);
registerList(program, openCli);
registerFolder(program, openCli);
registerDocs(program, openCli);

program.parseAsync(process.argv).catch((err) => {
  process.stderr.write(`error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
