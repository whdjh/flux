# Flux Frontend

web(Next.js), desktop(Tauri), mobile(Expo) 세 클라이언트의 공통 아키텍처 문서.

## FSD (Feature-Sliced Design)

의존 방향: `app → features → entities → shared` (위에서 아래로만)

```
src/
├── app/              # 라우트 + 전역 프로바이더 (앱별 자체 구현)
├── features/         # 기능 슬라이스 (사용자 시나리오 단위)
│   ├── shell/        #   레이아웃: 사이드바, 탭바, 상태바, 분할뷰
│   ├── collect/      #   수집: 드래그앤드롭, 클립보드
│   ├── organize/     #   정리: 뷰모드, 정렬, AI 분류제안
│   ├── editor/       #   메모 에디터: CRDT, 슬래시커맨드
│   ├── search/       #   Cmd+K 검색 + 커맨드 팔레트
│   ├── ai/           #   AI 요약, RAG 채팅
│   ├── collab/       #   실시간 협업: WebSocket, 커서 브로드캐스트
│   └── sync/         #   동기화: 배치 전송, 오프라인 큐
├── entities/         # 도메인 엔티티 (모델 + 기본 UI)
│   ├── item/         #   수집 아이템
│   ├── note/         #   노트/문서
│   ├── folder/       #   폴더 트리
│   ├── session/      #   세션
│   └── user/         #   사용자 프로필
└── shared/           # 도메인 무관 (유틸, 상수)
```

### 슬라이스 내부 구조

```
features/editor/
├── ui/           # React 컴포넌트
├── model/        # Zustand 스토어·훅
├── api/          # 서버 호출
└── index.ts      # barrel export (이것만 외부에 노출)
```

### 코드 배치 기준

1. 도메인을 아는가? (Item, Note, Folder 같은 비즈니스 개념)
   - NO → `shared/`
   - YES → 2번으로
2. 단순 CRUD를 넘어서는 로직이 있는가?
   - NO → `entities/`
   - YES → `features/`

## 3종 앱의 FSD 공유 전략

`packages/`에 공통 로직을 두고, 각 앱의 `src/`는 FSD 레이어로 조립한다.

| FSD 레이어 | 공유 방식 | 비고 |
|---|---|---|
| `shared/` | `@flux/shared` 패키지로 추출 | 전 앱 공유 |
| `entities/` | 타입·스키마는 `@flux/shared`, 조회 로직은 `@flux/store` | UI 표현만 앱별 |
| `features/` | 코어 로직은 `@flux/store`, `@flux/editor-core` | UI는 앱별 구현 |
| `app/` | 각 앱이 자체 구현 | 라우팅·프로바이더가 다름 |

### web ↔ desktop 공유

Tauri WebView가 web의 React를 그대로 렌더링하므로 `@flux/ui` 포함 거의 100% 공유.
desktop 고유 코드: Rust IPC, 파일 시스템 감시, 시스템 트레이.

### mobile 차이점

React Native는 DOM이 아니므로 `@flux/ui` 직접 사용 불가.
- 공유: `@flux/store`, `@flux/api-client`, `@flux/editor-core` (코어 로직)
- 자체 구현: UI 컴포넌트, 네비게이션, 네이티브 모듈

## 공통 규칙

- `@/*`는 각 앱의 `src/`를 가리킨다 (tsconfig paths).
- Server Component 기본, 상태·이벤트 필요 시만 `"use client"` (web/desktop).
- AI 호출은 반드시 API Route를 경유 (API 키 서버 보관).
- 낙관적 업데이트: 수집 → UI 반영 100ms 이내.
- 에디터 무거운 연산은 Web Worker로 분리 (타이핑 16ms 이내).

## 하위 문서

- `web/CLAUDE.md` — Next.js App Router, SSR, Server Component
- `desktop/CLAUDE.md` — Tauri v2, Rust IPC, 네이티브 기능
- `mobile/CLAUDE.md` — React Native Expo, 오프라인 우선 전략
