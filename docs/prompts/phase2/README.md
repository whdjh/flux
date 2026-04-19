# Phase 2 병렬 실행 가이드

Phase 1(`@flux/shared`)이 완성된 뒤 4개 패키지를 git worktree + tmux로 **동시에** 구현한다.

## 사전 조건

- Phase 1 커밋 완료 (`packages/shared` 64 테스트 통과)
- pnpm 설치됨
- tmux 설치됨 (없으면 `sudo apt install tmux`)

## 4개 병렬 세션 세팅

```bash
# 현재 main 브랜치가 Phase 1 직후 상태여야 함
cd /home/jjy84/04_april/flux
git status -sb    # clean, on main

# 4개 worktree 생성 (각자 별도 브랜치)
git worktree add ../flux-wt/api-client   -b phase2/api-client
git worktree add ../flux-wt/store        -b phase2/store
git worktree add ../flux-wt/editor-core  -b phase2/editor-core
git worktree add ../flux-wt/ui           -b phase2/ui

# 각 worktree에 node_modules 설치 (symlink로 캐시 공유)
for d in api-client store editor-core ui; do
  (cd ../flux-wt/$d && pnpm install) &
done
wait
```

## tmux 세션 4개 띄우기

```bash
tmux new-session -d -s flux-api-client   -c ~/04_april/flux-wt/api-client
tmux new-session -d -s flux-store        -c ~/04_april/flux-wt/store
tmux new-session -d -s flux-editor-core  -c ~/04_april/flux-wt/editor-core
tmux new-session -d -s flux-ui           -c ~/04_april/flux-wt/ui

tmux list-sessions
```

각 세션에 `claude` 명령으로 Claude Code를 띄우고, 아래 프롬프트를 첫 메시지로 붙여넣는다.

| 세션 | 프롬프트 파일 |
|---|---|
| `flux-api-client` | `docs/prompts/phase2/phase2-api-client.md` 전문 붙여넣기 |
| `flux-store` | `docs/prompts/phase2/phase2-store.md` |
| `flux-editor-core` | `docs/prompts/phase2/phase2-editor-core.md` |
| `flux-ui` | `docs/prompts/phase2/phase2-ui.md` |

## 모니터링

```bash
# 세션 사이 전환
tmux attach -t flux-api-client
# 나가기: Ctrl+b, d

# 전체 목록
tmux list-sessions

# 특정 세션의 최근 출력
tmux capture-pane -t flux-store -p | tail -30
```

각 세션이 독립 브랜치·독립 worktree·독립 AI 컨텍스트를 갖는다. 서로 안 건드리니 충돌 없다.

## 완료 후 통합

각 세션이 자체 브랜치에 커밋하면:

```bash
cd /home/jjy84/04_april/flux   # 원본(main) worktree로 복귀

# 4개 브랜치를 순차 머지 (rebase 대신 merge 권장 — 독립 작업이라 커밋 히스토리 유지 가치 있음)
git merge phase2/api-client
git merge phase2/store
git merge phase2/editor-core
git merge phase2/ui

# 통합 테스트
pnpm test                # 전체 워크스페이스 테스트

# 문제 없으면 푸시
git push origin main
```

## 정리

병렬 작업 끝나면 worktree와 tmux 세션 정리:

```bash
# tmux 종료
for s in flux-api-client flux-store flux-editor-core flux-ui; do
  tmux kill-session -t $s 2>/dev/null
done

# worktree 제거 (브랜치는 머지 후에도 유지됨)
for d in api-client store editor-core ui; do
  git worktree remove ../flux-wt/$d
done

# 필요하면 Phase 2 브랜치도 정리
git branch -d phase2/api-client phase2/store phase2/editor-core phase2/ui
```

## 주의

- **4개 세션이 동시에 `packages/shared/`를 건드리면 안 된다.** 각 프롬프트에 금지 명시됨.
- **pnpm-lock.yaml 충돌 가능.** 각 세션이 다른 패키지에 의존 추가하면 lock이 각자 바뀜. 머지 때 lock 충돌 나면 main에서 `pnpm install` 재생성.
- **병렬이 아니라 순차로 하고 싶으면** `docs/개발현황.md`의 Phase 2 표를 따라 하나씩 해도 된다.
