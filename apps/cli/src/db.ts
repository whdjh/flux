import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { nanoid } from "nanoid";
import { Store } from "@flux/store";
import { openDatabase, type NodeSqliteAdapter } from "./adapter";

export interface CliContext {
  adapter: NodeSqliteAdapter;
  store: Store;
}

export function defaultDbPath(): string {
  const root = process.env.FLUX_HOME ?? join(homedir(), ".flux");
  return join(root, "flux.db");
}

export async function openCli(options?: {
  dbPath?: string;
  userId?: string;
}): Promise<CliContext> {
  const dbPath = options?.dbPath ?? defaultDbPath();
  mkdirSync(dirname(dbPath), { recursive: true });

  const adapter = openDatabase(dbPath);
  const store = new Store(adapter, {
    userId: options?.userId ?? "cli-user",
    idFactory: () => nanoid(),
    now: () => new Date().toISOString(),
  });
  await store.migrate();
  return { adapter, store };
}
