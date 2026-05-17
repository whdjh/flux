import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database, { type Database as Db } from "better-sqlite3";
import { Store } from "./store";
import type { SqliteAdapter, SqlParam } from "./adapter";

// 테스트 전용 어댑터 (in-memory better-sqlite3)
class TestAdapter implements SqliteAdapter {
  constructor(private readonly db: Db) {}
  async exec(sql: string, params?: readonly SqlParam[]): Promise<void> {
    if (!params || params.length === 0) { this.db.exec(sql); return; }
    this.db.prepare(sql).run(...(params as readonly (string | number | null | Buffer)[]));
  }
  async query<T = Record<string, unknown>>(sql: string, params?: readonly SqlParam[]): Promise<T[]> {
    return this.db.prepare(sql).all(...((params ?? []) as readonly (string | number | null | Buffer)[])) as T[];
  }
  async transaction<T>(fn: (tx: SqliteAdapter) => Promise<T>): Promise<T> {
    this.db.exec("BEGIN");
    try { const r = await fn(this); this.db.exec("COMMIT"); return r; }
    catch (e) { this.db.exec("ROLLBACK"); throw e; }
  }
  close(): void { this.db.close(); }
}

function makeStore(): { store: Store; close: () => void } {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  const adapter = new TestAdapter(db);
  let counter = 0;
  const store = new Store(adapter, {
    userId: "test-user",
    idFactory: () => `id-${++counter}`,
    now: () => new Date(2026, 4, 17, 0, 0, counter).toISOString(),
  });
  return { store, close: () => adapter.close() };
}

describe("Store 자동 enqueue", () => {
  let ctx: { store: Store; close: () => void };

  beforeEach(async () => {
    ctx = makeStore();
    await ctx.store.migrate();
  });

  afterEach(() => ctx.close());

  it("Item insert 시 sync_queue에 create entry 추가", async () => {
    const item = await ctx.store.items.insert({ type: "text", content: "hi" });
    const entries = await ctx.store.syncQueue.peek();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.entity).toBe("items");
    expect(entries[0]?.entity_id).toBe(item.id);
    expect(entries[0]?.op).toBe("create");
  });

  it("Item update 시 op=update entry 추가", async () => {
    const item = await ctx.store.items.insert({ type: "text", content: "a" });
    await ctx.store.items.update(item.id, { content: "b" });
    const entries = await ctx.store.syncQueue.peek();
    expect(entries).toHaveLength(2);
    expect(entries[1]?.op).toBe("update");
    expect(entries[1]?.entity_id).toBe(item.id);
  });

  it("Item delete 시 op=delete entry 추가", async () => {
    const item = await ctx.store.items.insert({ type: "text", content: "x" });
    await ctx.store.items.delete(item.id);
    const entries = await ctx.store.syncQueue.peek();
    expect(entries).toHaveLength(2);
    expect(entries[1]?.op).toBe("delete");
  });

  it("Document insert payload에 crdt_doc 제외 (바이너리 직렬화 회피)", async () => {
    const doc = await ctx.store.documents.insert({ title: "n", crdt_doc: new Uint8Array([1, 2, 3]) });
    const entries = await ctx.store.syncQueue.peek();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.entity).toBe("documents");
    const payload = JSON.parse(entries[0]?.payload ?? "{}");
    expect(payload.id).toBe(doc.id);
    expect(payload.crdt_doc).toBeUndefined(); // 명시적으로 빠져야
  });

  it("Folder insert/update/delete 시 각 entry 추가", async () => {
    const f = await ctx.store.folders.insert({ name: "X" });
    await ctx.store.folders.update(f.id, { name: "Y" });
    await ctx.store.folders.delete(f.id);
    const entries = await ctx.store.syncQueue.peek();
    expect(entries).toHaveLength(3);
    expect(entries.map((e) => e.op)).toEqual(["create", "update", "delete"]);
    expect(entries.every((e) => e.entity === "folders")).toBe(true);
  });

  it("Session insert/close/delete 시 각 entry", async () => {
    const s = await ctx.store.sessions.insert({ name: "S" });
    await ctx.store.sessions.close(s.id);
    await ctx.store.sessions.delete(s.id);
    const entries = await ctx.store.syncQueue.peek();
    expect(entries).toHaveLength(3);
    expect(entries.map((e) => e.op)).toEqual(["create", "update", "delete"]);
    expect(entries.every((e) => e.entity === "sessions")).toBe(true);
  });

  it("ItemEmbed insert/delete entity_id 합성키", async () => {
    const item = await ctx.store.items.insert({ type: "text", content: "x" });
    const doc = await ctx.store.documents.insert({ title: "d" });
    await ctx.store.embeds.insert({ document_id: doc.id, item_id: item.id, position: 0 });
    await ctx.store.embeds.delete(doc.id, item.id, 0);
    const entries = (await ctx.store.syncQueue.peek()).filter((e) => e.entity === "item_embeds");
    expect(entries).toHaveLength(2);
    expect(entries[0]?.entity_id).toBe(`${doc.id}:${item.id}:0`);
    expect(entries[0]?.op).toBe("create");
    expect(entries[1]?.op).toBe("delete");
  });

  it("CLI capture·docs·folder 흐름 후 sync push에 데이터 — 통합 시나리오", async () => {
    // 사용자가 capture·folder·docs new를 한 흐름을 시뮬레이션
    await ctx.store.items.insert({ type: "text", content: "딥러닝 메모" });
    await ctx.store.items.insert({ type: "link", content: "https://x.com" });
    const folder = await ctx.store.folders.insert({ name: "AI" });
    await ctx.store.documents.insert({ title: "AI 노트", folder_id: folder.id });
    const entries = await ctx.store.syncQueue.peek();
    expect(entries.length).toBe(4); // items 2 + folders 1 + documents 1
    // sync push --dry-run이 빈 큐가 아니라 4개 entry를 본다는 본질 검증
    expect(entries.filter((e) => e.entity === "items")).toHaveLength(2);
    expect(entries.filter((e) => e.entity === "folders")).toHaveLength(1);
    expect(entries.filter((e) => e.entity === "documents")).toHaveLength(1);
  });
});
