import Database, { type Database as BetterSqliteDb } from "better-sqlite3";
import type { SqliteAdapter, SqlParam } from "@flux/store";

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

export class NodeSqliteAdapter implements SqliteAdapter {
  constructor(private readonly db: BetterSqliteDb) {}

  async exec(sql: string, params?: readonly SqlParam[]): Promise<void> {
    if (!params || params.length === 0) {
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

  close(): void {
    this.db.close();
  }
}

export function openDatabase(path: string): NodeSqliteAdapter {
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return new NodeSqliteAdapter(db);
}
