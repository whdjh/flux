# Flux

수집 → 정리 → 메모 → 검색 → AI 활용을 하나의 흐름으로 연결하는 지식 관리 플랫폼.
pnpm workspace + Turborepo 모노레포.

## 구조

```
flux/
├── apps/
│   ├── frontend/
│   │   ├── web/            # Next.js 16 App Router (SSR, SEO)
│   │   ├── desktop/        # Tauri v2 (WebView + Rust 네이티브)
│   │   └── mobile/         # React Native Expo
│   └── backend/            # API 서버, WebSocket, AI 프록시
├── packages/
│   ├── shared/             # 도메인 무관 타입·유틸·상수
│   ├── ui/                 # 공통 UI 컴포넌트 (web/desktop 공유)
│   ├── store/              # Zustand 스토어 (전 클라이언트 공유)
│   ├── api-client/         # API 클라이언트·타입 정의
│   └── editor-core/        # loro CRDT 에디터 코어
├── pnpm-workspace.yaml
└── turbo.json
```

## 왜 이 구조인가

- **모노레포**: 프론트 3종 + 백엔드가 `packages/`를 통해 타입·로직 공유. 중복 제거.
- **FSD 아키텍처** (frontend): `app → features → entities → shared` 단방향 의존.
- **loro CRDT**: 오프라인 편집 → 온라인 병합을 충돌 없이 처리.
- **AI는 제안만**: 자동 실행 없음. 모든 AI 결과는 사용자 승인 후 적용.

## 의존 규칙

```
apps/*  →  packages/*  →  packages/shared  →  외부만
```

- `apps/` 간 직접 import 금지.
- `packages/` 간 순환 의존 금지.

## 코드 공유 범위

| 패키지 | web | desktop | mobile |
|---|:---:|:---:|:---:|
| shared | ✓ | ✓ | ✓ |
| ui | ✓ | ✓ | ✗ (자체 UI) |
| store | ✓ | ✓ | ✓ |
| api-client | ✓ | ✓ | ✓ |
| editor-core | ✓ | ✓ | ✓ (UI만 별도) |

## 명령어

```bash
pnpm install                    # 전체 의존성
pnpm dev --filter web           # 웹 개발 서버
pnpm build                      # 전체 빌드
pnpm lint                       # 전체 린트
```

## 성능 목표

- 수집 → UI 반영: < 100ms (낙관적 업데이트)
- 에디터 타이핑: < 16ms (60fps)
- 검색 디바운스: 200ms
- 동기화 배치: 5초 or 30개 변경

## 하위 문서

각 디렉토리에 자체 CLAUDE.md가 있다. 해당 영역 작업 시 참조할 것.

- `apps/frontend/CLAUDE.md` — FSD 아키텍처, 프론트 3종 코드 공유 전략
- `apps/frontend/web/CLAUDE.md` — Next.js App Router, SSR, Server Component
- `apps/frontend/desktop/CLAUDE.md` — Tauri v2, Rust IPC, 네이티브 기능
- `apps/frontend/mobile/CLAUDE.md` — React Native Expo, 모바일 고유 패턴
- `apps/backend/CLAUDE.md` — API 설계, 인증, DB, WebSocket
- `packages/CLAUDE.md` — 패키지 생성·의존 규칙
