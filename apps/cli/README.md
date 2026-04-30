# @flux/cli

UI 없이 packages/* 위에서 수집·정리·메모·검색·동기화 핵심 루프를 검증하는 CLI. 정식 사용자 인터페이스가 아니라 개발 도구다 — 검증된 흐름이 web/desktop/mobile에 이식된다.

## 실행

```sh
pnpm --filter @flux/cli flux -- <command>
# 또는 apps/cli 폴더에서
pnpm flux -- <command>
```

DB 경로는 기본 `~/.flux/flux.db`. 환경 변수 `FLUX_HOME`으로 바꿀 수 있다.

## 명령

```sh
# 텍스트 수집
flux capture "오늘 본 흥미로운 아이디어"

# 링크 수집
flux capture "https://example.com" --type link --url https://example.com --title "Example"

# 목록 (최신순)
flux list
flux list --limit 10
```

## 다음 단계

기능 명세는 `docs/features/` 참조. 구현 순서: 수집 → 정리 → 메모 → 검색 → 동기화.
