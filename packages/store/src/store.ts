import type { SqliteAdapter } from "./adapter";
import { ItemRepository } from "./item-repository";
import { DocumentRepository } from "./document-repository";
import { FolderRepository } from "./folder-repository";
import { SessionRepository } from "./session-repository";
import { ItemEmbedRepository } from "./item-embed-repository";
import { SyncQueue } from "./sync-queue";
import { INIT_MIGRATION_SQL } from "./migrations";

/**
 * Store는 SqliteAdapter를 주입받아 엔티티별 repository를 제공한다.
 * 마이그레이션 실행은 `migrate()`를 호출해야 한다.
 */
export interface StoreOptions {
  /** 현재 사용자 ID. 모든 insert 시 자동으로 주입된다. */
  userId: string;
  /** ID 생성기. 미지정 시 기본 nanoid-like 생성기. */
  idFactory?: () => string;
  /** 시간 생성기. 테스트에서 주입 가능. */
  now?: () => string;
}

export class Store {
  readonly items: ItemRepository;
  readonly documents: DocumentRepository;
  readonly folders: FolderRepository;
  readonly sessions: SessionRepository;
  readonly embeds: ItemEmbedRepository;
  readonly syncQueue: SyncQueue;

  constructor(
    readonly adapter: SqliteAdapter,
    readonly options: StoreOptions
  ) {
    const now = options.now ?? defaultNow;
    // syncQueue를 먼저 만들고 Repository deps에 주입 — mutation 시 자동 enqueue.
    this.syncQueue = new SyncQueue(adapter, now);
    const deps = {
      adapter,
      userId: options.userId,
      idFactory: options.idFactory ?? defaultIdFactory,
      now,
      syncQueue: this.syncQueue,
    };
    this.items = new ItemRepository(deps);
    this.documents = new DocumentRepository(deps);
    this.folders = new FolderRepository(deps);
    this.sessions = new SessionRepository(deps);
    this.embeds = new ItemEmbedRepository(deps);
  }

  /**
   * 초기 스키마 및 이후 마이그레이션을 적용한다.
   * 이미 적용된 버전은 스킵.
   */
  async migrate(): Promise<void> {
    await this.adapter.exec(INIT_MIGRATION_SQL);
    const rows = await this.adapter.query<{ version: number }>(
      "SELECT version FROM _migration WHERE version = ?",
      [1]
    );
    if (rows.length === 0) {
      await this.adapter.exec(
        "INSERT INTO _migration (version, applied_at) VALUES (?, ?)",
        [1, (this.options.now ?? defaultNow)()]
      );
    }
  }
}

function defaultNow(): string {
  return new Date().toISOString();
}

let counter = 0;
function defaultIdFactory(): string {
  // 충돌 가능성이 낮은 문자열 (테스트·기본 시나리오 용도).
  // 프로덕션 apps에서는 nanoid / ulid 를 넣어줄 수 있다.
  counter = (counter + 1) % Number.MAX_SAFE_INTEGER;
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${time}${rand}${counter.toString(36)}`;
}
