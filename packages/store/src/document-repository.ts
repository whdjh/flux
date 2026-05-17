import {
  type Document,
  type CreateDocument,
  type UpdateDocument,
  DocumentSchema,
} from "@flux/shared";
import type { RepositoryDeps } from "./repository";

interface DocumentRow {
  id: string;
  user_id: string;
  title: string;
  crdt_doc: Uint8Array;
  created_at: string;
  updated_at: string;
  folder_id: string | null;
}

export class DocumentRepository {
  constructor(private readonly deps: RepositoryDeps) {}

  async findAll(options?: { folderId?: string | null }): Promise<Document[]> {
    const parts = ["SELECT * FROM documents WHERE user_id = ?"];
    const params: (string | null)[] = [this.deps.userId];
    if (options?.folderId !== undefined) {
      if (options.folderId === null) {
        parts.push("AND folder_id IS NULL");
      } else {
        parts.push("AND folder_id = ?");
        params.push(options.folderId);
      }
    }
    parts.push("ORDER BY updated_at DESC");
    const rows = await this.deps.adapter.query<DocumentRow>(
      parts.join(" "),
      params
    );
    return rows.map(rowToDocument);
  }

  async findById(id: string): Promise<Document | null> {
    const rows = await this.deps.adapter.query<DocumentRow>(
      "SELECT * FROM documents WHERE id = ? AND user_id = ?",
      [id, this.deps.userId]
    );
    const first = rows[0];
    return first ? rowToDocument(first) : null;
  }

  async insert(input: CreateDocument): Promise<Document> {
    const id = this.deps.idFactory();
    const now = this.deps.now();
    const doc: Document = {
      id,
      user_id: this.deps.userId,
      title: input.title ?? "",
      crdt_doc: input.crdt_doc ?? new Uint8Array(),
      created_at: now,
      updated_at: now,
      folder_id: input.folder_id ?? null,
    };
    DocumentSchema.parse(doc);
    await this.deps.adapter.exec(
      `INSERT INTO documents
        (id, user_id, title, crdt_doc, created_at, updated_at, folder_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        doc.id,
        doc.user_id,
        doc.title,
        doc.crdt_doc,
        doc.created_at,
        doc.updated_at,
        doc.folder_id,
      ]
    );
    await this.deps.adapter.exec(
      "INSERT INTO documents_fts (id, title) VALUES (?, ?)",
      [doc.id, doc.title]
    );
    await this.deps.syncQueue?.enqueue({
      entity: "documents",
      entity_id: doc.id,
      op: "create",
      // crdt_doc(바이너리)은 backend 도착 시점에 별도 채널로 — 메타만 enqueue
      payload: {
        id: doc.id,
        user_id: doc.user_id,
        title: doc.title,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        folder_id: doc.folder_id,
      },
    });
    return doc;
  }

  async update(id: string, patch: UpdateDocument): Promise<Document | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const next: Document = {
      ...existing,
      title: patch.title ?? existing.title,
      crdt_doc: patch.crdt_doc ?? existing.crdt_doc,
      folder_id:
        patch.folder_id !== undefined ? patch.folder_id : existing.folder_id,
      updated_at: this.deps.now(),
    };
    DocumentSchema.parse(next);
    await this.deps.adapter.exec(
      `UPDATE documents
         SET title = ?, crdt_doc = ?, folder_id = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
      [
        next.title,
        next.crdt_doc,
        next.folder_id,
        next.updated_at,
        id,
        this.deps.userId,
      ]
    );
    if (patch.title !== undefined) {
      await this.deps.adapter.exec(
        "UPDATE documents_fts SET title = ? WHERE id = ?",
        [next.title, id]
      );
    }
    await this.deps.syncQueue?.enqueue({
      entity: "documents",
      entity_id: id,
      op: "update",
      payload: {
        id: next.id,
        user_id: next.user_id,
        title: next.title,
        updated_at: next.updated_at,
        folder_id: next.folder_id,
      },
    });
    return next;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.deps.adapter.exec(
      "DELETE FROM documents WHERE id = ? AND user_id = ?",
      [id, this.deps.userId]
    );
    await this.deps.adapter.exec("DELETE FROM documents_fts WHERE id = ?", [
      id,
    ]);
    await this.deps.syncQueue?.enqueue({
      entity: "documents",
      entity_id: id,
      op: "delete",
      payload: { id },
    });
    return true;
  }

  async searchByTitle(query: string): Promise<Document[]> {
    const rows = await this.deps.adapter.query<DocumentRow>(
      `SELECT documents.* FROM documents
        JOIN documents_fts ON documents_fts.id = documents.id
       WHERE documents_fts MATCH ? AND documents.user_id = ?
       ORDER BY rank`,
      [query, this.deps.userId]
    );
    return rows.map(rowToDocument);
  }
}

function toTypedBytes(value: unknown): Uint8Array<ArrayBuffer> {
  // ArrayBufferLike → 확정적으로 ArrayBuffer 기반 Uint8Array로 정규화
  const buf = new ArrayBuffer(0);
  const src =
    value instanceof Uint8Array
      ? value
      : new Uint8Array(value as ArrayBufferLike);
  const out = new Uint8Array(new ArrayBuffer(src.byteLength));
  out.set(src);
  return out as Uint8Array<ArrayBuffer>;
  void buf;
}

function rowToDocument(row: DocumentRow): Document {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    crdt_doc: toTypedBytes(row.crdt_doc),
    created_at: row.created_at,
    updated_at: row.updated_at,
    folder_id: row.folder_id,
  };
}
