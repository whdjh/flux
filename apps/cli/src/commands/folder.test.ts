import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Store } from "@flux/store";
import { NodeSqliteAdapter } from "../adapter";
import Database from "better-sqlite3";
import {
  createFolder,
  listFolders,
  moveItem,
  formatFolderTree,
} from "./folder";
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

describe("folder commands", () => {
  let ctx: { store: Store; close: () => void };

  beforeEach(async () => {
    ctx = makeStore();
    await ctx.store.migrate();
  });

  afterEach(() => {
    ctx.close();
  });

  describe("createFolder", () => {
    it("creates a top-level folder", async () => {
      const folder = await createFolder(ctx.store, { name: "Research" });
      expect(folder.name).toBe("Research");
      expect(folder.parent_id).toBeNull();
    });

    it("creates a nested folder", async () => {
      const parent = await createFolder(ctx.store, { name: "Research" });
      const child = await createFolder(ctx.store, {
        name: "AI",
        parentId: parent.id,
      });
      expect(child.parent_id).toBe(parent.id);
    });
  });

  describe("listFolders", () => {
    it("returns empty array for empty store", async () => {
      const tree = await listFolders(ctx.store);
      expect(tree).toEqual([]);
    });

    it("returns nested tree", async () => {
      const research = await createFolder(ctx.store, { name: "Research" });
      await createFolder(ctx.store, { name: "AI", parentId: research.id });
      await createFolder(ctx.store, { name: "Hobby" });

      const tree = await listFolders(ctx.store);
      expect(tree).toHaveLength(2); // Hobby + Research at root
      const researchNode = tree.find((n) => n.name === "Research");
      expect(researchNode?.children).toHaveLength(1);
      expect(researchNode?.children[0]?.name).toBe("AI");
    });
  });

  describe("moveItem", () => {
    it("moves an item into a folder", async () => {
      const folder = await createFolder(ctx.store, { name: "Inbox" });
      const item = await capture(ctx.store, { type: "text", content: "hi" });

      const moved = await moveItem(ctx.store, item.id, folder.id);
      expect(moved?.folder_id).toBe(folder.id);
    });

    it("moves an item out to inbox (null folder)", async () => {
      const folder = await createFolder(ctx.store, { name: "X" });
      const item = await capture(ctx.store, {
        type: "text",
        content: "hi",
        folderId: folder.id,
      });
      expect(item.folder_id).toBe(folder.id);

      const moved = await moveItem(ctx.store, item.id, null);
      expect(moved?.folder_id).toBeNull();
    });

    it("returns null when item does not exist", async () => {
      const folder = await createFolder(ctx.store, { name: "X" });
      const result = await moveItem(ctx.store, "missing-id", folder.id);
      expect(result).toBeNull();
    });
  });

  describe("formatFolderTree", () => {
    it("renders empty placeholder", () => {
      expect(formatFolderTree([])).toBe("(no folders)");
    });

    it("renders nested tree with indent", async () => {
      const research = await createFolder(ctx.store, { name: "Research" });
      await createFolder(ctx.store, { name: "AI", parentId: research.id });

      const tree = await listFolders(ctx.store);
      const out = formatFolderTree(tree);
      expect(out).toContain("Research");
      expect(out).toContain("  AI"); // indent 2 spaces per depth
    });
  });
});
