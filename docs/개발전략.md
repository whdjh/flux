# 개발전략

서버(flux-be)와 별개로, 클라이언트 쪽 핵심 로직을 어떤 순서로 만들지 정한다.


## 핵심 아이디어

Rust 코어 라이브러리를 먼저 만들고, CLI로 검증한 뒤, Tauri 프론트엔드에 붙인다.

비즈니스 로직과 UI를 강제로 분리하는 게 목적이다. 수집 엔진, 로컬 저장, 검색, AI 파이프라인은 UI 없이도 동작해야 한다. CLI는 이 코어의 테스트 클라이언트 역할을 한다. "제품"이 아니라 "검증 도구"다.

깊이 모델의 배경(폴더 감시, 클립보드, AI 분류)과 순간(단축키 수집)은 UI가 거의 없다. 이 두 층위를 CLI로 먼저 검증하면 코어가 안정된 상태에서 프론트엔드 작업을 시작할 수 있다.


## 세 개의 층

```
flux-core (라이브러리)
    │
    ├── flux-cli (CLI 테스트 래퍼)
    │
    └── flux-app (Tauri + Next.js)
```

### flux-core

Rust 라이브러리 크레이트다. Tauri와 CLI 모두 이 크레이트를 의존한다.

담당하는 것:
- 아이템 CRUD (SQLite, 로컬)
- 수집 엔진 (URL → OG fetch, 클립보드 감시, 폴더 감시)
- 검색 (FTS5 전문 검색)
- AI 파이프라인 (요약, 키워드, 분류)
- 세션/폴더 관리
- loro CRDT 통합 (문서 편집)

담당하지 않는 것:
- UI 렌더링
- 창 관리 (포스트잇, 시스템 트레이)
- WebSocket 서버 통신 (sync 모듈은 flux-be에 있다)

### flux-cli

flux-core를 직접 호출하는 CLI 바이너리다. 프로덕션 제품이 아니다.

```
flux add <url>             아이템 수집 + AI 요약 확인
flux add --text "메모"      텍스트 아이템 수집
flux list                  아이템 목록 (필터, 정렬)
flux search "키워드"        FTS5 검색 검증
flux watch --clipboard     클립보드 감시 시작
flux watch --folder <path> 폴더 감시 시작
flux session start "이름"   세션 생성
flux session list          세션 목록
flux folder create "이름"   폴더 생성
flux ai summary <id>       특정 아이템 AI 요약 트리거
flux ai keywords <id>      특정 아이템 AI 키워드 트리거
flux export                데이터 내보내기
```

검증 목적:
- `flux add` → 수집 < 100ms 확인
- `flux search` → FTS5 정확도 확인
- `flux watch` → 감시 안정성 확인 (장시간 실행)
- `flux ai` → AI 파이프라인 정확도 확인

### flux-app

Tauri v2 + Next.js. 화면.md의 와이어프레임이 여기서 실현된다.

Tauri 커맨드로 flux-core를 노출하고, Next.js WebView가 호출한다. Tauri 쪽에서 추가로 OS 네이티브 기능(포스트잇 창, 시스템 트레이, 글로벌 단축키)을 구현한다.

```
Next.js (WebView)
    ↕ Tauri Command (IPC)
Rust (Tauri)
    ↕ 함수 호출
flux-core (라이브러리)
    ↕
SQLite (로컬)
```


## 단계

### 1단계: 코어 + CLI

flux-core와 flux-cli를 만든다.

순서:
1. SQLite 스키마 + 아이템 CRUD
2. URL 수집 (OG fetch)
3. FTS5 검색
4. 폴더/세션 관리
5. 클립보드 감시
6. 폴더 감시
7. AI 파이프라인 (요약, 키워드, 분류)

각 기능을 CLI 커맨드로 바로 검증한다. 테스트 코드도 함께 작성한다.

### 2단계: Tauri 셸 + 기본 UI

