# Electron & React Boilerplate

[보일러 플레이트란? - wiky](https://ko.wikipedia.org/wiki/%EC%83%81%EC%9A%A9%EA%B5%AC_%EC%BD%94%EB%93%9C)

  초기 설정 없이 기능, 라우팅, UI만 만들면 됩니다.
  최신 기술 스택을 사용하였습니다.
  
  데스크톱 앱(Electron, React, Vite, TypeScript), UI 컴포넌트(shadcn/ui, Tailwind CSS), 라우팅(React Router v7), DB(Supabase), DB ORM(Drizzle)

  1.  기능 (Feature) 만들기: 기능을 `src/features` 폴더에 만들기
  2.  UI 컴포넌트 사용하기: `shadcn/ui`로 UI 가져오기
  3.  라우터에 연결하기: `src/routes`와 `src/renderer.tsx`를 통해 띄우기

## 목차

  - [링크](#링크)
  - [스택](#스택)
  - [구조](#구조)
  1. [시작하기](#1-시작하기-getting-started)
  2. [핵심 워크플로우 (Core Workflow)](#2-핵심-워크플로우-core-workflow)
  3. [명령어](#3-필수-명령어-essential-commands)

## 링크

  - Electron Forge: https://www.electronforge.io/
  - React Router: https://reactrouter.com/start/modes
  - Shadcn UI: https://ui.shadcn.com/
  - Aceternity UI: https://ui.aceternity.com/docs/install-tailwindcss
  - Supabase: https://supabase.com/docs/guides/getting-started/quickstarts/reactjs
  - Drizzle ORM: https://orm.drizzle.team/docs/get-started/supabase-new

## 스택

  - 데스크톱 앱: Electron
  - 빌드 툴: Vite
  - 프론트: React
  - 백: Supabase
  - 언어: TypeScript
  - 라우팅: React Router v7
  - CSS: Tailwind CSS v4
  - UI 컴포넌트: Shadcn UI
  - ORM(데이터베이스 관리 도구): Drizzle

  <!-- ++ Supabase Auth(인증), Shopify(결제), Netlify(배포), Aceternity UI(애니메이션) 추가 가능 -->

## 구조

```
my-app/
├── assets/
│   └── icons/              # 패키징 아이콘(app.icns/app.ico/app.png)
├── public/                 # 런타임 정적 에셋(이미지/아이콘 등)
├── src/
│   ├── backend/            # (얇은 Clean Architecture)
│   │   ├── domain/         # 엔티티/값객체/도메인 이벤트(순수)
│   │   ├── application/    # 유스케이스(서비스), 포트
│   │   ├── infrastructure/ # DB/FS/HTTP 어댑터, repositories, db client/schema
│   │   └── interfaces/     # IPC/HTTP 어댑터 (등록지점)
│   │       └── ipc/
│   ├── main/               # Electron 통합(부트스트랩/윈도우/메뉴/트레이)
│   ├── preload/            # 프리로드(브리지)
│   ├── shared/             # 공용 타입/상수/IPC 계약
│   │   └── ipc/
│   ├── components/         # 전역 공용 컴포넌트
│   │   └── ui/             # Shadcn/UI 컴포넌트
│   ├── features/           # 기능별 모듈
│   ├── hooks/              # 전역 훅
│   ├── lib/                # 전역 유틸
│   ├── routes/             # 페이지/레이아웃
│   │   ├── root.tsx        # 앱의 고정 레이아웃(뼈대)
│   │   └── ...
│   ├── index.css           # 전역 CSS
│   ├── main.ts             # (엔트리) Electron 메인
│   ├── preload.ts          # (엔트리) 프리로드
│   └── renderer.tsx        # (엔트리) React 렌더러
├── .env.example            # 환경 변수 템플릿
├── index.html              # React HTML 엔트리
├── package.json            # 스크립트/의존성
├── tsconfig.*.json         # TypeScript 설정 파일
└── vite.*.config.ts        # Vite 설정 파일
```

## 폴더 생성

```bash
# 프로젝트 루트에서 실행 (my-app/)
mkdir -p \
  assets/icons \
  public/icons \
  src/backend/domain \
  src/backend/application \
  src/backend/infrastructure/db \
  src/backend/infrastructure/repositories \
  src/backend/interfaces/ipc \
  src/main/bootstrap \
  src/main/windows \
  src/main/ipc \
  src/main/menu \
  src/main/tray \
  src/main/security \
  src/main/utils \
  src/preload \
  src/shared/ipc \
  src/components/ui \
  src/features \
  src/hooks \
  src/lib \
  src/routes

# 존재하지 않을 때만 기본 파일 생성(있으면 무시)
[ -f src/shared/ipc/contracts.ts ] || echo "export const IPC_WINDOW = { MINIMIZE: 'window:minimize', TOGGLE_MAXIMIZE: 'window:toggleMaximize', IS_MAXIMIZED: 'window:isMaximized', CLOSE: 'window:close', MAXIMIZE_CHANGED: 'window:maximize-changed', } as const;" > src/shared/ipc/contracts.ts
[ -f src/backend/interfaces/ipc/registerWindowControls.ts ] || cat > src/backend/interfaces/ipc/registerWindowControls.ts <<'EOF'
import { BrowserWindow, ipcMain } from 'electron';
import { IPC_WINDOW } from '@shared/ipc/contracts';

export function registerWindowControlsIPC(window: BrowserWindow): void {
  ipcMain.removeHandler(IPC_WINDOW.MINIMIZE);
  ipcMain.removeHandler(IPC_WINDOW.TOGGLE_MAXIMIZE);
  ipcMain.removeHandler(IPC_WINDOW.IS_MAXIMIZED);
  ipcMain.removeHandler(IPC_WINDOW.CLOSE);

  ipcMain.handle(IPC_WINDOW.MINIMIZE, () => BrowserWindow.getFocusedWindow()?.minimize());
  ipcMain.handle(IPC_WINDOW.TOGGLE_MAXIMIZE, () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return false;
    if (win.isMaximized()) { win.unmaximize(); return false; }
    win.maximize(); return true;
  });
  ipcMain.handle(IPC_WINDOW.IS_MAXIMIZED, () => BrowserWindow.getFocusedWindow()?.isMaximized() ?? false);
  ipcMain.handle(IPC_WINDOW.CLOSE, () => BrowserWindow.getFocusedWindow()?.close());

  window.on('maximize', () => window.webContents.send(IPC_WINDOW.MAXIMIZE_CHANGED, true));
  window.on('unmaximize', () => window.webContents.send(IPC_WINDOW.MAXIMIZE_CHANGED, false));
}
EOF
```

---

## 1. 시작하기 (Getting Started)

#### 1단계: 프로젝트 복제 및 설치

```bash
git clone [repository-url] my-app
cd my-app
npm install
```

#### 2단계: 환경 변수 설정
`.env.example` 파일을 복사하여 `.env` 파일을 만들고, Supabase 대시보드에서 발급받은 키들을 채워넣으세요.

```bash
cp .env.example .env
```
`.env` 파일에는 다음 값들이 필요합니다:
Supabase 프로젝트 생성 후 `Project Settings > Database > Connect > App Frameworks (Framework: React, Using: Vite)`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

`Project Settings > Database > Connection string > Transaction pooler`
- `DATABASE_URL`

#### 3단계: 데이터베이스 스키마 동기화
`src/backend/infrastructure/db/schema.ts`에 정의된 초기 테이블 구조를 실제 Supabase 데이터베이스에 반영합니다.

```bash
npx drizzle-kit push
```

#### 4단계: 개발 서버 실행

```bash
npm start
```

---

## 2. 핵심 워크플로우 (Core Workflow)

  이 템플릿은 "기능(Feature)을 만들고, 페이지(Page)에서 조립하여, 라우터(Router)에 등록한다"는 간단한 규칙을 따릅니다.

### 가이드 1: 기능 개발 공식 (Feature → Page → Router)

  1.  Feature 생성: `src/features/` 안에 기능의 핵심 로직과 UI를 작성합니다.
  2.  Page 생성: `src/routes/` 안에, 1번에서 만든 Feature를 가져와 하나의 완전한 페이지(뷰)로 조립합니다.
  3.  Router 등록: `src/renderer.tsx`에서 URL 경로(`path`)에 2번에서 만든 페이지(`element`)를 연결합니다. 이제 `root.tsx` 등 필요한 곳에 `<Link>`를 추가하여 페이지에 접근할 수 있습니다.

### 가이드 2: 다중 패널 레이아웃
  Obsidian처럼 복잡한 레이아웃을 만들고 싶다면, `Page` 컴포넌트가 여러 `Feature`를 조립하면 됩니다. 앱의 고정 뼈대(`root.tsx`)는 그대로 두고, 동적으로 변하는 영역(`Outlet`)에 렌더링될 `Page`만 교체하는 방식입니다.

```tsx
// 예시: src/routes/note-view.tsx
import { EditorFeature } from "../features/editor/EditorFeature";
import { AiAssistantFeature } from "../features/ai/AiAssistantFeature";

// 'NoteViewPage'는 두 개의 Feature를 조립하여 뷰를 만든다.
export default function NoteViewPage() {
  return (
    <div className="flex h-full">
      <EditorFeature />         {/* 메인 패널 */}
      <AiAssistantFeature />    {/* 사이드 패널 */}
    </div>
  );
}
```

### 가이드 3: 데이터베이스 사용법
  `db` 클라이언트(`src/lib/drizzle.ts`)와 테이블 스키마(`src/db/schema.ts`)를 `import`하여 데이터를 사용합니다.

```tsx
// Feature 컴포넌트 내부 예시
import { db } from "@/lib/drizzle";
import { usersTable } from "@/db/schema";

async function getUsers() {
  return await db.select().from(usersTable);
}
```
> Tip: 데이터 CRUD는 Drizzle의 `db` 객체를, 인증(Auth)이나 스토리지(Storage)는 Supabase의 `supabase` 객체(`src/lib/supabase.ts`)를 사용하세요.

### 가이드 4: UI 컴포넌트 추가
`shadcn/ui`로 필요한 UI 컴포넌트를 `src/components/ui`에 직접 추가하여 사용하고, 자유롭게 수정하세요.

```bash
npx shadcn-ui@latest add button card input
```

---

## 3. 필수 명령어 (Essential Commands)

  - `npm start`: 개발 서버 실행.
  - `npx drizzle-kit push`: DB 스키마 동기화.
  - `npm run make`: 프로덕션용 앱 빌드 (결과물은 `out/` 폴더에 생성).