# Flux Desktop

Tauri v2 기반 데스크톱 앱. WebView 안에서 web의 React 코드를 그대로 렌더링하고,
Rust로 네이티브 기능(파일 시스템, 시스템 트레이, 로컬 DB)을 제공한다.

## 기술 스택

| 항목 | 선택 |
|---|---|
| 프레임워크 | Tauri v2 |
| 프론트엔드 | web과 동일 (React 19 + Next.js) |
| 네이티브 | Rust |
| IPC | Tauri Commands (Rust ↔ JS) |

## 디렉토리

```
desktop/
├── src/                  # Tauri JS 진입점 (web 코드 import)
├── src-tauri/
│   ├── src/
│   │   ├── main.rs       # 앱 진입점
│   │   ├── commands/     # JS에서 호출하는 Rust 커맨드
│   │   ├── plugins/      # Tauri 플러그인 (파일 감시, 트레이 등)
│   │   └── lib.rs
│   ├── Cargo.toml
│   ├── tauri.conf.json   # 창 설정, 권한, 빌드 경로
│   └── capabilities/     # 세분화된 권한 선언
└── package.json
```

## web 코드 재사용

- WebView가 web의 빌드 결과를 로드한다.
- `@flux/ui`, `@flux/store`, `@flux/editor-core` 전부 공유.
- **desktop 전용 코드만** 이 디렉토리에 둔다.

## desktop 전용 기능

- **파일 시스템 감시**: 로컬 폴더 드래그앤드롭 수집, 폴더 watch
- **시스템 트레이**: 빠른 수집, 상태 표시
- **로컬 DB**: 오프라인 캐시 (SQLite via Tauri plugin)
- **자동 업데이트**: Tauri updater
- **글로벌 단축키**: 앱 외부에서 빠른 수집

## IPC 패턴

JS → Rust: `invoke('command_name', { payload })` 로 호출.
Rust → JS: `emit('event_name', payload)` 로 이벤트 전달.
무거운 파일 처리는 항상 Rust에서 수행하고 결과만 JS로 전달한다.

## 명령어

```bash
pnpm dev              # Tauri dev (WebView + Rust 핫리로드)
pnpm build            # 프로덕션 빌드 (.dmg, .msi, .AppImage)
```
