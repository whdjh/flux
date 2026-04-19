import {
  type Item,
  type ItemMetadata,
  type ItemAi,
  type CreateItem,
  ItemSchema,
} from "@flux/shared";
import type { RepositoryDeps } from "./repository";

interface ItemRow {
  id: string;
  user_id: string;
  type: string;
  content: string;
  metadata: string | null;
  ai: string | null;
  created_at: string;
  sync_file: number;
  folder_id: string | null;
  deleted_at: string | null;
}

export interface UpdateItem {
  content?: string;
  metadata?: ItemMetadata;
  ai?: ItemAi;
  folder_id?: string | null;
}

export class ItemRepository {
  constructor(private readonly deps: RepositoryDeps) {}

  async findAll(options?: {
    includeDeleted?: boolean;
    folderId?: string | null;
  }): Promise<Item[]> {
    const parts = ["SELECT * FROM items WHERE user_id = ?"];
    const params: (string | null)[] = [this.deps.userId];
    if (!options?.includeDeleted) {
      parts.push("AND deleted_at IS NULL");
    }
    if (options?.folderId !== undefined) {
      if (options.folderId === null) {
        parts.push("AND folder_id IS NULL");
      } else {
        parts.push("AND folder_id = ?");
        params.push(options.folderId);
      }
    }
    parts.push("ORDER BY created_at DESC");
    const rows = await this.deps.adapter.query<ItemRow>(
      parts.join(" "),
      params
    );
    return rows.map(rowToItem);
  }

  async findById(id: string): Promise<Item | null> {
    const rows = await this.deps.adapter.query<ItemRow>(
      "SELECT * FROM items WHERE id = ? AND user_id = ? AND deleted_at IS NULL",
      [id, this.deps.userId]
    );
    const first = rows[0];
    return first ? rowToItem(first) : null;
  }

  async insert(input: CreateItem): Promise<Item> {
    const id = this.deps.idFactory();
    const now = this.deps.now();
    const syncFile = input.sync_file ?? false;
    const item: Item = {
      id,
      user_id: this.deps.userId,
      type: input.type,
      content: input.content,
      metadata: input.metadata,
      ai: input.ai,
      created_at: now,
      sync_file: syncFile,
      folder_id: input.folder_id ?? null,
    };
    // Zod 검증: 스키마 밖의 값이 들어오면 거부
    ItemSchema.parse(item);
    await this.deps.adapter.exec(
      `INSERT INTO items
        (id, user_id, type, content, metadata, ai, created_at, sync_file, folder_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.user_id,
        item.type,
        item.content,
        item.metadata ? JSON.stringify(item.metadata) : null,
        item.ai ? JSON.stringify(item.ai) : null,
        item.created_at,
        syncFile ? 1 : 0,
        item.folder_id ?? null,
      ]
    );
    // FTS 인덱스 갱신
    await this.deps.adapter.exec(
      "INSERT INTO items_fts (id, content) VALUES (?, ?)",
      [item.id, item.content]
    );
    return item;
  }

  async update(id: string, patch: UpdateItem): Promise<Item | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const next: Item = {
      ...existing,
      content: patch.content ?? existing.content,
      metadata: patch.metadata ?? existing.metadata,
      ai: patch.ai ?? existing.ai,
      folder_id:
        patch.folder_id !== undefined ? patch.folder_id : existing.folder_id ?? null,
    };
    ItemSchema.parse(next);

    await this.deps.adapter.exec(
      `UPDATE items
         SET content = ?, metadata = ?, ai = ?, folder_id = ?
       WHERE id = ? AND user_id = ?`,
      [
        next.content,
        next.metadata ? JSON.stringify(next.metadata) : null,
        next.ai ? JSON.stringify(next.ai) : null,
        next.folder_id ?? null,
        id,
        this.deps.userId,
      ]
    );
    if (patch.content !== undefined) {
      await this.deps.adapter.exec(
        "UPDATE items_fts SET content = ? WHERE id = ?",
        [next.content, id]
      );
    }
    return next;
  }

  /** Soft delete: deleted_at을 찍고 FTS에서 제거. */
  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.deps.adapter.exec(
      "UPDATE items SET deleted_at = ? WHERE id = ? AND user_id = ?",
      [this.deps.now(), id, this.deps.userId]
    );
    await this.deps.adapter.exec("DELETE FROM items_fts WHERE id = ?", [id]);
    return true;
  }

  /** FTS5로 content 전문 검색 */
  async search(query: string): Promise<Item[]> {
    const rows = await this.deps.adapter.query<ItemRow>(
      `SELECT items.* FROM items
        JOIN items_fts ON items_fts.id = items.id
       WHERE items_fts MATCH ?
         AND items.user_id = ?
         AND items.deleted_at IS NULL
       ORDER BY rank`,
      [query, this.deps.userId]
    );
    return rows.map(rowToItem);
  }
}

function rowToItem(row: ItemRow): Item {
  return {
    id: row.id,
    user_id: row.user_id,
    type: row.type as Item["type"],
    content: row.content,
    metadata: row.metadata
      ? (JSON.parse(row.metadata) as ItemMetadata)
      : undefined,
    ai: row.ai ? (JSON.parse(row.ai) as ItemAi) : undefined,
    created_at: row.created_at,
    sync_file: row.sync_file === 1,
    folder_id: row.folder_id,
  };
}
