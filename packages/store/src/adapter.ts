/**
 * SqliteAdapter는 플랫폼별 SQLite 구현(wa-sqlite·op-sqlite·tauri-plugin-sql)을
 * 추상화한 인터페이스다. 이 스토어의 모든 쓰기/읽기는 이 인터페이스를 통한다.
 *
 * - `exec`: 결과를 돌려주지 않는 쓰기 쿼리 (INSERT, UPDATE, DELETE, CREATE 등)
 * - `query`: SELECT 결과를 제네릭 타입 배열로 반환
 * - `transaction`: 여러 쿼리를 원자적으로 묶음. 내부에서 throw 하면 롤백
 *
 * 모든 값은 파라미터 바인딩(`?`)으로만 전달한다. SQL 문자열에 값 보간 금지.
 */
export type SqlParam = string | number | null | Uint8Array | bigint;

export interface SqliteAdapter {
  exec(sql: string, params?: readonly SqlParam[]): Promise<void>;
  query<T = Record<string, unknown>>(
    sql: string,
    params?: readonly SqlParam[]
  ): Promise<T[]>;
  transaction<T>(fn: (tx: SqliteAdapter) => Promise<T>): Promise<T>;
}
