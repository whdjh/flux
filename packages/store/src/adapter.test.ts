import { describe, it, expect } from "vitest";
import { createTestAdapter } from "./test-helpers";

describe("SqliteAdapter (in-memory test helper)", () => {
  it("exec으로 테이블을 만들고 query로 빈 결과를 반환한다", async () => {
    const adapter = createTestAdapter();
    await adapter.exec("CREATE TABLE t (id TEXT PRIMARY KEY, name TEXT)");
    const rows = await adapter.query("SELECT * FROM t");
    expect(rows).toEqual([]);
    adapter.close();
  });

  it("파라미터 바인딩으로 INSERT/SELECT 한다", async () => {
    const adapter = createTestAdapter();
    await adapter.exec("CREATE TABLE t (id TEXT PRIMARY KEY, name TEXT)");
    await adapter.exec("INSERT INTO t (id, name) VALUES (?, ?)", ["1", "a"]);
    await adapter.exec("INSERT INTO t (id, name) VALUES (?, ?)", ["2", "b"]);
    const rows = await adapter.query<{ id: string; name: string }>(
      "SELECT * FROM t ORDER BY id"
    );
    expect(rows).toEqual([
      { id: "1", name: "a" },
      { id: "2", name: "b" },
    ]);
    adapter.close();
  });

  it("Uint8Array (BLOB) 을 라운드트립한다", async () => {
    const adapter = createTestAdapter();
    await adapter.exec("CREATE TABLE t (id TEXT PRIMARY KEY, blob BLOB)");
    const original = new Uint8Array([1, 2, 3, 4, 5]);
    await adapter.exec("INSERT INTO t (id, blob) VALUES (?, ?)", [
      "k",
      original,
    ]);
    const rows = await adapter.query<{ id: string; blob: Uint8Array }>(
      "SELECT * FROM t"
    );
    expect(rows[0]?.blob).toBeInstanceOf(Uint8Array);
    expect(Array.from(rows[0]!.blob)).toEqual([1, 2, 3, 4, 5]);
    adapter.close();
  });

  it("transaction 성공 시 변경이 커밋된다", async () => {
    const adapter = createTestAdapter();
    await adapter.exec("CREATE TABLE t (id TEXT PRIMARY KEY)");
    await adapter.transaction(async (tx) => {
      await tx.exec("INSERT INTO t VALUES (?)", ["a"]);
      await tx.exec("INSERT INTO t VALUES (?)", ["b"]);
    });
    const rows = await adapter.query<{ id: string }>("SELECT * FROM t");
    expect(rows.map((r) => r.id).sort()).toEqual(["a", "b"]);
    adapter.close();
  });

  it("transaction 안에서 throw 하면 롤백된다", async () => {
    const adapter = createTestAdapter();
    await adapter.exec("CREATE TABLE t (id TEXT PRIMARY KEY)");
    await adapter.exec("INSERT INTO t VALUES (?)", ["x"]);
    await expect(
      adapter.transaction(async (tx) => {
        await tx.exec("INSERT INTO t VALUES (?)", ["y"]);
        throw new Error("boom");
      })
    ).rejects.toThrow("boom");
    const rows = await adapter.query<{ id: string }>("SELECT * FROM t");
    expect(rows.map((r) => r.id)).toEqual(["x"]);
    adapter.close();
  });

  it("null 파라미터를 허용한다", async () => {
    const adapter = createTestAdapter();
    await adapter.exec("CREATE TABLE t (id TEXT PRIMARY KEY, v TEXT)");
    await adapter.exec("INSERT INTO t VALUES (?, ?)", ["1", null]);
    const rows = await adapter.query<{ id: string; v: string | null }>(
      "SELECT * FROM t"
    );
    expect(rows[0]?.v).toBeNull();
    adapter.close();
  });
});
