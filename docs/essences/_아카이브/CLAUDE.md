# CLAUDE.md

## Project Overview

Electron + React + TypeScript desktop application boilerplate. Currently implementing VS Code-inspired layout system (file explorer, tabs with Chrome animations, split views). Once complete, you'll have a ready-to-use desktop app foundation - just add your features!

### Development Workflow

```
1. Setup & Configuration → 2. Layout Structure → 3. Feature Development → 4. Folder Organization
                                                           ↓
                                              Demo → Test → Integrate → Ship
```

## Development Guidelines

## Do

- Start all features in demos/
- Use absolute imports (@/)
- Check shared/components/ui/ first

## Don't

- Avoid hardcoded colors - use the theme
- Don't add dependencies without approval

## Essential Commands

### Development
```bash
npm start                    # Start Electron dev server with hot reload
npm run make                 # Build production app (output in out/)
npm run lint                 # Run ESLint
npm test                     # Run Vitest tests
npm run test:watch          # Run tests in watch mode
npm run test:ui             # Open Vitest UI
npm run test:coverage       # Generate test coverage report
```

### Database Management
```bash
npx drizzle-kit push        # Push schema changes to Supabase
npx drizzle-kit generate    # Generate migration files
npx drizzle-kit studio      # Open Drizzle Studio GUI
```

### Initial Setup
```bash
npm install                  # Install dependencies
cp .env.example .env         # Create env file - add Supabase credentials
npx drizzle-kit push        # Initialize database schema
```

## Git Commit Convention

Follow `.gitmessage.txt` template for all commits:

### Prefix Format
- **Frontend changes**: `[FE]feat:`, `[FE]fix:`, `[FE]docs:`, etc.
- **Backend changes**: `[BE]feat:`, `[BE]fix:`, `[BE]docs:`, etc.
- **Cross-cutting/Infrastructure**: Use appropriate prefix or omit if both FE+BE

### Commit Types
- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅 (코드 변경 없음)
- `refactor`: 코드 리팩토링
- `test`: 테스트 코드 추가/수정
- `chore`: 빌드, 패키지 매니저 수정
- `comment`: 주석 추가/변경
- `remove`: 파일/폴더 삭제
- `rename`: 파일/폴더명 수정

### Examples (Korean preferred)
```
[FE]feat: VS Code 탭 시스템 드래그&드롭 구현
[BE]feat: 보조 창 생성 IPC 핸들러 추가
[FE]fix: 탭 닫기 애니메이션 타이밍 이슈 해결
docs: VSCode Tabs 구현 가이드 업데이트
```

### Subject Verbs (if writing in English)
Add, Remove, Simplify, Update, Implement, Prevent, Move, Rename

## 📁 Project Structure

The project's structure is organized into four primary directories to enforce a clear separation of concerns and a "Demo → Feature" workflow:

- **`demos/`**: The starting point for all new features. Used for experimentation and prototyping.
- **`features/`**: Contains stable, production-ready modules that have been validated in the `demos` phase.
- **`app/`**: Core infrastructure including layout system, view management, and VS Code/Chrome integrations.
- **`shared/`**: Reusable components, utilities, hooks, and types used across the application.

### Folder Responsibilities

| Folder | Purpose | When to Use |
|--------|---------|-------------|
| `demos/` | Experimental features, prototypes | Starting new features, testing ideas |
| `features/` | Stable, tested features | After demo validation |
| `app/` | Infrastructure, framework | Core system components |
| `shared/` | Utilities, common code | Reusable across features |

### Feature Development Cycle

1. **Demo First** (`src/demos/`): Create experimental prototypes
2. **Test & Iterate**: Validate functionality and UX
3. **Extract to Features** (`src/features/`): Stable, production-ready code
4. **Integrate**: Connect to main application infrastructure
5. **Ship**: Deploy with confidence

#### Demo-First Workflow Example

**Step 1: Create a Demo** (Fast experimentation)
```typescript
// src/demos/my-feature/MyFeatureDemo.tsx
export const MyFeatureDemo = () => {
  // Quick prototype - no need for perfect code
  return <div>Experimental feature</div>;
};
```

**Step 2: Add to Demo Index**
```typescript
// src/demos/DemoIndex.tsx
{
  title: 'My Feature',
  path: '/demos/my-feature',
  status: 'wip'  // or 'complete'
}
```

**Step 3: Test in Browser**
- Navigate to `/demos` to see all demos
- Test your feature in isolation
- Iterate quickly without affecting main app

**Step 4: Extract to Production** (After validation)
```typescript
// Move stable parts to src/features/my-feature/
// Add proper types, error handling, tests
// Integrate with app infrastructure
```

