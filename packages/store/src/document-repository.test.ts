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

describe("DocumentRepository", () => {
  let ctx: ReturnType<typeof makeStore>;
  beforeEach(async () => {
    ctx = makeStore();
    await ctx.store.migrate();
  });

  it("insert/findById 라운드트립. crdt_doc이 Uint8Array로 복원된다", async () => {
    const bytes = new Uint8Array([5, 6, 7]);
    const doc = await ctx.store.documents.insert({
      title: "회의 메모",
      crdt_doc: bytes,
    });
    const read = await ctx.store.documents.findById(doc.id);
    expect(read).not.toBeNull();
    expect(read!.title).toBe("회의 메모");
    expect(Array.from(read!.crdt_doc)).toEqual([5, 6, 7]);
    expect(read!.crdt_doc).toBeInstanceOf(Uint8Array);
  });

  it("insert 시 crdt_doc이 없으면 빈 Uint8Array 사용", async () => {
    const doc = await ctx.store.documents.insert({ title: "empty" });
    expect(doc.crdt_doc.length).toBe(0);
  });

  it("update는 updated_at을 갱신한다", async () => {
    const doc = await ctx.store.documents.insert({ title: "v1" });
    const v2 = await ctx.store.documents.update(doc.id, { title: "v2" });
    expect(v2?.title).toBe("v2");
    expect(v2?.updated_at).not.toBe(doc.updated_at);
  });

  it("update는 존재하지 않는 ID에 null", async () => {
    expect(
      await ctx.store.documents.update("nope", { title: "x" })
    ).toBeNull();
  });

  it("crdt_doc만 업데이트 가능", async () => {
    const doc = await ctx.store.documents.insert({
      title: "t",
      crdt_doc: new Uint8Array([1]),
    });
    const next = await ctx.store.documents.update(doc.id, {
      crdt_doc: new Uint8Array([2, 3]),
    });
    expect(Array.from(next!.crdt_doc)).toEqual([2, 3]);
    expect(next!.title).toBe("t");
  });

  it("delete는 완전히 제거한다", async () => {
    const doc = await ctx.store.documents.insert({ title: "gone" });
    expect(await ctx.store.documents.delete(doc.id)).toBe(true);
    expect(await ctx.store.documents.findById(doc.id)).toBeNull();
    expect(await ctx.store.documents.delete(doc.id)).toBe(false);
  });

  it("findAll은 updated_at 내림차순", async () => {
    const d1 = await ctx.store.documents.insert({ title: "first" });
    const d2 = await ctx.store.documents.insert({ title: "second" });
    const all = await ctx.store.documents.findAll();
    expect(all.map((d) => d.id)).toEqual([d2.id, d1.id]);
  });

  it("folderId=null로 루트만 조회", async () => {
    await ctx.store.documents.insert({ title: "root" });
    await ctx.store.documents.insert({ title: "in", folder_id: "f1" });
    const roots = await ctx.store.documents.findAll({ folderId: null });
    expect(roots).toHaveLength(1);
    const f = await ctx.store.documents.findAll({ folderId: "f1" });
    expect(f).toHaveLength(1);
  });

  it("searchByTitle로 FTS 검색", async () => {
    await ctx.store.documents.insert({ title: "프로젝트 기획서" });
    await ctx.store.documents.insert({ title: "월간 회고" });
    const hits = await ctx.store.documents.searchByTitle("프로젝트");
    expect(hits).toHaveLength(1);
  });
});