1단계의 아이템 CRUD가 되면 프론트엔드를 시작한다. 1단계와 병행할 수 있다.

순서:
1. Tauri 프로젝트 셋업 (Next.js WebView)
2. flux-core를 Tauri 커맨드로 노출
3. 풀 뷰 (카드 그리드, 사이드바, 툴바)
4. 노트 에디터 (분할 뷰)
5. 커맨드 팔레트 (Cmd+K)

### 3단계: 네이티브 기능

Tauri의 OS 통합 기능을 추가한다. 깊이 모델의 배경/순간/떠있음이 여기서 완성된다.

순서:
1. 시스템 트레이 (배경)
2. 글로벌 단축키 + 빠른 캡처 팝업 (순간)
3. 포스트잇 창 (떠있음)
4. 폴더 감시 + 클립보드 감시 연동 (배경)

### 4단계: 서버 연동

flux-be와 연결한다. 동기화, 인증, 파일 저장.

순서:
1. 인증 (JWT)
2. WebSocket 동기화 (loro CRDT delta)
3. 파일 업로드 (R2)
4. 멀티 디바이스 전파


## 깊이 모델과의 대응

| 깊이 | 검증 시점 | 검증 방법 |
|------|----------|----------|
| 배경 | 1단계 | CLI: `flux watch` 장시간 실행, AI 자동 분류 정확도 |
| 순간 | 1단계 | CLI: `flux add` < 100ms, AI 요약 2초 이내 |
| 떠있음 | 3단계 | Tauri: 포스트잇 창 + 드래그 수집 |
| 몰입 | 2단계 | Tauri: 풀 뷰, 분할 뷰, 우측 패널 |

배경과 순간은 CLI로 검증할 수 있다. 떠있음과 몰입은 GUI가 필수다. 1단계에서 코어를 안정시키고, 2~3단계에서 GUI를 올리는 흐름이다.


## 워크스페이스 구조

구조.md에서 "CLI 도구 등 두 번째 바이너리가 필요할 때" 워크스페이스로 분리한다고 했다. 이 전략을 적용하면 처음부터 워크스페이스로 시작한다.

```
flux/
├── Cargo.toml              # workspace
├── crates/
│   ├── flux-core/          # 라이브러리 (수집, 저장, 검색, AI)
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── lib.rs
│   │       ├── item/       # 아이템 CRUD
│   │       ├── collect/    # 수집 엔진 (URL, 클립보드, 폴더)
│   │       ├── search/     # FTS5 검색
│   │       ├── ai/         # AI 파이프라인
│   │       ├── session/    # 세션 관리
│   │       ├── folder/     # 폴더 관리
│   │       └── db/         # SQLite 접근
│   │
│   └── flux-cli/           # CLI 바이너리
│       ├── Cargo.toml      # depends on flux-core
│       └── src/
│           └── main.rs
│
├── apps/
│   └── desktop/            # Tauri + Next.js
│       ├── src-tauri/      # Tauri Rust (depends on flux-core)
│       └── src/            # Next.js
│
└── packages/               # 공유 TS 패키지 (향후)
```

flux-be(서버)는 별도 레포지토리에 있다. 여기는 클라이언트 전용이다.


## 주의사항

CLI를 프로덕션으로 키우지 않는다. 검증이 끝나면 CLI에 새 기능을 추가하지 않고 Tauri에 집중한다. CLI가 목적이 되면 우회로가 된다.

1단계와 2단계는 겹칠 수 있다. 코어의 아이템 CRUD가 되면 프론트엔드를 시작한다. 코어의 검색이 되면 커맨드 팔레트를 붙인다. 순차가 아니라 파이프라인이다.

구조.md의 서버 구조와 겹치지 않는다. flux-core는 클라이언트 로컬 로직이고, flux-be의 services/는 서버 비즈니스 로직이다. 아이템 CRUD가 양쪽에 있지만 역할이 다르다 — flux-core는 로컬 SQLite, flux-be는 PostgreSQL + 동기화.