This workflow allows rapid prototyping while maintaining code quality in production features.

```
electron-boilerplate/
├── src/
│   ├── demos/              # 🧪 Experimental features (Demo → Test)
│   │   ├── vscode-tabs/          # VS Code tab implementation
│   │   ├── chrome-tabs/          # Chrome tab animations
│   │   ├── split-view/           # VS Code split view system
│   │   ├── file-explorer/        # File explorer demo
│   │   └── DemoIndex.tsx          # Demo showcase page
│   │
│   ├── features/           # ✅ Production-ready features
│   │   ├── file-explorer/        # File system browser with virtual scrolling
│   │   └── tab-system/           # Basic tab components (TabBar, TabItem)
│   │
│   ├── app/                # 🏗️ Core application infrastructure
│   │   ├── layout/              # Layout system (MasterLayout, Sidebars)
│   │   ├── views/               # View systems (split-view)
│   │   ├── integrations/        # External integrations (VS Code, Chrome)
│   │   └── config/              # Configuration (workspace settings)
│   │
│   └── shared/             # 🔧 Shared utilities
│       ├── components/ui/       # Reusable UI components
│       ├── lib/                 # Utility functions
│       ├── hooks/               # Shared React hooks
│       └── types/               # TypeScript types
│
├── public/                 # Static assets
├── .env                    # Environment variables
└── package.json           # Dependencies

```

### Component Architecture

The project follows Clean Architecture principles for better separation of concerns.

The app uses a 3-panel layout inspired by VS Code:
- **LeftSidebar**: File explorer with tree view, drag & drop, context menus
- **MainViewArea**: Split-view capable content area with tabs
- **RightSidebar**: Collapsible panel for AI chat or additional tools

Key components:
- `MasterLayout`: Orchestrates panel state and keyboard shortcuts
- `FileExplorerContent`: Virtual scrolling file tree with optimization for large directories
- `SimpleTitlebar`: Custom frameless window controls with tab management
- `ViewContainer`: Handles different view types (Grid, List, Masonry, Note)

### IPC Communication Pattern

Type-safe IPC using contracts:
1. Define contract in `src/shared/ipc/contracts.ts`
2. Implement handler in `src/backend/interfaces/ipc/[feature]Handler.ts`
3. Register in `src/backend/interfaces/ipc/index.ts`
4. Access via `window.electronAPI` in renderer

Example:
```typescript
// Contract
export interface FileAPI {
  listDirectory(path: string): Promise<FileItem[]>;
}

// Usage
const files = await window.electronAPI.file.listDirectory(path);
```

## Import Guidelines

### Feature Imports
```typescript
// Import from feature modules
import { FileExplorerContent } from '@/features/file-explorer';
import { TabBar } from '@/features/tab-system';
```

### App Infrastructure Imports
```typescript
// Layout and views
import { MasterLayout } from '@/app/layout/components/MasterLayout';
import { useEditorGroupStore } from '@/app/views/split-view/stores/useEditorGroupStore';

// Configuration
import { useWorkspace } from '@/app/config/workspace/hooks/useWorkspace';

// Integrations
import { GridView } from '@/app/integrations/vscode/core/GridView';
import { VSCodeIntegratedTabs } from '@/app/integrations/vscode/components/VSCodeIntegratedTabs';
```

### Shared Imports
```typescript
// UI components
import { Button } from '@/shared/components/ui/button';
import { Dialog } from '@/shared/components/ui/dialog';

// Contracts and types
import { FileItem } from '@/shared/ipc/contracts';
import { ViewType } from '@/shared/types/view.types';

// Utilities
import { cn } from '@/shared/lib/utils';
```

### Demo Imports (Development)
```typescript
// Import demos for testing
import { SplitViewDemo } from '@/demos/split-view/SplitViewDemo';
import { VSCodeTabsDemo } from '@/demos/vscode-tabs/VSCodeTabsDemo';
```

## Performance Optimization Patterns

### React Optimization
- Use `React.memo` with custom comparison functions for complex components
- Implement `useMemo` and `useCallback` for expensive computations and stable references
- Virtual scrolling for file lists > 100 items

### IPC Optimization
- Request caching with TTL in `useFileSystemOptimized`
- Batch operations for multiple file operations
- Debounced directory watchers

## Testing Strategy

- Unit tests with Vitest for business logic
- React Testing Library for component tests
- Test files co-located with source in `__tests__` folders
- Mock IPC calls in tests using `vi.mock`

## Key Hooks

### File System
- `useFileSystem`: File operations abstraction
- `useFileOperations`: File CRUD operations with undo/redo
- `useFileStatus`: File status monitoring

