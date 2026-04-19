import type { SqliteAdapter } from "./adapter";

export type SyncEntity =
  | "items"
  | "documents"
  | "folders"
  | "sessions"
  | "item_embeds";

export type SyncOp = "create" | "update" | "delete";

export interface SyncQueueEntry {
  id: number;
  entity: SyncEntity;
  entity_id: string;
  op: SyncOp;
  payload: string;
  created_at: string;
  attempts: number;
  last_error: string | null;
}

/**
 * 오프라인 큐. 서버에 아직 반영되지 않은 변경을 대기열로 관리.
 * 각 repository가 변경 시 이 큐에 enqueue하고, 네트워크 복귀 시
 * apps/api-client가 순차로 꺼내 서버에 전송한다.
 */
export class SyncQueue {
  constructor(
    private readonly adapter: SqliteAdapter,
    private readonly now: () => string
  ) {}

  async enqueue(input: {
    entity: SyncEntity;
    entity_id: string;
    op: SyncOp;
    payload: unknown;
  }): Promise<void> {
    await this.adapter.exec(
      "INSERT INTO sync_queue (entity, entity_id, op, payload, created_at) VALUES (?, ?, ?, ?, ?)",
      [
        input.entity,
        input.entity_id,
        input.op,
        JSON.stringify(input.payload),
        this.now(),
      ]
    );
  }

  async peek(limit = 50): Promise<SyncQueueEntry[]> {
    return this.adapter.query<SyncQueueEntry>(
      "SELECT id, entity, entity_id, op, payload, created_at, attempts, last_error FROM sync_queue ORDER BY id LIMIT ?",
      [limit]
    );
  }

  async markFailed(id: number, error: string): Promise<void> {
    await this.adapter.exec(
      "UPDATE sync_queue SET attempts = attempts + 1, last_error = ? WHERE id = ?",
      [error, id]
    );
  }

  async remove(id: number): Promise<void> {
    await this.adapter.exec("DELETE FROM sync_queue WHERE id = ?", [id]);
  }

  async clear(): Promise<void> {
    await this.adapter.exec("DELETE FROM sync_queue", []);
  }

  async size(): Promise<number> {
    const rows = await this.adapter.query<{ count: number }>(
      "SELECT COUNT(*) AS count FROM sync_queue",
      []
    );
    return Number(rows[0]?.count ?? 0);
  }
}
