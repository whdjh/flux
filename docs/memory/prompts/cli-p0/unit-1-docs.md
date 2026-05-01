# unit-1: docs (메모) 명령 (Phase 2, 병렬)

## 작업 제목

`flux docs new/ls/embed/append/show` 다섯 명령을 추가한다. 노트(Document)를 loro CRDT로 다루고 아이템 임베드를 같이 관리한다.

## 맥락

- 프로젝트 루트: `/home/jjy84/04_april/flux` (이 워크트리에서는 `feat/cli-docs` 브랜치)
- `docs/features/메모.md` 단일 명세. 메모는 정보 흐름의 "엮임" 단계 — 들어와서 쌓이고 걸러진 아이템에 자기 언어를 더한다.
- v1 스코프: 리치텍스트 편집(loro 기반), 아이템 임베드, 노트 간 링크. Notion 테이블·Obsidian 백링크 그래프는 안 한다.
- 의존: unit-0(register-hook 패턴) **완료 후 시작** — register 패턴이 도입된 dev에서 분기

## 목표

순수 함수 5개 + format 헬퍼 + register 함수를 `commands/docs.ts`에 만든다. CRDT 직렬화는 `FluxDoc.exportSnapshot()`/`load()`로 매 명령 끝에 `documents.crdt_doc` 갱신. embed는 CRDT의 embed 리스트와 `item_embeds` 테이블 양쪽에 기록.

명령 시그니처:

```ts
export async function createDoc(store, input: { title?: string; folderId?: string | null }): Promise<Document>
export async function listDocs(store, input: { folderId?: string | null } = {}): Promise<Document[]>
export async function embedToDoc(store, docId: string, itemId: string): Promise<{ document: Document; embed: ItemEmbed } | null>
export async function appendToDoc(store, docId: string, text: string): Promise<Document | null>
export async function showDoc(store, docId: string): Promise<{ document: Document; text: string; embeds: EmbedEntry[] } | null>
```

CLI 표면:

```
flux docs new [--title <t>] [--folder <id>]
flux docs ls [--folder <id>]
flux docs embed <docId> <itemId>
flux docs append <docId> <text>
flux docs show <docId>
```

## 수정

없음.

## 생성

- `apps/cli/src/commands/docs.ts` — 순수 함수 5개 + `formatDoc`, `formatDocList`, `formatDocShow` + `register`
- `apps/cli/src/commands/docs.test.ts` — vitest, in-memory better-sqlite3, Store 주입. 12개 이상 케이스(각 명령별 happy + 1~2개 엣지)

`apps/cli/src/index.ts`에 `import { register as registerDocs } from "./commands/docs"; registerDocs(program, openCli);` 두 줄 추가가 **유일한 변경**. 충돌 위험 최소.

## 건드리지 않음 (readonly)

- `apps/cli/src/index.ts` — register 호출 두 줄만 추가, 그 외 변경 금지
- `apps/cli/src/db.ts`, `adapter.ts`
- `apps/cli/src/commands/folder.ts` — register 패턴·테스트 패턴 레퍼런스
- `apps/cli/src/commands/folder.test.ts` — 테스트 패턴 레퍼런스 (Store 주입 + in-memory adapter)
- `packages/store/src/document-repository.ts`, `item-embed-repository.ts`
- `packages/editor-core/src/{flux-doc,embed-ops,text-ops}.ts`

## 패턴 참조

- `apps/cli/src/commands/folder.ts` (Phase 1 결과) — register + 순수 함수 + format 헬퍼
- `apps/cli/src/commands/folder.test.ts` — Store 주입 패턴, `makeStore()` 헬퍼

CRDT 사용 흐름 (embed 시):
```ts
// 1. 기존 crdt_doc 로드
const fluxDoc = FluxDoc.load(document.crdt_doc);
// 2. embed 리스트의 다음 position
const position = listEmbeds(fluxDoc).length;
// 3. CRDT에 embed 추가
embedItem(fluxDoc, { item_id: itemId, position });
// 4. 스냅샷 저장
const snapshot = fluxDoc.exportSnapshot();
await store.documents.update(docId, { crdt_doc: snapshot });
// 5. item_embeds 테이블에도 동일 (검색·조인 용도)
await store.embeds.insert({ document_id: docId, item_id: itemId, position });
```

append 흐름:
```ts
const fluxDoc = FluxDoc.load(document.crdt_doc);
const length = fluxDoc.getText().length;
insertText(fluxDoc, length, text);
const snapshot = fluxDoc.exportSnapshot();
await store.documents.update(docId, { crdt_doc: snapshot });
```

## 확인 필요 (사용자 결정)

- embed 시 같은 itemId가 이미 있으면 거부할지 중복 허용할지 — 8장 메모 명세에 "soft delete 후에도 임베드 깨지지 않게"는 있지만 중복은 명시 없음. 기본값: **중복 허용** (사용자 의도일 수 있음)
- showDoc의 텍스트 출력에서 embed 위치 마커를 어떻게 표시할지 — 기본값: 텍스트 출력 다음에 `embeds:` 섹션으로 분리 출력 (위치 인라인 마커는 v1 범위 밖)

## 완료 조건

- [ ] `commands/docs.ts` — 5 순수 함수 + 3 format 헬퍼 + register
- [ ] `commands/docs.test.ts` — 12개 이상 통과
- [ ] `apps/cli/src/index.ts`에 register 추가 (두 줄)
- [ ] 스모크:
  ```sh
  rm -rf /tmp/flux-smoke
  export FLUX_HOME=/tmp/flux-smoke
  pnpm --filter @flux/cli exec tsx src/index.ts docs new --title "AI 논문"
  # → 출력된 docId 사용
  pnpm --filter @flux/cli exec tsx src/index.ts capture "딥러닝 정리"
  pnpm --filter @flux/cli exec tsx src/index.ts list  # itemId 확인
  pnpm --filter @flux/cli exec tsx src/index.ts docs embed <docId> <itemId>
  pnpm --filter @flux/cli exec tsx src/index.ts docs append <docId> "메모 추가"
  pnpm --filter @flux/cli exec tsx src/index.ts docs show <docId>
  pnpm --filter @flux/cli exec tsx src/index.ts docs ls
  ```
- [ ] `pnpm -r test` 회귀 없음
- [ ] 커밋: `feat(cli): docs 명령 (new/ls/embed/append/show) — 메모 기능 검증`
- [ ] 워크트리 상태로 둠. dev 머지는 사람이 진행