### UI State
- `useDragContext`: Unified drag & drop management
- `useWorkspace`: Current workspace state management
- `useEditorGroupStore`: Split view state management

### Layout
- `useLayoutStore`: Global layout state (Zustand)

## Database Schema

Drizzle ORM with PostgreSQL (Supabase):
- Schema defined in `src/backend/infrastructure/db/schema.ts`
- Migrations in `drizzle/` directory
- Connection via `DATABASE_URL` env variable

## Code Style (from main-rules.mdc)

- 반말 사용 ("합니다" → "해")
- SOLID 원칙과 Clean Architecture 준수
- DRY 원칙 - 중복 코드 제거
- YAGNI - 당장 필요 없는 기능 만들지 않기
- 함수명은 목적을 표현 (구현 방법 X)
- 매직 넘버 대신 상수 사용
- BDD 방식으로 테스트 작성 (행동 중심 개발)

## Writing Style (문서 작성 스타일)

문서와 설명을 작성할 때는 자연스럽게 흐르는 서술형을 사용한다.

### 핵심 원칙

서술형 중심으로 쓴다. 리스트는 항목 나열이 불가피할 때만 사용한다.

- 레이블 없이 흐름있게 ("핵심:", "왜:" 제거)
- 강조 표시 쓰지 않기 (중요한 부분은 다음 줄로 띄우거나 "특히" 같은 연결어 사용)
- "~한다", "~이다" 반말 사용
- 연결어로 자연스럽게 이어가기 ("이렇게 하면", "그래야", "때문이다")
- 대화하듯 설명하기
- 논리적 흐름 유지 (무엇 → 왜 → 어떻게)
- 문단은 2-3문장으로 짧게

예외: 제목, 섹션 헤더, 나쁜/좋은 예 라벨은 사용 가능

### 구체적 예시

**1. 성능/수치 설명 (서술형)**

나쁜 예:
```
성능 기준:
- 0-50K: 최고 (95%+)
- 50-100K: 양호 (85-90%)
```

좋은 예:
```
AI는 컨텍스트에 따라 성능이 다르다. 0-50K에서는 최고 성능(95%+)을 내지만,
50-100K에서는 양호(85-90%)하고, 100-150K에서는 주의가 필요하다(75-85%).
```

**2. 항목 나열 (짧은 서술 + 리스트)**

나쁜 예:
```
제외 항목:
목적: 토큰 절약
- node_modules (500K)
```

좋은 예:
```
.gitignore는 컨텍스트 관리의 첫 번째 방어선이다.

제외 항목:
- node_modules: 500K 절약 (필수!)
- dist/, out/: 50K 절약
- .cache/, *.log: 10K 절약
```

**3. 흐름 설명 (완전 서술형)**

나쁜 예:
```
단계:
1. Demo (28K)
2. Feature (50K)

각 단계별 agent 사용.
```

좋은 예:
```
Demo → Feature 흐름에서 컨텍스트가 단계적으로 증가한다.

Demo 단계에서는 28K만 쓴다. demos/ 폴더에 프로토타입을 만들 때는 전체
아키텍처를 몰라도 된다. demo-developer agent를 쓰면 실험 철학과 코딩 규칙만으로
빠르게 작업할 수 있다.

Feature 단계에서는 50K를 쓴다. features/로 승격할 때는 아키텍처를 이해해야 한다.
feature-integrator agent가 컴포넌트 구조와 IPC 패턴을 알고 있어서 통합을 돕는다.
```

**4. 구성 요소 설명 (설명 중심)**

나쁜 예:
```
Agent 3개:
- demo-developer: 프로토타이핑
- feature-integrator: 통합
```

좋은 예:
```
프로젝트 특화 agent 템플릿 3개를 만든다.

demo-developer는 Demo phase 전문가다. 13K 컨텍스트만 가지고 demos/에서
빠르게 프로토타입을 만든다.

feature-integrator는 Integration phase 전문가다. 32K 컨텍스트로 아키텍처를
이해하고 features/로 승격한다.
```

### 리스트 사용 기준

다음 경우에만 리스트를 사용한다:
- 여러 파일이나 항목을 나열할 때
- 단계별 실행 방법이나 명령어
- 체크리스트

설명이 필요한 경우는 서술형으로 쓴다. 리스트로 나열하지 않는다.

### 서술형을 쓸 때

- 개념 설명, 가이드, 튜토리얼
- 아키텍처 설명
- "왜"와 "어떻게" 설명
- 흐름이나 프로세스 설명

### 서술형을 안 쓸 때

- API 문서, 치트시트
- CLI 도움말, 에러 메시지
- 코드 주석
- 표 형식

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.