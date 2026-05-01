import type { Command } from "commander";
import type { Store, SyncQueueEntry } from "@flux/store";
import type { CliContext } from "../db";

export interface SyncStatus {
  pending: number;
  lastError: string | null;
}

export async function syncStatus(store: Store): Promise<SyncStatus> {
  const pending = await store.syncQueue.size();
  if (pending === 0) {
    return { pending: 0, lastError: null };
  }
  // peek은 id ASC 정렬. 가장 최근(=id 큰) entry부터 거꾸로 훑어
  // 첫 번째 non-null last_error를 찾는다.
  const entries = await store.syncQueue.peek(pending);
  let lastError: string | null = null;
  for (let i = entries.length - 1; i >= 0; i--) {
    const err = entries[i]?.last_error ?? null;
    if (err !== null) {
      lastError = err;
      break;
    }
  }
  return { pending, lastError };
}

export async function syncPush(
  store: Store,
  input: { dryRun: boolean; limit?: number }
): Promise<SyncQueueEntry[]> {
  if (!input.dryRun) {
    throw new Error("non-dry-run not implemented (backend not ready)");
  }
  const limit = input.limit ?? 50;
  return store.syncQueue.peek(limit);
}

export function formatSyncStatus(status: SyncStatus): string {
  const err = status.lastError ?? "none";
  return `pending=${status.pending}  last_error=${err}`;
}

export function formatSyncEntries(entries: SyncQueueEntry[]): string {
  if (entries.length === 0) return "(no entries)";
  return entries
    .map((e) => {
      const err = e.last_error ?? "none";
      return `${e.id}  ${e.entity}/${e.op}  ${e.entity_id}  attempts=${e.attempts}  last_error=${err}`;
    })
    .join("\n");
}

export function register(
  program: Command,
  openCli: () => Promise<CliContext>
): void {
  const syncCmd = program
    .command("sync")
    .description("동기화 큐 점검 (status / push)");

  syncCmd
    .command("status")
    .description("sync_queue 대기 상태 출력")
    .action(async () => {
      const ctx = await openCli();
      try {
        const status = await syncStatus(ctx.store);
        process.stdout.write(formatSyncStatus(status) + "\n");
      } finally {
        ctx.adapter.close();
      }
    });

  syncCmd
    .command("push")
    .description("sync_queue를 서버로 전송 (현재는 dry-run만 지원)")
    .option("--dry-run", "전송 없이 큐만 출력 (기본값)", true)
    .option("--no-dry-run", "실제 전송 (backend 준비 전이라 사용 불가)")
    .option("--limit <n>", "최대 출력 개수", (v) => parseInt(v, 10), 50)
    .action(async (opts: { dryRun: boolean; limit: number }) => {
      const ctx = await openCli();
      try {
        const entries = await syncPush(ctx.store, {
          dryRun: opts.dryRun,
          limit: opts.limit,
        });
        process.stdout.write(formatSyncEntries(entries) + "\n");
      } catch (err) {
        process.stderr.write(
          `${err instanceof Error ? err.message : String(err)}\n`
        );
        process.exit(1);
      } finally {
        ctx.adapter.close();
      }
    });
}
