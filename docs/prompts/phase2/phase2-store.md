# Phase 2 · packages/store 세션 프롬프트

너는 flux 모노레포의 `@flux/store` 패키지를 구현한다. 이 세션은 **이 패키지만** 건드린다.

## 맥락 로드

1. `CLAUDE.md`
2. `docs/아키텍처.md` — 데이터 모델 · 동기화 섹션
3. `docs/스택.md` — 로컬 DB: SQLite 섹션
4. `packages/shared/src/*.ts` — 엔티티 (Phase 1 산출물)

## 목표

사용자 기기의 SQLite에 데이터를 저장·조회하는 로컬 스토어. 모든 쓰기는 이 스토어에 먼저 들어간다(로컬 우선). 플랫폼별 바인딩(wa-sqlite·op-sqlite·tauri-plugin-sql)은 **apps가 주입**한다.

## 범위

**포함:**
- `SqliteAdapter` 인터페이스 — `exec(sql, params)`, `query<T>(sql, params)`, `transaction(fn)`. 이것만 apps가 구현해서 주입
- `Store` 클래스 — Adapter를 주입받아 엔티티별 repository 제공
- `ItemRepository`, `DocumentRepository`, `FolderRepository`, `SessionRepository`, `ItemEmbedRepository`
  - 각자 `findAll`, `findById`, `insert`, `update`, `delete`
  - Folder는 `findTree()` (재귀 CTE로 트리 반환)
- 마이그레이션: 초기 스키마 SQL. 버전 번호와 up/down
- FTS5 인덱스 (검색용)
- 오프라인 큐 테이블 (변경된 항목을 서버 반영 전까지 대기)

**제외:**
- 네트워크 통신 (`packages/api-client`)
- 서버 DB (PostgreSQL은 flux-be)
- loro 문서의 binary 이해 — Document.crdt_doc은 blob으로 그대로 저장

## 절대 규칙

- **`packages/shared/` 수정 금지.** Phase 1 잠김.
- **다른 패키지(api-client·editor-core·ui) 수정 금지.**
- **apps/ 수정 금지.** apps가 이 스토어를 import해 Adapter만 주입한다.
- SQL 문자열에 값 보간 금지. 항상 파라미터 바인딩(`?`)을 쓴다 (SQL injection 방지).

## TDD

1. 테스트 먼저 — vitest, in-memory SQLite(`better-sqlite3` dev 전용)로 실 DB 동작 검증
2. 최소 구현
3. 커버리지 80%+

`better-sqlite3`는 테스트 전용 의존성. 프로덕션 코드는 Adapter 인터페이스에만 의존해야 한다.

## 의존성

```bash
pnpm add -F @flux/store @flux/shared
pnpm add -F @flux/store -D vitest better-sqlite3 @types/better-sqlite3
```

## 산출물

```
packages/store/
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── src/
    ├── index.ts
    ├── adapter.ts + adapter.test.ts      (SqliteAdapter 인터페이스 + in-memory 테스트 헬퍼)
    ├── store.ts + store.test.ts          (Store 클래스)
    ├── migrations/
    │   └── 001_init.sql                  (초기 스키마)
    ├── item-repository.ts + *.test.ts
    ├── document-repository.ts + *.test.ts
    ├── folder-repository.ts + *.test.ts  (findTree 포함)
    ├── session-repository.ts + *.test.ts
    ├── item-embed-repository.ts + *.test.ts
    └── sync-queue.ts + sync-queue.test.ts  (오프라인 큐)
```

## 완료 조건

- `pnpm -F @flux/store test` 통과
- `pnpm -F @flux/store exec tsc --noEmit` 에러 0
- 모든 SQL이 파라미터 바인딩 사용 (테스트로도 검증)
- 마이그레이션 001_init.sql 실행 후 엔티티 5종 테이블 생성 확인
- `findTree()` 재귀 쿼리가 중첩 3단계 폴더에서 올바른 결과 반환

## 마무리

완료 후 `docs/개발현황.md`의 Phase 2 표에서 store 항목을 ✅로 갱신.
