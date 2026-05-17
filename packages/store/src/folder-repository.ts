import {
  type Folder,
  type CreateFolder,
  type UpdateFolder,
  FolderSchema,
} from "@flux/shared";
import type { RepositoryDeps } from "./repository";

interface FolderRow {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
}

export interface FolderNode extends Folder {
  depth: number;
  children: FolderNode[];
}

export class FolderRepository {
  constructor(private readonly deps: RepositoryDeps) {}

  async findAll(): Promise<Folder[]> {
    const rows = await this.deps.adapter.query<FolderRow>(
      "SELECT * FROM folders WHERE user_id = ? ORDER BY name",
      [this.deps.userId]
    );
    return rows.map(rowToFolder);
  }

  async findById(id: string): Promise<Folder | null> {
    const rows = await this.deps.adapter.query<FolderRow>(
      "SELECT * FROM folders WHERE id = ? AND user_id = ?",
      [id, this.deps.userId]
    );
    const first = rows[0];
    return first ? rowToFolder(first) : null;
  }

  async insert(input: CreateFolder): Promise<Folder> {
    const folder: Folder = {
      id: this.deps.idFactory(),
      user_id: this.deps.userId,
      name: input.name,
      parent_id: input.parent_id ?? null,
    };
    FolderSchema.parse(folder);
    await this.deps.adapter.exec(
      "INSERT INTO folders (id, user_id, name, parent_id) VALUES (?, ?, ?, ?)",
      [folder.id, folder.user_id, folder.name, folder.parent_id]
    );
    await this.deps.syncQueue?.enqueue({
      entity: "folders",
      entity_id: folder.id,
      op: "create",
      payload: folder,
    });
    return folder;
  }

  async update(id: string, patch: UpdateFolder): Promise<Folder | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const next: Folder = {
      ...existing,
      name: patch.name ?? existing.name,
      parent_id:
        patch.parent_id !== undefined ? patch.parent_id : existing.parent_id,
    };
    FolderSchema.parse(next);
    await this.deps.adapter.exec(
      "UPDATE folders SET name = ?, parent_id = ? WHERE id = ? AND user_id = ?",
      [next.name, next.parent_id, id, this.deps.userId]
    );
    await this.deps.syncQueue?.enqueue({
      entity: "folders",
      entity_id: id,
      op: "update",
      payload: next,
    });
    return next;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    // CASCADE로 자식 folder들도 함께 제거된다.
    await this.deps.adapter.exec(
      "DELETE FROM folders WHERE id = ? AND user_id = ?",
      [id, this.deps.userId]
    );
    await this.deps.syncQueue?.enqueue({
      entity: "folders",
      entity_id: id,
      op: "delete",
      payload: { id },
    });
    return true;
  }

  /**
   * 재귀 CTE로 전체 폴더 트리를 읽고 중첩 구조로 변환한다.
   * rootId가 주어지면 해당 노드부터, 없으면 parent_id IS NULL인 루트들부터.
   */
  async findTree(rootId?: string): Promise<FolderNode[]> {
    interface TreeRow extends FolderRow {
      depth: number;
    }
    let rows: TreeRow[];
    if (rootId !== undefined) {
      rows = await this.deps.adapter.query<TreeRow>(
        `WITH RECURSIVE tree(id, user_id, name, parent_id, depth) AS (
           SELECT id, user_id, name, parent_id, 0 AS depth
             FROM folders
            WHERE id = ? AND user_id = ?
           UNION ALL
           SELECT f.id, f.user_id, f.name, f.parent_id, t.depth + 1
             FROM folders f
             JOIN tree t ON f.parent_id = t.id
            WHERE f.user_id = ?
         )
         SELECT id, user_id, name, parent_id, depth FROM tree ORDER BY depth, name`,
        [rootId, this.deps.userId, this.deps.userId]
      );
    } else {
      rows = await this.deps.adapter.query<TreeRow>(
        `WITH RECURSIVE tree(id, user_id, name, parent_id, depth) AS (
           SELECT id, user_id, name, parent_id, 0 AS depth
             FROM folders
            WHERE parent_id IS NULL AND user_id = ?
           UNION ALL
           SELECT f.id, f.user_id, f.name, f.parent_id, t.depth + 1
             FROM folders f
             JOIN tree t ON f.parent_id = t.id
            WHERE f.user_id = ?
         )
         SELECT id, user_id, name, parent_id, depth FROM tree ORDER BY depth, name`,
        [this.deps.userId, this.deps.userId]
      );
    }

    // 평면 결과를 트리로 조립
    const nodesById = new Map<string, FolderNode>();
    for (const r of rows) {
      nodesById.set(r.id, {
        id: r.id,
        user_id: r.user_id,
        name: r.name,
        parent_id: r.parent_id,
        depth: Number(r.depth),
        children: [],
      });
    }
    const roots: FolderNode[] = [];
    for (const node of nodesById.values()) {
      if (node.depth === 0) {
        roots.push(node);
        continue;
      }
      const parent = node.parent_id ? nodesById.get(node.parent_id) : null;
      if (parent) {
        parent.children.push(node);
      } else {
        // 부모가 결과에 없으면(이 서브트리 바깥이면) 루트로 간주.
        roots.push(node);
      }
    }
    return roots;
  }
}

function rowToFolder(row: FolderRow): Folder {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    parent_id: row.parent_id,
  };
}
