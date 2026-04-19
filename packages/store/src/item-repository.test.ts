import { describe, it, expect, beforeEach } from "vitest";
import { Store } from "./store";
import { createTestAdapter } from "./test-helpers";
import type { SqliteAdapter } from "./adapter";

function makeStore() {
  const adapter = createTestAdapter();
  let idCounter = 0;
  let nowCounter = 0;
  const store = new Store(adapter as unknown as SqliteAdapter, {
    userId: "usr_1",
    idFactory: () => `id_${++idCounter}`,
    now: () => new Date(2026, 3, 19, 0, 0, nowCounter++).toISOString(),
  });
  return { adapter, store };
}

describe("ItemRepository", () => {
  let ctx: ReturnType<typeof makeStore>;
  beforeEach(async () => {
    ctx = makeStore();
    await ctx.store.migrate();
  });

  it("insert 후 findAll로 조회 가능", async () => {
    const item = await ctx.store.items.insert({
      type: "text",
      content: "hello",
    });
    const all = await ctx.store.items.findAll();
    expect(all).toHaveLength(1);
    expect(all[0]!.id).toBe(item.id);
    expect(all[0]!.content).toBe("hello");
    expect(all[0]!.user_id).toBe("usr_1");
    expect(all[0]!.sync_file).toBe(false);
  });

  it("metadata와 ai JSON을 라운드트립한다", async () => {
    await ctx.store.items.insert({
      type: "link",
      content: "https://example.com",
      metadata: { url: "https://example.com", title: "Example" },
      ai: { summary: "example", keywords: ["a", "b"] },
    });
    const all = await ctx.store.items.findAll();
    expect(all[0]!.metadata?.title).toBe("Example");
    expect(all[0]!.ai?.keywords).toEqual(["a", "b"]);
  });

  it("findById는 존재하지 않는 ID에 null을 돌려준다", async () => {
    const res = await ctx.store.items.findById("missing");
    expect(res).toBeNull();
  });

  it("update로 content·folder_id 변경", async () => {
    const item = await ctx.store.items.insert({
      type: "text",
      content: "first",
    });
    const updated = await ctx.store.items.update(item.id, {
      content: "second",
      folder_id: "fld_1",
    });
    expect(updated?.content).toBe("second");
    expect(updated?.folder_id).toBe("fld_1");
    const reread = await ctx.store.items.findById(item.id);
    expect(reread?.content).toBe("second");
  });

  it("update는 존재하지 않는 ID에 null", async () => {
    expect(await ctx.store.items.update("no", { content: "x" })).toBeNull();
  });

  it("delete는 soft delete로 findAll에서 제외된다", async () => {
    const a = await ctx.store.items.insert({ type: "text", content: "a" });
    await ctx.store.items.insert({ type: "text", content: "b" });
    expect(await ctx.store.items.delete(a.id)).toBe(true);
    const all = await ctx.store.items.findAll();
    expect(all).toHaveLength(1);
    expect(all[0]!.content).toBe("b");
    // includeDeleted로 다시 보인다
    const withDeleted = await ctx.store.items.findAll({ includeDeleted: true });
    expect(withDeleted).toHaveLength(2);
  });

  it("delete는 존재하지 않는 ID에 false", async () => {
    expect(await ctx.store.items.delete("nope")).toBe(false);
  });

  it("folderId=null로 루트 아이템만 조회", async () => {
    await ctx.store.items.insert({ type: "text", content: "root" });
    await ctx.store.items.insert({
      type: "text",
      content: "in folder",
      folder_id: "fld_x",
    });
    const roots = await ctx.store.items.findAll({ folderId: null });
    expect(roots.map((i) => i.content)).toEqual(["root"]);
    const folderItems = await ctx.store.items.findAll({ folderId: "fld_x" });
    expect(folderItems.map((i) => i.content)).toEqual(["in folder"]);
  });

  it("FTS5 검색이 content에 대해 동작한다", async () => {
    await ctx.store.items.insert({
      type: "text",
      content: "The quick brown fox",
    });
    await ctx.store.items.insert({ type: "text", content: "Lazy dog" });
    const hits = await ctx.store.items.search("quick");
    expect(hits).toHaveLength(1);
    expect(hits[0]!.content).toContain("quick");
  });

  it("파라미터 바인딩 사용 검증: 악성 값이 SQL로 해석되지 않는다", async () => {
    // 만약 문자열 보간을 쓰면 따옴표 이스케이프가 깨져 parse 에러가 난다.
    const malicious = "'; DROP TABLE items;--";
    const inserted = await ctx.store.items.insert({
      type: "text",
      content: malicious,
    });
    const again = await ctx.store.items.findById(inserted.id);
    expect(again?.content).toBe(malicious);
    // items 테이블이 여전히 존재해야 함
    const rows = await ctx.adapter.query("SELECT COUNT(*) AS n FROM items");
    expect((rows[0] as { n: number }).n).toBe(1);
  });
});
