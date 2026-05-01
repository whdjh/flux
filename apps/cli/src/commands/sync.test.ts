import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Store } from "@flux/store";
import { NodeSqliteAdapter } from "../adapter";
import Database from "better-sqlite3";
import {
  syncStatus,
  syncPush,
  formatSyncStatus,
  formatSyncEntries,
} from "./sync";

function makeStore(): { store: Store; close: () => void } {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  const adapter = new NodeSqliteAdapter(db);
  let counter = 0;
  const store = new Store(adapter, {
    userId: "test-user",
    idFactory: () => `id-${++counter}`,
    now: () => new Date(2026, 4, 1, 0, 0, counter).toISOString(),
  });
  return { store, close: () => adapter.close() };
}

async function seed(store: Store, entityId: string): Promise<void> {
  await store.syncQueue.enqueue({
    entity: "items",
    entity_id: entityId,
    op: "create",
    payload: JSON.stringify({ id: entityId, type: "text", content: "hi" }),
  });
}

describe("sync commands", () => {
  let ctx: { store: Store; close: () => void };

  beforeEach(async () => {
    ctx = makeStore();
    await ctx.store.migrate();
  });

  afterEach(() => {
    ctx.close();
  });

  describe("syncStatus", () => {
    it("returns pending=0 with null lastError on empty queue", async () => {
      const status = await syncStatus(ctx.store);
      expect(status).toEqual({ pending: 0, lastError: null });
    });

    it("returns pending count after enqueue", async () => {
      await seed(ctx.store, "test-1");
      await seed(ctx.store, "test-2");
      const status = await syncStatus(ctx.store);
      expect(status.pending).toBe(2);
      expect(status.lastError).toBeNull();
    });

    it("returns last error from most recent failed entry", async () => {
      await seed(ctx.store, "test-1");
      await seed(ctx.store, "test-2");
      const entries = await ctx.store.syncQueue.peek(10);
      await ctx.store.syncQueue.markFailed(entries[0]!.id, "old failure");
      await ctx.store.syncQueue.markFailed(entries[1]!.id, "newest failure");
      const status = await syncStatus(ctx.store);
      expect(status.pending).toBe(2);
      expect(status.lastError).toBe("newest failure");
    });
  });

  describe("syncPush", () => {
    it("returns entries in dry-run without removing them", async () => {
      await seed(ctx.store, "test-1");
      await seed(ctx.store, "test-2");
      const entries = await syncPush(ctx.store, { dryRun: true });
      expect(entries).toHaveLength(2);
      expect(await ctx.store.syncQueue.size()).toBe(2);
    });

    it("respects limit option", async () => {
      await seed(ctx.store, "test-1");
      await seed(ctx.store, "test-2");
      await seed(ctx.store, "test-3");
      const entries = await syncPush(ctx.store, { dryRun: true, limit: 2 });
      expect(entries).toHaveLength(2);
    });

    it("throws on non-dry-run (backend not ready)", async () => {
      await seed(ctx.store, "test-1");
      await expect(
        syncPush(ctx.store, { dryRun: false })
      ).rejects.toThrow(/non-dry-run not implemented/);
    });

    it("returns empty array when queue is empty", async () => {
      const entries = await syncPush(ctx.store, { dryRun: true });
      expect(entries).toEqual([]);
    });
  });

  describe("formatters", () => {
    it("formatSyncStatus shows last_error=none when null", () => {
      expect(formatSyncStatus({ pending: 0, lastError: null })).toBe(
        "pending=0  last_error=none"
      );
    });

    it("formatSyncStatus shows last_error message when present", () => {
      expect(
        formatSyncStatus({ pending: 3, lastError: "network timeout" })
      ).toBe("pending=3  last_error=network timeout");
    });

    it("formatSyncEntries shows placeholder for empty input", () => {
      expect(formatSyncEntries([])).toBe("(no entries)");
    });

    it("formatSyncEntries renders one line per entry", async () => {
      await seed(ctx.store, "test-1");
      const entries = await ctx.store.syncQueue.peek(10);
      const out = formatSyncEntries(entries);
      expect(out).toContain("items/create");
      expect(out).toContain("test-1");
      expect(out).toContain("attempts=0");
      expect(out).toContain("last_error=none");
    });
  });
});
