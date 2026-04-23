# Documentation / 문서

> VS Code + Chrome UX Patterns Boilerplate
> VS Code + Chrome UX 패턴 보일러플레이트

## Quick Start / 빠른 시작

```bash
npm install
npm start
# Visit http://localhost:3000/demos
```

**[Setup Guide / 설정 가이드](./04-guides/setup.md)** - Start in 5 minutes / 5분 만에 시작

## What is this? / 이게 뭔가요?

**A desktop app boilerplate with proven UX patterns / 검증된 UX 패턴을 가진 데스크톱 앱 보일러플레이트**

- **VS Code Layout**: 3-panel, split views, file explorer / 3패널, 분할 뷰, 파일 탐색기
- **Chrome Animations**: 200ms transitions, smooth tab effects / 200ms 전환, 부드러운 탭 효과
- **Production Ready**: TypeScript, React, Electron / 프로덕션 준비 완료

## Core Features / 핵심 기능

### Implemented / 구현 완료
| Feature / 기능 | Source / 출처 | Status |
|---------------|--------------|------|
| 3-Panel Layout | VS Code | Complete |
| Tab System | VS Code | Complete |
| Tab Animations (200ms) | Chrome | Complete |
| Split Views | VS Code | Complete |
| File Explorer | VS Code | Complete |
| Drag & Drop | VS Code | Complete |

## Documentation / 문서

### Why These Patterns? / 왜 이 패턴들인가?
- **[Why VS Code & Chrome?](./01-rationale/why-vscode-chrome.md)** - Scientific backing / 과학적 근거
- **[Design Philosophy](./01-rationale/design-philosophy.md)** - Core principles / 핵심 원칙
- **[Trade-offs](./01-rationale/tradeoffs.md)** - What we chose / 우리의 선택

### 📐 Architecture Decisions / 아키텍처 결정
- **[ADR-001: 3-Panel Layout](./02-decisions/ADR-001-layout-system.md)** - Fitt's Law, F-Pattern
- **[ADR-002: 200ms Animation](./02-decisions/ADR-002-tab-animation.md)** - Cognitive tracking
- **[ADR-003: Split Views](./02-decisions/ADR-003-split-view-system.md)** - Context switching

### 📋 Specifications / 명세
- **[VS Code Tabs](./03-specifications/bdd/vscode-tab-system.feature.md)** - Tab behaviors / 탭 동작
- **[Chrome Animations](./03-specifications/bdd/chrome-tabs.feature.md)** - Animation specs / 애니메이션 명세
- **[Split Views](./03-specifications/bdd/split-view.feature.md)** - Multi-pane / 다중 패널
- **[File Explorer](./03-specifications/bdd/file-explorer.feature.md)** - File tree / 파일 트리

### 🛠 Guides / 가이드
- **[Setup](./04-guides/setup.md)** - Installation / 설치
- **[Development](./04-guides/development.md)** - Demo-first workflow / 데모 우선 워크플로우
- **[Contributing](./04-guides/contributing.md)** - How to help / 기여 방법

## Project Structure / 프로젝트 구조

```
src/
├── demos/        # Start here! / 여기서 시작!
├── features/     # Production code / 프로덕션 코드
├── app/          # Core infrastructure / 핵심 인프라
└── shared/       # Utilities / 유틸리티
```

### Demo-First Workflow / 데모 우선 워크플로우
1. **Create in `demos/`** - Fast prototyping / 빠른 프로토타이핑
2. **Test & iterate** - Validate UX / UX 검증
3. **Move to `features/`** - Production ready / 프로덕션 준비

## Key Commands / 주요 명령어

```bash
# Development / 개발
npm start              # Start dev server / 개발 서버 시작
npm run make          # Build app / 앱 빌드
npm test              # Run tests / 테스트 실행

# Database / 데이터베이스
npx drizzle-kit push     # Push schema / 스키마 푸시
npx drizzle-kit studio   # Open GUI / GUI 열기
```

## Customization / 커스터마이징

### Where to modify / 수정 위치
- **Theme**: `shared/styles/` - CSS variables / CSS 변수
- **Layout**: `app/layout/` - Panel sizes / 패널 크기
- **Shortcuts**: `app/config/` - Keyboard shortcuts / 키보드 단축키

## Tech Stack / 기술 스택

- **Frontend**: React, TypeScript, Tailwind CSS
- **Desktop**: Electron, IPC
- **Database**: Drizzle ORM, Supabase
- **Testing**: Vitest, React Testing Library

## References / 참고 자료

- [VS Code Source](https://github.com/microsoft/vscode)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Electron Docs](https://www.electronjs.org/)

---

## Getting Help / 도움 받기

- **Demos**: Run app and visit `/demos` / 앱 실행 후 `/demos` 방문
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

## Language Note / 언어 안내

개발 용어는 영어, 설명은 한글/영어 병기
Technical terms in English, explanations in Korean/English