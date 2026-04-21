# Flux

수집 → 정리 → 메모 → 검색 → AI 활용을 하나의 흐름으로 연결하는 지식 관리 플랫폼. 한 줄 정의: 수집부터 기록, 큐레이션까지 한 앱에서 — AI 기반 세컨드 브레인.

## 맥락 로드 순서

매 세션 시작 시 다음 순서로 참고. 아래로 갈수록 원재료다.

1. 이 파일 — 절대 규칙, 실행 방법
2. `docs/requirements/요구사항.md` — 프로젝트가 무엇을 해야 하는지
3. `docs/스택.md`, `docs/아키텍처.md`, `docs/파일구조.md` — 기술적 기준
4. `docs/features/` — 기능 단위 명세
5. `docs/context/` 최신 MMDD.md — 직전 세션 기록
6. `docs/essences/` — 원재료 (필요 시에만)

전체 제품 정의는 `docs/essences/앱-재정의.md` (1028줄, 11개 챕터).

## 빌드 및 실행

```bash
pnpm install                    # 전체 의존성
pnpm dev --filter web           # 웹 개발 서버
pnpm build                      # 전체 빌드
pnpm lint                       # 전체 린트
pnpm test                       # 단위·통합 테스트
pnpm test:e2e                   # E2E
```

### 환경변수

변수명·도메인은 12단계에서 확정. 현재는 제안안만 `docs/인프라.md` 참고.

## 절대 규칙

- `apps/` 간 직접 import 금지
- `packages/` 간 순환 의존 금지
- 의존 방향: `apps/* → packages/* → packages/shared → 외부만`
- AI는 제안만. 자동 실행 없음. 모든 AI 결과는 사용자 승인 후 적용
- 디자인 토큰은 `apps/frontend/web/src/app/globals.css` 한 곳에서 관리

## 문서 동기화

| 변경 | 업데이트할 문서 |
|------|----------------|
| 디자인 토큰 (globals.css) | docs/design-system/디자인.md |
| 기능 구현 완료 | docs/개발현황.md |
| 트러블슈팅 해결 | docs/트러블슈팅.md |

## 맥락 관리

세션 시작: context/에서 최근 파일 확인, CLAUDE.md로 프로젝트 맥락 확인
세션 종료: context-writer로 context/MMDD.md 작성 (한 것/근거/할 것)
