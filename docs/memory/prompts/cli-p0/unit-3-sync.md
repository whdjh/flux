# unit-3: sync (동기화) 명령 (Phase 2, 병렬)

## 작업 제목

`flux sync push/status` 두 명령을 추가한다. backend가 아직 없으므로 dry-run 기본, 실제 전송은 placeholder.

## 맥락

- 프로젝트 루트: `/home/jjy84/04_april/flux` (이 워크트리에서는 `feat/cli-sync` 브랜치)
- `docs/features/동기화.md` 단일 명세. 세 행위(수집·검토·메모)가 기기를 넘나든다는 게 이유.
- v1 스코프: sync_queue 조회와 dry-run 출력. 실제 backend 전송은 backend 도착 후 별도 unit.
- 의존: unit-0 완료 후 시작

## 목표

순수 함수 + format 헬퍼 + register를 `commands/sync.ts`에 만든다.

명령 시그니처:

```ts
export interface SyncStatus {
  pending: number;
  lastError: string | null;
}

export async function syncStatus(store): Promise<SyncStatus>
export async function syncPush(store, input: { dryRun: boolean; limit?: number }): Promise<SyncQueueEntry[]>
```

CLI 표면:

```
flux sync status                            # 큐 상태 (pending 수, 마지막 실패 이유)
flux sync push [--dry-run] [--limit N]      # dry-run 기본 true
```

`--dry-run` 기본 true. `--no-dry-run` 또는 `--dry-run=false`이면 stderr `non-dry-run not implemented (backend not ready)` + exit 1.

## 수정

없음.

## 생성

- `apps/cli/src/commands/sync.ts` — `syncStatus`, `syncPush` + `formatSyncStatus`, `formatSyncEntries` + `register`
- `apps/cli/src/commands/sync.test.ts` — vitest, in-memory better-sqlite3, Store 주입. status 빈 상태 + 시드된 entry + push dry-run + push non-dry-run = 5~6개

`apps/cli/src/index.ts`에 register 두 줄 추가가 유일한 변경.

## 건드리지 않음 (readonly)

- `apps/cli/src/index.ts` — register 두 줄만
- `apps/cli/src/db.ts`, `adapter.ts`
- `apps/cli/src/commands/folder.ts`, `folder.test.ts`
- `packages/store/src/sync-queue.ts` — `peek()`, `size()`, `enqueue()` 사용
- `packages/api-client/src/rest.ts` — 아직 사용 안 함

## 패턴 참조

- `apps/cli/src/commands/folder.ts` (Phase 1 결과) — 서브커맨드 패턴 (`folder create/ls/mv`와 동일하게 `sync push/status` 구성)

테스트 시드:
```ts
await store.syncQueue.enqueue({
  entity: "items",
  entity_id: "test-1",
  op: "create",
  payload: JSON.stringify({ id: "test-1", type: "text", content: "hi" }),
});
```

## 확인 필요 (사용자 결정)

- 출력 포맷: `<id>  <entity>/<op>  <entity_id>  attempts=<n>  last_error=<...>`
- limit 기본값: 50

## 완료 조건

- [ ] `commands/sync.ts` — 2 순수 함수 + 2 format 헬퍼 + register
- [ ] `commands/sync.test.ts` — 5개 이상 통과
- [ ] `apps/cli/src/index.ts`에 register 추가
- [ ] 스모크:
  ```sh
  rm -rf /tmp/flux-smoke
  export FLUX_HOME=/tmp/flux-smoke
  pnpm --filter @flux/cli exec tsx src/index.ts sync status   # → pending=0
  pnpm --filter @flux/cli exec tsx src/index.ts sync push --dry-run
  ```
- [ ] `pnpm -r test` 회귀 없음
- [ ] 커밋: `feat(cli): sync push/status 명령 — backend 도착 전까지 dry-run`

## 후속 (이 unit 범위 밖)

Repository 레벨에서 자동 enqueue를 추가하려면 별도 unit. 본 unit은 그 통합을 다루지 않음.
