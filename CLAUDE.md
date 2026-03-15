# Flux

수집 → 정리 → 메모 → 검색 → AI 활용을 하나의 흐름으로 연결하는 지식 관리 플랫폼.

## 빌드 및 실행

```bash
pnpm install                    # 전체 의존성
pnpm dev --filter web           # 웹 개발 서버
pnpm build                      # 전체 빌드
pnpm lint                       # 전체 린트
```

### 환경변수

```env
{변수명}={설명}  # 필수
{변수명}={설명}  # 선택
```

## 절대 규칙

- `apps/` 간 직접 import 금지
- `packages/` 간 순환 의존 금지
- 의존 방향: `apps/* → packages/* → packages/shared → 외부만`
- AI는 제안만. 자동 실행 없음. 모든 AI 결과는 사용자 승인 후 적용
- 디자인 토큰은 `apps/frontend/web/src/app/globals.css` 한 곳에서 관리

## 문서 동기화

| 변경 | 업데이트할 문서 |
|------|----------------|
| 디자인 토큰 (globals.css) | docs/design/디자인.md |
| 기능 구현 완료 | docs/개발현황.md |
| 트러블슈팅 해결 | docs/트러블슈팅.md |

## 맥락 관리

세션 시작: context/에서 최근 파일 확인, CLAUDE.md로 프로젝트 맥락 확인
세션 종료: context-writer로 context/MMDD.md 작성 (한 것/근거/할 것)
