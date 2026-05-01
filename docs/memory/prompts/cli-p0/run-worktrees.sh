#!/usr/bin/env bash
#
# CLI P0 병렬 작업: 워크트리 + tmux 세션 부트스트랩
#
# Phase 1: phase1/cli-register-hook (단독, 먼저 끝나야 함)
# Phase 2: feat/cli-{docs,search,sync} (병렬, unit-0 완료·머지 후)
#
# 사용:
#   bash docs/memory/prompts/cli-p0/run-worktrees.sh phase1
#   # → unit-0 작업 후 dev에 머지하고 다시:
#   bash docs/memory/prompts/cli-p0/run-worktrees.sh phase2
#
# 필요 도구: git, tmux

set -euo pipefail

REPO_ROOT="/home/jjy84/04_april/flux"
WT_ROOT="/home/jjy84/04_april/flux-worktrees"
PROMPTS_DIR="${REPO_ROOT}/docs/memory/prompts/cli-p0"
SESSION="flux-cli-p0"

PHASE="${1:-help}"

case "${PHASE}" in
  phase1)
    echo "Phase 1: phase1/cli-register-hook 워크트리 + tmux 창 1개"
    cd "${REPO_ROOT}"
    mkdir -p "${WT_ROOT}"

    if ! git show-ref --verify --quiet "refs/heads/phase1/cli-register-hook"; then
      git branch "phase1/cli-register-hook" dev
    fi
    if [ ! -d "${WT_ROOT}/phase1-cli-register-hook" ]; then
      git worktree add "${WT_ROOT}/phase1-cli-register-hook" "phase1/cli-register-hook"
    fi

    if ! tmux has-session -t "${SESSION}" 2>/dev/null; then
      tmux new-session -d -s "${SESSION}" -n "register-hook" -c "${WT_ROOT}/phase1-cli-register-hook"
    else
      tmux new-window -t "${SESSION}" -n "register-hook" -c "${WT_ROOT}/phase1-cli-register-hook"
    fi

    echo
    echo "tmux attach -t ${SESSION}"
    echo "창에서 Claude Code 띄우고 다음 프롬프트 붙여넣기:"
    echo "  cat ${PROMPTS_DIR}/unit-0-register-hook.md"
    ;;

  phase2)
    echo "Phase 2: feat/cli-{docs,search,sync} 워크트리 + tmux 창 3개 (병렬)"
    cd "${REPO_ROOT}"
    mkdir -p "${WT_ROOT}"

    UNITS=(
      "feat/cli-docs:feat-cli-docs:unit-1-docs.md"
      "feat/cli-search:feat-cli-search:unit-2-search.md"
      "feat/cli-sync:feat-cli-sync:unit-3-sync.md"
    )

    if ! tmux has-session -t "${SESSION}" 2>/dev/null; then
      tmux new-session -d -s "${SESSION}" -n "placeholder"
    fi

    for entry in "${UNITS[@]}"; do
      IFS=':' read -r BRANCH DIR PROMPT <<<"${entry}"
      WT_PATH="${WT_ROOT}/${DIR}"

      if ! git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
        git branch "${BRANCH}" dev
      fi
      if [ ! -d "${WT_PATH}" ]; then
        git worktree add "${WT_PATH}" "${BRANCH}"
      fi

      tmux new-window -t "${SESSION}" -n "${DIR##feat-cli-}" -c "${WT_PATH}"
    done

    tmux kill-window -t "${SESSION}:placeholder" 2>/dev/null || true

    echo
    echo "tmux attach -t ${SESSION}"
    echo "각 창에서 Claude Code 띄우고 다음 프롬프트 붙여넣기:"
    for entry in "${UNITS[@]}"; do
      IFS=':' read -r BRANCH DIR PROMPT <<<"${entry}"
      echo "  ${DIR##feat-cli-}: cat ${PROMPTS_DIR}/${PROMPT}"
    done
    ;;

  cleanup)
    echo "워크트리 정리 (머지 완료 후)"
    cd "${REPO_ROOT}"
    for d in phase1-cli-register-hook feat-cli-docs feat-cli-search feat-cli-sync; do
      if [ -d "${WT_ROOT}/${d}" ]; then
        git worktree remove "${WT_ROOT}/${d}" || true
      fi
    done
    git worktree prune
    echo "tmux kill-session -t ${SESSION}"
    ;;

  help|*)
    cat <<USAGE
사용:
  bash $0 phase1       # Phase 1 워크트리 + tmux 창
  bash $0 phase2       # Phase 2 워크트리 3개 + tmux 창 3개 (unit-0 머지 후)
  bash $0 cleanup      # 머지 완료 후 워크트리·tmux 정리

흐름:
  1) bash $0 phase1
  2) tmux attach -t ${SESSION} → register-hook 창에서 unit-0 프롬프트
  3) 작업·커밋 후 dev에 머지
  4) bash $0 phase2
  5) 세 창에서 unit-1/2/3 병렬
  6) dev에 순차 머지
  7) bash $0 cleanup
USAGE
    ;;
esac
