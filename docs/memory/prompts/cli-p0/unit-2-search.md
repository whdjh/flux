# unit-2: search (검색) 명령 (Phase 2, 병렬)

## 작업 제목

`flux search <query>` 명령을 추가한다. 키워드 모드는 SQLite FTS5 기반, 의미 모드는 v1에서 placeholder.

## 맥락

- 프로젝트 루트: `/home/jjy84/04_april/flux` (이 워크트리에서는 `feat/cli-search` 브랜치)
- `docs/features/검색.md` 단일 명세. "잊지 않게" 원칙의 작동 지점 — 보존했는데 못 찾으면 잊은 것과 같다.
- v1 스코프: 키워드 검색(FTS5), 의미 모드는 placeholder. 불리언·정규식·외부 검색 안 함.
- 의존: unit-0 완료 후 시작

## 목표

순수 함수 + format 헬퍼 + register를 `commands/search.ts`에 만든다. items와 documents를 각각 검색해 통합 결과로 반환.

명령 시그니처:

```ts
export type SearchHit =
  | { kind: "item"; id: string; type: ItemType; snippet: string }
  | { kind: "doc"; id: string; title: string };

export async function searchAll(
  store,
  input: { query: string; mode: "keyword" | "semantic"; limit?: number }
): Promise<SearchHit[]>
```

CLI 표면:

```
flux search <query> [--mode keyword|semantic] [--limit N]
```

- `--mode semantic` → stderr `semantic mode not implemented` 출력 + exit 1
- `--limit` 기본 20

## 수정

없음.

## 생성

- `apps/cli/src/commands/search.ts` — `searchAll` + `formatSearchHit`, `formatSearchHits` + `register`
- `apps/cli/src/commands/search.test.ts` — vitest, in-memory better-sqlite3, Store 주입. happy + 한국어 토큰 + 빈 결과 + limit + semantic placeholder = 6~8개

`apps/cli/src/index.ts`에 register 두 줄 추가가 유일한 변경.

## 건드리지 않음 (readonly)

- `apps/cli/src/index.ts` — register 두 줄만
- `apps/cli/src/db.ts`, `adapter.ts`
- `apps/cli/src/commands/folder.ts`, `folder.test.ts`
- `packages/store/src/item-repository.ts`, `document-repository.ts` — 기존 메서드만 사용

## 패턴 참조

- `apps/cli/src/commands/list.ts` — 결과 리스트 + format 헬퍼
- `apps/cli/src/commands/folder.ts` (Phase 1 결과) — register

검색 흐름 (가상 코드):
```ts
const items = await store.items.search(query);    // ItemRepository.search 가정
const docs = await store.documents.searchByTitle(query);  // DocumentRepository.searchByTitle 가정
const hits: SearchHit[] = [
  ...items.map(it => ({ kind: "item", id: it.id, type: it.type, snippet: it.content.slice(0, 80) })),
  ...docs.map(d => ({ kind: "doc", id: d.id, title: d.title })),
];
return hits.slice(0, limit);
```

만약 store에 `search()` / `searchByTitle()`가 없으면 직접 SQL을 사용하지 말고 **사용자에게 즉시 보고** — packages/store 변경은 이 unit의 readonly 경계 위반이라 별도 unit으로 분리해야 함. 대안: `apps/cli/src` 안에 검색 어댑터를 두고 `store.adapter.query`로 직접 FTS5 호출 (이건 packages/store 수정 없음, CLI 안에서 SQL 임시 처리). 어느 쪽이든 보고 후 결정.

## 확인 필요 (사용자 결정)

- store에 검색 메서드 부재 시: (A) 별도 unit으로 store에 추가 (B) CLI 안에서 `store.adapter.query`로 직접 FTS5 SQL 호출
- 결과 정렬: 기본값 **items 먼저 → docs 뒤**, 각 그룹 내 rank 유지
- 결과 0건일 때: 기본값 `(no results for "<query>")`

## 완료 조건

- [ ] `commands/search.ts` — searchAll + 2 format 헬퍼 + register
- [ ] `commands/search.test.ts` — 6개 이상 통과
- [ ] `apps/cli/src/index.ts`에 register 추가
- [ ] 스모크:
  ```sh
  rm -rf /tmp/flux-smoke
  export FLUX_HOME=/tmp/flux-smoke
  pnpm --filter @flux/cli exec tsx src/index.ts capture "딥러닝 논문 정리"
  pnpm --filter @flux/cli exec tsx src/index.ts capture "Rust async 패턴"
  pnpm --filter @flux/cli exec tsx src/index.ts search 딥러닝
  pnpm --filter @flux/cli exec tsx src/index.ts search Rust --limit 5
  pnpm --filter @flux/cli exec tsx src/index.ts search anything --mode semantic
  ```
- [ ] `pnpm -r test` 회귀 없음
- [ ] 커밋: `feat(cli): search 명령 — 키워드 FTS5 검색 (의미 모드 placeholder)`
- [ ] 워크트리 상태 유지
