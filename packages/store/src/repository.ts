import type { SqliteAdapter } from "./adapter";
import type { SyncQueue } from "./sync-queue";

export interface RepositoryDeps {
  adapter: SqliteAdapter;
  userId: string;
  idFactory: () => string;
  now: () => string;
  /**
   * 변경(insert/update/delete) 발생 시 자동으로 enqueue한다.
   * 미주입 시 큐를 건드리지 않는다 — 테스트·읽기 전용 Repository에 유용.
   */
  syncQueue?: SyncQueue;
}
