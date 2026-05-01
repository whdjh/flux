# CLI P0 병렬 작업 프롬프트

flux CLI P0 명령(memo·search·sync)을 병렬로 추가하기 위한 work unit별 세션 프롬프트.

## 구조

- **Phase 1 (순차)**: `unit-0-register-hook.md` — index.ts에 register 패턴 도입
- **Phase 2 (병렬 3개)**: `unit-1-docs.md`, `unit-2-search.md`, `unit-3-sync.md`
- **Phase 3 (순차)**: 사람이 dev로 머지 (충돌 없음)

## 실행

`run-worktrees.sh`에 워크트리 생성·tmux 시작 명령이 모두 들어있다.

```sh
bash docs/memory/prompts/cli-p0/run-worktrees.sh
```

각 tmux 창에서 해당 unit의 프롬프트 파일을 Claude Code에 붙여넣어 시작.

## 의존 그래프

```
unit-0 ──┬─→ unit-1 (docs)   ─┐
         ├─→ unit-2 (search)  ┼─→ 통합 (사람)
         └─→ unit-3 (sync)   ─┘
```

unit-0이 완료된 다음에야 Phase 2 세 unit이 시작된다 (각 unit이 register 패턴을 사용하기 때문).

## 통합 절차

세 unit이 모두 완료되면:

```sh
cd /home/jjy84/04_april/flux
git checkout dev
git merge --no-ff feat/cli-docs
git merge --no-ff feat/cli-search
git merge --no-ff feat/cli-sync
pnpm --filter @flux/cli test
pnpm --filter @flux/cli exec tsx src/index.ts --help  # 모든 명령 노출 확인
```

각 unit은 commands/ 하위에 **새 파일만** 추가하고 index.ts는 한 줄(register import + 호출)만 추가하므로 머지 충돌이 라인 단위로만 발생한다.
