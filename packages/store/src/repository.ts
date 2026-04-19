import type { SqliteAdapter } from "./adapter";

export interface RepositoryDeps {
  adapter: SqliteAdapter;
  userId: string;
  idFactory: () => string;
  now: () => string;
}
