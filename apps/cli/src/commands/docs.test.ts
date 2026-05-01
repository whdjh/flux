import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Store } from "@flux/store";
import { NodeSqliteAdapter } from "../adapter";
import Database from "better-sqlite3";
import {
  createDoc,
  listDocs,
  embedToDoc,
  appendToDoc,
  showDoc,
  formatDoc,
  formatDocList,
  formatDocShow,
} from "./docs";
import { capture } from "./capture";
import { createFolder } from "./folder";

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

describe("docs commands", () => {
  let ctx: { store: Store; close: () => void };

  beforeEach(async () => {
    ctx = makeStore();
    await ctx.store.migrate();
  });

  afterEach(() => {
    ctx.close();
  });

  describe("createDoc", () => {
    it("creates an empty doc with no title", async () => {
      const doc = await createDoc(ctx.store, {});
      expect(doc.title).toBe("");
      expect(doc.folder_id).toBeNull();
      expect(doc.crdt_doc).toBeInstanceOf(Uint8Array);
      expect(doc.crdt_doc.byteLength).toBeGreaterThan(0);
    });

    it("creates a doc with title", async () => {
      const doc = await createDoc(ctx.store, { title: "AI 논문" });
      expect(doc.title).toBe("AI 논문");
    });

    it("creates a doc inside a folder", async () => {
      const folder = await createFolder(ctx.store, { name: "Research" });
      const doc = await createDoc(ctx.store, {
        title: "X",
        folderId: folder.id,
      });
      expect(doc.folder_id).toBe(folder.id);
    });
  });

  describe("listDocs", () => {
    it("returns empty array when no docs", async () => {
      const docs = await listDocs(ctx.store);
      expect(docs).toEqual([]);
    });

    it("returns multiple docs", async () => {
      await createDoc(ctx.store, { title: "A" });
      await createDoc(ctx.store, { title: "B" });
      const docs = await listDocs(ctx.store);
      expect(docs).toHaveLength(2);
    });

    it("filters by folder id", async () => {
      const folder = await createFolder(ctx.store, { name: "F" });
      await createDoc(ctx.store, { title: "in-folder", folderId: folder.id });
      await createDoc(ctx.store, { title: "out" });

      const inFolder = await listDocs(ctx.store, { folderId: folder.id });
      expect(inFolder).toHaveLength(1);
      expect(inFolder[0]?.title).toBe("in-folder");

      const inbox = await listDocs(ctx.store, { folderId: null });
      expect(inbox).toHaveLength(1);
      expect(inbox[0]?.title).toBe("out");
    });
  });

  describe("embedToDoc", () => {
    it("embeds an item into a doc", async () => {
      const doc = await createDoc(ctx.store, { title: "doc" });
      const item = await capture(ctx.store, {
        type: "text",
        content: "딥러닝 정리",
      });
      const result = await embedToDoc(ctx.store, doc.id, item.id);
      expect(result).not.toBeNull();
      expect(result?.embed.item_id).toBe(item.id);
      expect(result?.embed.position).toBe(0);

      const shown = await showDoc(ctx.store, doc.id);
      expect(shown?.embeds).toHaveLength(1);
      expect(shown?.embeds[0]?.item_id).toBe(item.id);
    });

    it("returns null when doc does not exist", async () => {
      const item = await capture(ctx.store, { type: "text", content: "x" });
      const result = await embedToDoc(ctx.store, "missing-doc", item.id);
      expect(result).toBeNull();
    });

    it("returns null when item does not exist", async () => {
      const doc = await createDoc(ctx.store, {});
      const result = await embedToDoc(ctx.store, doc.id, "missing-item");
      expect(result).toBeNull();
    });
  });

  describe("appendToDoc", () => {
    it("appends text to an empty doc", async () => {
      const doc = await createDoc(ctx.store, {});
      const updated = await appendToDoc(ctx.store, doc.id, "hello");
      expect(updated).not.toBeNull();
      const shown = await showDoc(ctx.store, doc.id);
      expect(shown?.text).toBe("hello");
    });

    it("returns null when doc does not exist", async () => {
      const result = await appendToDoc(ctx.store, "missing", "x");
      expect(result).toBeNull();
    });

    it("accumulates appended text", async () => {
      const doc = await createDoc(ctx.store, {});
      await appendToDoc(ctx.store, doc.id, "a");
      await appendToDoc(ctx.store, doc.id, "b");
      await appendToDoc(ctx.store, doc.id, "c");
      const shown = await showDoc(ctx.store, doc.id);
      expect(shown?.text).toBe("abc");
    });
  });

  describe("showDoc", () => {
    it("returns text and embeds together", async () => {
      const doc = await createDoc(ctx.store, { title: "n" });
      const item = await capture(ctx.store, { type: "text", content: "x" });
      await appendToDoc(ctx.store, doc.id, "본문");
      await embedToDoc(ctx.store, doc.id, item.id);

      const shown = await showDoc(ctx.store, doc.id);
      expect(shown?.text).toBe("본문");
      expect(shown?.embeds).toHaveLength(1);
      expect(shown?.embeds[0]?.item_id).toBe(item.id);
    });

    it("returns null when doc does not exist", async () => {
      const shown = await showDoc(ctx.store, "missing");
      expect(shown).toBeNull();
    });
  });

  describe("format helpers", () => {
    it("formatDocList renders empty placeholder", () => {
      expect(formatDocList([])).toBe("(no docs)");
    });

    it("formatDoc renders id, updated_at, title", async () => {
      const doc = await createDoc(ctx.store, { title: "T" });
      const out = formatDoc(doc);
      expect(out).toContain(doc.id);
      expect(out).toContain(doc.updated_at);
      expect(out).toContain("T");
    });

    it("formatDocShow includes title, body, and embed lines", async () => {
      const doc = await createDoc(ctx.store, { title: "title" });
      const item = await capture(ctx.store, { type: "text", content: "x" });
      await appendToDoc(ctx.store, doc.id, "body");
      await embedToDoc(ctx.store, doc.id, item.id);
      const shown = await showDoc(ctx.store, doc.id);
      const out = formatDocShow(shown!);
      expect(out).toContain("title");
      expect(out).toContain("body");
      expect(out).toContain("embeds:");
      expect(out).toContain(`0: ${item.id}`);
    });
  });
});
