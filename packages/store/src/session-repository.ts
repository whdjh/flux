import {
  type Session,
  type CreateSession,
  SessionSchema,
} from "@flux/shared";
import type { RepositoryDeps } from "./repository";

interface SessionRow {
  id: string;
  user_id: string;
  name: string;
  started_at: string;
  ended_at: string | null;
  created_by: string;
}

function rowToSession(row: SessionRow): Session {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    started_at: row.started_at,
    ended_at: row.ended_at,
    created_by: row.created_by as Session["created_by"],
  };
}

export class SessionRepository {
  constructor(private readonly deps: RepositoryDeps) {}

  async findAll(options?: { openOnly?: boolean }): Promise<Session[]> {
    const parts = ["SELECT * FROM sessions WHERE user_id = ?"];
    const params: (string | null)[] = [this.deps.userId];
    if (options?.openOnly) parts.push("AND ended_at IS NULL");
    parts.push("ORDER BY started_at DESC");
    const rows = await this.deps.adapter.query<SessionRow>(parts.join(" "), params);
    return rows.map(rowToSession);
  }

  async findById(id: string): Promise<Session | null> {
    const rows = await this.deps.adapter.query<SessionRow>(
      "SELECT * FROM sessions WHERE id = ? AND user_id = ?",
      [id, this.deps.userId]
    );
    const first = rows[0];
    return first ? rowToSession(first) : null;
  }

  async insert(input: CreateSession): Promise<Session> {
    const createdBy = input.created_by ?? "user";
    const session: Session = {
      id: this.deps.idFactory(),
      user_id: this.deps.userId,
      name: input.name,
      started_at: input.started_at ?? this.deps.now(),
      ended_at: null,
      created_by: createdBy,
    };
    SessionSchema.parse(session);
    await this.deps.adapter.exec(
      "INSERT INTO sessions (id, user_id, name, started_at, ended_at, created_by) VALUES (?, ?, ?, ?, ?, ?)",
      [
        session.id,
        session.user_id,
        session.name,
        session.started_at,
        session.ended_at,
        session.created_by,
      ]
    );
    await this.deps.syncQueue?.enqueue({
      entity: "sessions",
      entity_id: session.id,
      op: "create",
      payload: session,
    });
    return session;
  }

  async close(id: string, endedAt?: string): Promise<Session | null> {
    const existing = await this.findById(id);
    if (!existing || existing.ended_at !== null) return null;
    const next: Session = { ...existing, ended_at: endedAt ?? this.deps.now() };
    await this.deps.adapter.exec(
      "UPDATE sessions SET ended_at = ? WHERE id = ? AND user_id = ?",
      [next.ended_at, id, this.deps.userId]
    );
    await this.deps.syncQueue?.enqueue({
      entity: "sessions",
      entity_id: id,
      op: "update",
      payload: next,
    });
    return next;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.deps.adapter.exec(
      "DELETE FROM sessions WHERE id = ? AND user_id = ?",
      [id, this.deps.userId]
    );
    await this.deps.syncQueue?.enqueue({
      entity: "sessions",
      entity_id: id,
      op: "delete",
      payload: { id },
    });
    return true;
  }
}
