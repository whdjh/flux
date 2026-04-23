# `42_hackathon` UI 적용 가이드

이 문서는 현재 프로젝트에 `42_hackathon/app`의 UI/UX를 적용하는 단계를 안내합니다. 이 UI는 Glassmorphism을 기반으로 하며, 다양한 커스텀 컴포넌트와 레이아웃으로 구성되어 있습니다.

## 목차
1.  [필수 라이브러리 설치](#1-필수-라이브러리-설치)
2.  [기반 스타일 및 UI 컴포넌트 복사](#2-기반-스타일-및-ui-컴포넌트-복사)
3.  [데이터 타입 및 커스텀 훅 설정](#3-데이터-타입-및-커스텀-훅-설정)
4.  [핵심 레이아웃 구성](#4-핵심-레이아웃-구성)
5.  [메인 페이지(`index.tsx`) 조립](#5-메인-페이지indextsx-조립)
6.  [주요 기능 컴포넌트 통합](#6-주요-기능-컴포넌트-통합)

---

### 1. 필수 라이브러리 설치

`42_hackathon` 프로젝트는 UI와 애니메이션을 위해 다음과 같은 핵심 라이브러리들을 사용합니다.

```bash
npm install framer-motion lucide-react class-variance-authority clsx tailwind-merge @radix-ui/react-avatar @radix-ui/react-scroll-area @radix-ui/react-separator @radix-ui/react-slot @radix-ui/react-tabs
```

---

### 2. 기반 스타일 및 UI 컴포넌트 복사

UI의 기초가 되는 스타일과 재사용 가능한 컴포넌트들을 먼저 가져옵니다.

#### 가. `globals.css` 복사

`42_hackathon/app/globals.css` 파일의 내용을 현재 프로젝트의 메인 CSS 파일(`src/index.css` 등)에 붙여넣으세요. 이 파일에는 다음이 포함됩니다:
-   Light/Dark 모드를 위한 CSS 변수 (`:root`, `.dark`)
-   Glassmorphism 효과를 위한 핵심 유틸리티 (`.glass-effect`, `.card-glass` 등)
-   전역 스크롤바, 폰트, 기본 애니메이션 설정

#### 나. `components/ui` 디렉토리 복사

`42_hackathon/app/components/ui` 디렉토리 전체를 프로젝트의 `src/components/` 아래로 복사하세요. 이 디렉토리에는 UI의 가장 작은 단위들이 들어있습니다.
-   **`GlassCard.tsx`**: 프로젝트 전반에 사용되는 유리 카드 컴포넌트입니다.
-   **`Button.tsx`, `Input.tsx`, `Badge.tsx` 등**: Glassmorphism 스타일에 맞게 커스터마이징된 기본 UI 요소들입니다.

#### 다. `lib/utils.ts` 복사

`42_hackathon/app/lib/utils.ts` 파일을 프로젝트의 `src/lib/` 디렉토리로 복사하세요. 이 파일은 `cn` 유틸리티 함수를 제공하여 Tailwind CSS 클래스를 조건부로 쉽게 관리할 수 있게 해줍니다.

---

### 3. 데이터 타입 및 커스텀 훅 설정

UI 컴포넌트들은 특정 데이터 구조(props)를 기대하며, 상태 관리를 위해 커스텀 훅을 사용합니다.

#### 가. `types` 디렉토리 복사

`42_hackathon/app/types` 디렉토리 전체를 `src/types`로 복사하세요.
-   `content.ts`: `ContentItem`, `Folder` 등 핵심 데이터 타입을 정의합니다.
-   `database.ts`: Supabase 데이터베이스 스키마에 해당하는 타입을 정의합니다.

#### 나. `hooks` 디렉토리 복사 (또는 참고)

`42_hackathon/app/hooks` 디렉토리의 훅들은 UI의 상태와 로직을 관리합니다. `src/hooks`로 복사하거나, 필요에 맞게 직접 구현할 수 있습니다.
-   **`useSidebarResize.ts`**: 리사이즈 가능한 사이드바의 너비 조절 로직을 담당합니다.
-   **`useViewManager.ts`**, **`useTabManager.ts`**: 콘텐츠 뷰 모드와 탭 상태를 관리합니다.
-   **`useContent.ts`**, **`use-auth.ts`**: 데이터 CRUD 및 인증 로직을 포함합니다. UI를 연결하려면 비슷한 형태의 훅이 필요합니다.

---

### 4. 핵심 레이아웃 구성

이제 기본 부품들을 이용해 앱의 전체적인 뼈대를 만듭니다. `42_hackathon/app/components/layout` 과 `content` 디렉토리에서 필요한 파일들을 `src/components/` 아래로 복사하세요.

-   **`layout/header.tsx`**: 앱 상단 헤더
-   **`layout/base-sidebar.tsx`**: 좌측 폴더 사이드바
-   **`content/base-content-grid.tsx`**: 중앙 콘텐츠 표시 영역

이 컴포넌트들은 `lucide-react` 아이콘과 `components/ui`의 요소들을 사용하며, `types/content.ts`에 정의된 데이터 타입을 props로 받습니다.

---

### 5. 메인 페이지(`index.tsx`) 조립

각 레이아웃 컴포넌트들을 조립하여 메인 페이지를 구성합니다. `42_hackathon/app/routes/_index.tsx` 파일이 훌륭한 참고 자료가 됩니다.

아래는 주요 구조를 요약한 예시 코드입니다.

```tsx:src/routes/index.tsx
import { useState } from "react";
// ... 필요한 훅과 타입들 import
import { Header } from "@/components/layout/header";
import { BaseSidebar } from "@/components/layout/base-sidebar";
import { BaseContentGrid } from "@/components/content/base-content-grid";
// ...

export default function Index() {
  // ... (useSidebarResize, useViewManager, useTabManager 등 훅 사용)

  return (
    <div className="flex flex-col h-screen bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
      {/* 1. 헤더 */}
      <Header
        // ... (props 전달)
      />
      <div className="flex flex-1 overflow-hidden">
        {/* 2. 사이드바 */}
        <BaseSidebar
          // ... (props 전달)
        />

        {/* 3. 메인 콘텐츠 */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          <BaseContentGrid
            // ... (props 전달)
          />
        </main>
        
        {/* 4. (선택) 우측 패널/사이드바 */}
        {/* ... */}
      </div>
    </div>
  );
}
```

---

### 6. 주요 기능 컴포넌트 통합

마지막으로, 검색, 협업, 메모 등 주요 기능들을 모달이나 패널 형태로 추가합니다.

#### 예시: `SearchModal` 통합하기

1.  **컴포넌트 복사**: `42_hackathon/app/components/search/search-modal.tsx` 파일을 `src/components/search/`로 복사합니다.
2.  **상태 추가**: 메인 페이지(`index.tsx`)에 모달의 열림/닫힘 상태를 추가합니다.
    ```tsx
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    ```
3.  **트리거 연결**: `Header` 컴포넌트의 검색 버튼에 `onClick={() => setIsSearchOpen(true)}`를 연결합니다.
4.  **모달 렌더링**: 메인 페이지의 JSX 최상단에 모달 컴포넌트를 추가합니다.
    ```tsx
    <SearchModal
      isOpen={isSearchOpen}
      onClose={() => setIsSearchOpen(false)}
    />
    ```

동일한 방식으로 `CollabPanel`, `EnhancedMemoSidebar` 등 다른 기능 컴포넌트들도 필요할 때 상태를 추가하고 렌더링하여 통합할 수 있습니다. 