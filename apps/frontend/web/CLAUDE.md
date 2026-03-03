# Flux Web

Next.js 16 App Router 기반 웹 클라이언트. SSR로 공유 링크 SEO를 확보하고,
Tauri WebView와 React 컴포넌트를 공유한다.

## 기술 스택

| 항목 | 선택 |
|---|---|
| 프레임워크 | Next.js 16 (App Router, TypeScript) |
| React | 19, Server Components 활용 |
| 스타일 | Tailwind CSS v4 |
| 상태 관리 | `@flux/store` (Zustand) |
| 에디터 | `@flux/editor-core` (loro CRDT) |
| 패키지 매니저 | pnpm (workspace) |

## 디렉토리

```
web/
├── src/
│   ├── app/                  # App Router
│   │   ├── (main)/           #   인증된 사용자 레이아웃 (쉘 조립)
│   │   ├── share/[id]/       #   공유 링크 읽기 전용 뷰 (SSR)
│   │   └── api/              #   AI 프록시, 인증 API Routes
│   ├── features/             # FSD features (→ frontend/CLAUDE.md 참조)
│   ├── entities/             # FSD entities
│   └── shared/               # 앱 내 공유 (패키지에 없는 웹 전용 유틸)
├── public/
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## 명령어

```bash
pnpm dev              # http://localhost:3000
pnpm build            # 프로덕션 빌드
pnpm lint             # ESLint
```
