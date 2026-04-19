/**
 * 테스트 전용 in-memory SqliteAdapter. 프로덕션 코드는 이 모듈을 import하지 않는다.
 * better-sqlite3는 devDependency로만 쓴다.
 */
import Database, { type Database as BetterSqliteDb } from "better-sqlite3";
import type { SqliteAdapter, SqlParam } from "./adapter";

type BindableParam = string | number | null | Buffer | bigint;

function toBindable(params?: readonly SqlParam[]): BindableParam[] {
  if (!params || params.length === 0) return [];
  return params.map((p) => {
    if (p instanceof Uint8Array) {
      return Buffer.from(p.buffer, p.byteOffset, p.byteLength);
    }
    return p as BindableParam;
  });
}

function normalizeRow<T>(row: unknown): T {
  if (row === null || typeof row !== "object") return row as T;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row as Record<string, unknown>)) {
    if (Buffer.isBuffer(v)) {
      out[k] = new Uint8Array(v);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

class BetterSqliteAdapter implements SqliteAdapter {
  constructor(private readonly db: BetterSqliteDb) {}

  async exec(sql: string, params?: readonly SqlParam[]): Promise<void> {
    if (!params || params.length === 0) {
      // 여러 문장 지원 (마이그레이션 SQL에 필요)
      this.db.exec(sql);
      return;
    }
    const stmt = this.db.prepare(sql);
    stmt.run(...toBindable(params));
  }

  async query<T = Record<string, unknown>>(
    sql: string,
    params?: readonly SqlParam[]
  ): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...toBindable(params));
    return rows.map((r) => normalizeRow<T>(r));
  }

  async transaction<T>(fn: (tx: SqliteAdapter) => Promise<T>): Promise<T> {
    // better-sqlite3는 동기 transaction이지만, 우리 인터페이스는 async 콜백이므로
    // 명시적으로 BEGIN/COMMIT/ROLLBACK을 구사한다.
    this.db.exec("BEGIN");
    try {
      const result = await fn(this);
      this.db.exec("COMMIT");
      return result;
    } catch (err) {
      this.db.exec("ROLLBACK");
      throw err;
    }
  }

  /** 테스트 편의: 내부 DB 연결 종료 */
  close(): void {
    this.db.close();
  }
}

/** 테스트 전용: in-memory better-sqlite3로 SqliteAdapter 생성 */
export function createTestAdapter(): BetterSqliteAdapter {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  return new BetterSqliteAdapter(db);
}
