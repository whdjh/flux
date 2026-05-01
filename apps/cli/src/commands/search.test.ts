import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Store } from "@flux/store";
import { NodeSqliteAdapter } from "../adapter";
import Database from "better-sqlite3";
import {
  searchAll,
  formatSearchHit,
  formatSearchHits,
  type SearchHit,
} from "./search";
import { capture } from "./capture";

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

describe("search commands", () => {
  let ctx: { store: Store; close: () => void };

  beforeEach(async () => {
    ctx = makeStore();
    await ctx.store.migrate();
  });

  afterEach(() => {
    ctx.close();
  });

  describe("searchAll", () => {
    it("matches items by content (happy path)", async () => {
      await capture(ctx.store, { type: "text", content: "hello world" });
      await capture(ctx.store, { type: "text", content: "goodbye moon" });

      const hits = await searchAll(ctx.store, {
        query: "hello",
        mode: "keyword",
      });

      expect(hits).toHaveLength(1);
      expect(hits[0]?.kind).toBe("item");
      if (hits[0]?.kind === "item") {
        expect(hits[0].snippet).toContain("hello");
      }
    });

    it("matches documents by title", async () => {
      await ctx.store.documents.insert({ title: "research paper" });
      await ctx.store.documents.insert({ title: "shopping list" });

      const hits = await searchAll(ctx.store, {
        query: "research",
        mode: "keyword",
      });

      expect(hits).toHaveLength(1);
      expect(hits[0]?.kind).toBe("doc");
      if (hits[0]?.kind === "doc") {
        expect(hits[0].title).toBe("research paper");
      }
    });

    it("returns items before docs when both match", async () => {
      await capture(ctx.store, { type: "text", content: "딥러닝 논문 정리" });
      await ctx.store.documents.insert({ title: "딥러닝 노트" });

      const hits = await searchAll(ctx.store, {
        query: "딥러닝",
        mode: "keyword",
      });

      expect(hits.length).toBeGreaterThanOrEqual(2);
      expect(hits[0]?.kind).toBe("item");
      expect(hits[hits.length - 1]?.kind).toBe("doc");
    });

    it("matches Korean tokens via unicode61 tokenizer", async () => {
      await capture(ctx.store, { type: "text", content: "한국어 검색 테스트" });

      const hits = await searchAll(ctx.store, {
        query: "한국어",
        mode: "keyword",
      });

      expect(hits).toHaveLength(1);
      expect(hits[0]?.kind).toBe("item");
    });

    it("returns empty array when nothing matches", async () => {
      await capture(ctx.store, { type: "text", content: "hello" });

      const hits = await searchAll(ctx.store, {
        query: "nonexistent",
        mode: "keyword",
      });

      expect(hits).toEqual([]);
    });

    it("applies limit (3 seeded, limit 1)", async () => {
      await capture(ctx.store, { type: "text", content: "rust is fast" });
      await capture(ctx.store, { type: "text", content: "rust is safe" });
      await capture(ctx.store, { type: "text", content: "rust async pattern" });

      const hits = await searchAll(ctx.store, {
        query: "rust",
        mode: "keyword",
        limit: 1,
      });

      expect(hits).toHaveLength(1);
      expect(hits[0]?.kind).toBe("item");
    });

    it("throws on semantic mode (function level)", async () => {
      await expect(
        searchAll(ctx.store, { query: "anything", mode: "semantic" })
      ).rejects.toThrow(/semantic/i);
    });

    it("returns empty array for empty query", async () => {
      await capture(ctx.store, { type: "text", content: "hello" });
      const hits = await searchAll(ctx.store, { query: "", mode: "keyword" });
      expect(hits).toEqual([]);
    });
  });

  describe("formatSearchHit", () => {
    it("renders item with snippet", () => {
      const hit: SearchHit = {
        kind: "item",
        id: "id-1",
        type: "text",
        snippet: "hello",
      };
      expect(formatSearchHit(hit)).toBe("[item] id-1  hello");
    });

    it("renders doc with title", () => {
      const hit: SearchHit = { kind: "doc", id: "id-2", title: "메모" };
      expect(formatSearchHit(hit)).toBe("[doc] id-2  메모");
    });
  });

  describe("formatSearchHits", () => {
    it("renders empty placeholder with query", () => {
      expect(formatSearchHits([], "딥러닝")).toBe('(no results for "딥러닝")');
    });

    it("joins multiple hits with newlines", () => {
      const hits: SearchHit[] = [
        { kind: "item", id: "id-1", type: "text", snippet: "a" },
        { kind: "doc", id: "id-2", title: "b" },
      ];
      const out = formatSearchHits(hits, "x");
      expect(out.split("\n")).toHaveLength(2);
      expect(out).toContain("[item]");
      expect(out).toContain("[doc]");
    });
  });

});
